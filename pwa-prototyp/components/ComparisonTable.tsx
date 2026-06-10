'use client'
import {useMemo, useState} from 'react'

type Col = {label: string; unit?: string; numeric?: boolean}
type Row = {cells: string[]}

// Erste Zahl robust aus einer Zelle ziehen — toleriert deutsche Schreibweise (1.234,56),
// Einheiten/Zusätze im Text ("350 (450 …)") und gibt NaN für rein textliche Zellen.
function parseNum(raw: string | undefined): number {
  if (raw == null) return NaN
  const m = String(raw).match(/-?[\d.,]+/)
  if (!m) return NaN
  let t = m[0]
  if (t.includes('.') && t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.') // . = Tausender, , = Dezimal
  } else {
    t = t.replace(',', '.')
  }
  const n = parseFloat(t)
  return Number.isNaN(n) ? NaN : n
}

export function ComparisonTable({block}: {block: any}) {
  const columns: Col[] = block.columns || []
  const rows: Row[] = (block.rows || []).map((r: any) => ({cells: r?.cells || []}))
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (sortCol == null) return rows
    const numeric = !!columns[sortCol]?.numeric
    const arr = [...rows]
    arr.sort((a, b) => {
      const av = a.cells[sortCol] ?? ''
      const bv = b.cells[sortCol] ?? ''
      let cmp: number
      if (numeric) {
        const an = parseNum(av)
        const bn = parseNum(bv)
        const aNaN = Number.isNaN(an)
        const bNaN = Number.isNaN(bn)
        if (aNaN && bNaN) cmp = 0
        else if (aNaN) cmp = 1 // leere / nicht-numerische Zellen ans Ende
        else if (bNaN) cmp = -1
        else cmp = an - bn
      } else {
        cmp = String(av).localeCompare(String(bv), 'de')
      }
      return dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rows, columns, sortCol, dir])

  function toggleSort(i: number) {
    if (sortCol === i) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(i)
      setDir('asc')
    }
  }

  if (!columns.length) return null

  return (
    <section className="comparison">
      {block.title && <h2 className="comparison-title">{block.title}</h2>}

      {/* Smartphone: Sortier-Steuerung (auf dem Desktop sortiert man per Spaltenkopf) */}
      <div className="comparison-sort">
        <label>
          Sortieren nach
          <select
            value={sortCol ?? ''}
            onChange={(e) => setSortCol(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Reihenfolge im Heft</option>
            {columns.map((c, i) => (
              <option key={i} value={i}>
                {c.label}
                {c.unit ? ` (${c.unit})` : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="comparison-dir"
          onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          disabled={sortCol == null}
          aria-label="Sortierrichtung umkehren"
        >
          {dir === 'asc' ? '▲' : '▼'}
        </button>
      </div>

      {/* Breiter Screen: echte Tabelle mit klickbaren Spaltenköpfen */}
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={[c.numeric ? 'num' : '', sortCol === i ? 'sorted' : ''].filter(Boolean).join(' ')}
                  aria-sort={sortCol === i ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" onClick={() => toggleSort(i)}>
                    <span>
                      {c.label}
                      {c.unit && <em className="unit"> [{c.unit}]</em>}
                    </span>
                    <span className="arrow">{sortCol === i ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c, ci) => (
                  <td key={ci} className={c.numeric ? 'num' : ''}>
                    {ci === 0 ? <strong>{row.cells[ci] || '–'}</strong> : row.cells[ci] || '–'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schmaler Screen: jede Zeile als Karte (erste Spalte = Überschrift) */}
      <div className="comparison-cards">
        {sorted.map((row, ri) => (
          <div className="comparison-card" key={ri}>
            <div className="comparison-card-title">{row.cells[0] || '–'}</div>
            <dl>
              {columns.slice(1).map((c, ci) => (
                <div className="comparison-card-row" key={ci}>
                  <dt>
                    {c.label}
                    {c.unit ? <em className="unit"> [{c.unit}]</em> : null}
                  </dt>
                  <dd className={c.numeric ? 'num' : ''}>{row.cells[ci + 1] || '–'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {block.notes && <p className="comparison-notes">{block.notes}</p>}
    </section>
  )
}
