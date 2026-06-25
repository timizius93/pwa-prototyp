// Phase C: füllt EN in alle localeString/Text/BlockContent-Felder der 4 Pilot-Artikel.
// Übersetzungen kommen index-aligned aus /tmp/strings_de.json + /tmp/strings_en.json.
// Patcht published UND draft. Idempotent: vorhandenes EN wird nie überschrieben.
//   node --env-file=.env.local scripts/i18n-apply.mjs [--dry]
import {createClient} from '@sanity/client'
import fs from 'node:fs'
import os from 'node:os'

const DRY = process.argv.includes('--dry')
// Schreiben braucht einen Write-Token. Der READ-Token aus .env.local darf nur lesen;
// wie die Python-Seeds nutzen wir den Sanity-CLI-Login-Token (voller Schreibzugriff).
const cliToken = JSON.parse(
  fs.readFileSync(os.homedir() + '/.config/sanity/config.json', 'utf8'),
).authToken
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2021-06-07', token: cliToken,
  useCdn: false,
})

const de = JSON.parse(fs.readFileSync('/tmp/strings_de.json', 'utf8'))
const en = JSON.parse(fs.readFileSync('/tmp/strings_en.json', 'utf8'))
const MAP = new Map(de.map((d, i) => [d, en[i]]))

const isLocale = (o) => o && typeof o === 'object' && typeof o._type === 'string' && o._type.startsWith('locale')
let filled = 0, missing = new Set()

// Füllt ein Locale-Feld in-place (mutiert clone). Gibt true zurück, wenn etwas gesetzt wurde.
function fill(loc) {
  if (Array.isArray(loc.de)) { // localeBlockContent
    const enEmpty = !Array.isArray(loc.en) || loc.en.length === 0
    if (!enEmpty) return false
    const clone = structuredClone(loc.de)
    for (const blk of clone) for (const ch of (blk.children || [])) {
      const t = (ch.text || '').trim()
      if (!t) continue
      if (MAP.has(t)) { ch.text = MAP.get(t) } else { missing.add(t) }
    }
    loc.en = clone
    filled++
    return true
  } else if (typeof loc.de === 'string') { // localeString/Text
    if (loc.en && String(loc.en).trim()) return false
    const t = loc.de.trim()
    if (!t) return false
    if (MAP.has(t)) { loc.en = MAP.get(t); filled++; return true }
    missing.add(t); return false
  }
  return false
}

function walk(node) {
  if (Array.isArray(node)) { node.forEach(walk); return }
  if (node && typeof node === 'object') {
    if (isLocale(node)) { fill(node); return }
    for (const k of Object.keys(node)) walk(node[k])
  }
}

const q = `*[_type in ["articleEditorial","article"] && (issue._ref==$id || issue._ref=="drafts."+$id)]{ _id, title_mag, body }`
// Hole published + draft Versionen der 4 Artikel.
const docs = await c.fetch(
  `*[_type in ["articleEditorial","article"] && references($issue)]{ _id, title_mag, body }`,
  {issue: 'issue-emtb-042'}
)

let tx = c.transaction()
let touched = 0
for (const d of docs) {
  filled = 0
  const body = structuredClone(d.body || [])
  const title = d.title_mag ? structuredClone(d.title_mag) : null
  walk(body)
  if (title) walk(title)
  if (filled > 0) {
    touched++
    console.log(`${d._id}: ${filled} Felder mit EN gefüllt`)
    const patch = {body}
    if (title) patch.title_mag = title
    tx = tx.patch(d._id, (p) => p.set(patch))
  } else {
    console.log(`${d._id}: nichts zu tun (EN bereits vollständig)`)
  }
}

if (missing.size) {
  console.log(`\n⚠️  ${missing.size} DE-Strings ohne Übersetzung (bleiben DE):`)
  for (const m of [...missing].slice(0, 10)) console.log('   -', JSON.stringify(m.slice(0, 60)))
}

if (DRY) {
  console.log(`\n[DRY] ${touched} Dokumente würden gepatcht. Nichts geschrieben.`)
} else if (touched) {
  await tx.commit()
  console.log(`\n✅ ${touched} Dokumente gepatcht (published + draft).`)
} else {
  console.log('\nNichts zu committen.')
}
