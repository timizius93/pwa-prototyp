// Misst die real vom Browser gewählten Bild-Bytes für iPhone vs. Desktop.
// Nutzt den ECHTEN Chrome-srcset-Resolver (img.currentSrc) + echte Byte-Größen (HEAD/GET).
import {spawn} from 'node:child_process'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PAGE = 'http://localhost:3001/artikel/nicolai-s18-swift'
const PORT = 9222

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--user-data-dir=/tmp/cdp-${Date.now()}`,
    'about:blank',
  ],
  {stdio: 'ignore'},
)

async function getTargetWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/json`)
      const tabs = await r.json()
      const page = tabs.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome-Debug-Port nicht erreichbar')
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  const evHandlers = []
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m)
      pending.delete(m.id)
    } else if (m.method) evHandlers.forEach((h) => h(m))
  }
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id
      pending.set(i, res)
      ws.send(JSON.stringify({id: i, method, params}))
    })
  return {
    ready: new Promise((res) => (ws.onopen = res)),
    send,
    on: (fn) => evHandlers.push(fn),
  }
}

async function measure(client, label, {width, height, dpr, mobile}) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: dpr,
    mobile,
  })
  const loaded = new Promise((res) => {
    const h = (m) => {
      if (m.method === 'Page.loadEventFired') res()
    }
    client.on(h)
  })
  await client.send('Page.navigate', {url: PAGE})
  await Promise.race([loaded, sleep(8000)])
  await sleep(1500) // Hydration

  // Lazy-Bilder zum Laden zwingen → sonst bleibt currentSrc auf dem src-Fallback (1200)
  // stehen und die geräteabhängige srcset-Auswahl wird nie getroffen.
  await client.send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('img')].forEach(i => { i.loading = 'eager'; })`,
  })
  await sleep(5000) // echte srcset-Auswahl laden lassen

  const resp = await client.send('Runtime.evaluate', {
    expression: `JSON.stringify([...document.querySelectorAll('img')]
      .map(i => i.currentSrc || i.src)
      .filter(u => u && u.includes('cdn.sanity.io')))`,
    returnByValue: true,
  })
  const value = resp?.result?.result?.value
  if (!value) {
    console.error(`  [${label}] keine currentSrc gefunden:`, JSON.stringify(resp?.result).slice(0, 200))
    return []
  }
  const urls = [...new Set(JSON.parse(value))]
  return urls
}

async function bytesOf(urls) {
  let total = 0
  const widths = {}
  await Promise.all(
    urls.map(async (u) => {
      try {
        const r = await fetch(u, {headers: {Accept: 'image/webp,image/avif,*/*'}})
        const buf = await r.arrayBuffer()
        total += buf.byteLength
        const w = (u.match(/[?&]w=(\d+)/) || [])[1] || '?'
        widths[w] = (widths[w] || 0) + 1
      } catch {}
    }),
  )
  return {total, count: urls.length, widths}
}

try {
  const wsUrl = await getTargetWs()
  const client = connect(wsUrl)
  await client.ready
  await client.send('Page.enable')
  await client.send('Network.enable')

  const p3 = await bytesOf(await measure(client, 'iPhone3x', {width: 390, height: 844, dpr: 3, mobile: true}))
  const p2 = await bytesOf(await measure(client, 'iPhone2x', {width: 390, height: 844, dpr: 2, mobile: true}))
  const desk = await bytesOf(await measure(client, 'Desktop', {width: 1440, height: 900, dpr: 2, mobile: false}))

  const mb = (b) => (b / 1024 / 1024).toFixed(2)
  const pct = (a, b) => ((1 - a / b) * 100).toFixed(0)
  console.log('\n================ BILD-TRAFFIC EINER GANZEN AUSGABE ================')
  console.log(`Volle Auflösung (Desktop, = Zustand OHNE srcset): ${mb(desk.total)} MB  ${JSON.stringify(desk.widths)}`)
  console.log(`iPhone High-End (DPR 3):  ${mb(p3.total)} MB  (−${pct(p3.total, desk.total)}%)  ${JSON.stringify(p3.widths)}`)
  console.log(`iPhone Standard (DPR 2):  ${mb(p2.total)} MB  (−${pct(p2.total, desk.total)}%)  ${JSON.stringify(p2.widths)}`)
  console.log('==================================================================\n')
} catch (e) {
  console.error('FEHLER:', e.message)
} finally {
  chrome.kill()
  process.exit(0)
}
