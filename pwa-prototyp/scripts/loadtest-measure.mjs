// Last-Test-Messung: lädt die komplette Test-Ausgabe im echten Chrome, liest pro
// Geräteprofil die vom echten srcset-Resolver gewählten Bild-URLs (img.currentSrc) und
// misst deren Größe per gedrosseltem Fetch mit Retry (Sanity rendert die Stufen on-the-fly
// → kleiner Pool nötig). Plus DOM-Größe / JS-Heap. Aufruf: node scripts/loadtest-measure.mjs [url]
import {spawn} from 'node:child_process'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PAGE = process.argv[2] || 'http://localhost:3001/artikel/lasttest-0'
const PORT = 9223
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', `--user-data-dir=/tmp/cdp-lt-${Date.now()}`,
  'about:blank',
], {stdio: 'ignore'})

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const tabs = await (await fetch(`http://localhost:${PORT}/json`)).json()
      const p = tabs.find((t) => t.type === 'page')
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('kein Debug-Port')
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map(), evs = []
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
    else if (m.method) evs.forEach((h) => h(m))
  }
  return {
    ready: new Promise((res) => (ws.onopen = res)),
    send: (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({id: i, method, params})) }),
    on: (fn) => evs.push(fn),
  }
}

async function profile(client, {width, height, dpr, mobile}) {
  await client.send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: dpr, mobile})
  const loaded = new Promise((res) => client.on((m) => m.method === 'Page.loadEventFired' && res()))
  await client.send('Page.navigate', {url: PAGE})
  await Promise.race([loaded, sleep(15000)])
  await sleep(2500)
  const r = await client.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `JSON.stringify({
      urls: [...new Set([...document.querySelectorAll('img')].map(i=>i.currentSrc||i.src).filter(u=>u&&u.includes('cdn.sanity.io')))],
      imgTags: document.querySelectorAll('img').length,
      domNodes: document.querySelectorAll('*').length,
      heapMB: Math.round((performance.memory?.usedJSHeapSize||0)/1048576)
    })`,
  })
  return JSON.parse(r.result.result.value)
}

async function fetchSize(u, tries = 4) {
  for (let t = 0; t < tries; t++) {
    try {
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), 30000)
      const r = await fetch(u, {headers: {Accept: 'image/webp,image/avif,*/*'}, signal: ctrl.signal})
      clearTimeout(to)
      if (!r.ok) throw new Error(r.status)
      return (await r.arrayBuffer()).byteLength
    } catch { await sleep(400 * (t + 1)) }
  }
  return 0
}

async function bytesOf(urls) {
  let total = 0, fails = 0
  const queue = [...urls]
  async function worker() {
    for (let u = queue.shift(); u !== undefined; u = queue.shift()) {
      const s = await fetchSize(u)
      if (s === 0) fails++; total += s
    }
  }
  await Promise.all(Array.from({length: 8}, worker)) // klein halten: Sanity-Transform-Limit
  return {total, fails}
}

try {
  const client = connect(await getWs())
  await client.ready
  await client.send('Page.enable')
  await client.send('Network.enable')

  const desk = await profile(client, {width: 1440, height: 900, dpr: 2, mobile: false})
  const phone = await profile(client, {width: 390, height: 844, dpr: 2, mobile: true})
  const deskB = await bytesOf(desk.urls)
  const phoneB = await bytesOf(phone.urls)
  const mb = (b) => (b / 1048576).toFixed(1)

  console.log(`\n========= LAST-TEST (echte Magazin-Bilder): ${PAGE.split('/').pop()} =========`)
  console.log(`DOM-Last:   ${phone.imgTags} img-Tags · ${phone.domNodes} Knoten · JS-Heap ${phone.heapMB} MB`)
  console.log(`Bild-Traffic über die ganze Ausgabe (im Lese-Durchlauf sichtbare Bilder):`)
  console.log(`  Desktop (volle Aufl.): ${mb(deskB.total)} MB  (${desk.urls.length} Bilder, ${deskB.fails} Fehlversuche)`)
  console.log(`  iPhone (DPR2, srcset): ${mb(phoneB.total)} MB  (${phone.urls.length} Bilder, ${phoneB.fails} Fehlversuche)`)
  console.log(`  → srcset spart mobil −${((1 - phoneB.total / deskB.total) * 100).toFixed(0)}%`)
  console.log(`  Schnitt/Bild iPhone: ${Math.round(phoneB.total / 1024 / Math.max(1, desk.urls.length - phoneB.fails))} KB`)
  console.log('====================================================================\n')
} catch (e) {
  console.error('FEHLER:', e.message)
} finally {
  chrome.kill()
  process.exit(0)
}
