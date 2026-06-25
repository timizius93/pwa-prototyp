// Phase A: sammelt alle eindeutigen DE-Leaf-Strings (localeString/Text + Portable-Text-Spans),
// die noch kein EN haben. Output: /tmp/strings_de.json (sortierte Liste).
import {createClient} from '@sanity/client'
import fs from 'node:fs'

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2021-06-07', token: process.env.SANITY_READ_TOKEN,
  useCdn: false, perspective: 'drafts',
})

const isLocale = (o) => o && typeof o === 'object' && typeof o._type === 'string' && o._type.startsWith('locale')
const need = new Set()

// Sammelt aus einem Locale-Feld die DE-Leafs, falls EN fehlt/leer.
function collect(loc) {
  if (Array.isArray(loc.de)) { // localeBlockContent
    const enEmpty = !Array.isArray(loc.en) || loc.en.length === 0
    if (!enEmpty) return
    for (const blk of loc.de) for (const ch of (blk.children || [])) {
      const t = (ch.text || '').trim()
      if (t) need.add(t)
    }
  } else if (typeof loc.de === 'string') { // localeString/Text
    if (loc.en && String(loc.en).trim()) return
    const t = loc.de.trim()
    if (t) need.add(t)
  }
}

function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk)
  if (node && typeof node === 'object') {
    if (isLocale(node)) { collect(node); return }
    for (const k of Object.keys(node)) walk(node[k])
  }
}

const q = `*[_type in ["articleEditorial","article"] && issue._ref==$id]{ _id, title_mag, body }`
const docs = await c.fetch(q, {id: 'issue-emtb-042'})
for (const d of docs) { walk(d.title_mag); walk(d.body) }

const list = [...need].sort()
fs.writeFileSync('/tmp/strings_de.json', JSON.stringify(list, null, 1))
console.log('unique DE leaf strings ohne EN:', list.length)
console.log('Zeichen gesamt:', list.reduce((n, s) => n + s.length, 0))
