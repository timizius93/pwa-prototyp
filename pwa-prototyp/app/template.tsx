// template.tsx wird bei jeder Navigation neu gemountet (anders als layout.tsx)
// → die Einblend-Animation läuft bei jedem Seitenwechsel (Kiosk ↔ Artikel, Swipe wie Klick).
export default function Template({children}: {children: React.ReactNode}) {
  return <div className="page-enter">{children}</div>
}
