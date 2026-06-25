# Briefing: Unabhängige Skalierbarkeits-Einschätzung der Magazin-PWA

> Begleittext zur Codebase. Gedacht als neutrale Vorlage für eine unabhängige
> (KI-)Code-Review mit Fokus **Skalierbarkeit Pilot → Produktion**.

## Worum es geht

Wir entwickeln eine Progressive Web App (PWA), die digitale Magazine ausliefert:
einen Reader im „digitales Heft"-Stil plus ein Redaktions-CMS zum Einpflegen der
Inhalte. Mittelfristig soll sie die heutige native Magazin-App ablösen, über die
**vier Bike-Magazine** (ENDURO, E-MOUNTAINBIKE, GRAN FONDO, DOWNTOWN) erscheinen.

Aktuell liegt ein **lauffähiger Pilot** vor — eine Ausgabe eines Magazins, real
eingepflegt. Vor der Produktions-Entscheidung wollen wir eine **unabhängige,
ehrliche Einschätzung der Skalierbarkeit** dieser Codebase.

## Tech-Stack

- **CMS:** Sanity (Headless, gehostet) — Schema + Studio im Ordner `sanity-studio/`.
- **Reader:** Next.js (App Router, React), ausgeliefert als PWA mit Service Worker
  (Offline-Lesen). Code im Ordner `pwa-prototyp/`.
- **Hosting:** Vercel (Reader). Cloudflare als CDN-Schicht vor den Bildern (geplant).
- **Bilder:** kommen direkt vom Sanity-CDN über `<img>` + `srcset` — bewusst **nicht**
  über den `next/image`-Optimizer.
- **Sprachen:** Inhalte durchgängig zweisprachig (DE + EN).

## Aktueller Stand (Pilot)

- 1 Magazin, 1 Ausgabe real eingepflegt: ~6 Inhalts-Panels (Artikel + Anzeigen).
- ~15–20 wiederverwendbare Inhalts-Bausteine (Fließtext, Foto-Layouts, Pull-Quotes,
  Vergleichstabellen, Award-Boxen, Tester-Carousel sowie interaktive Bausteine wie
  ein Geometrie-Overlay und klickbare Bild-Hotspots).
- Reader: Kiosk (Inhaltsverzeichnis) → Artikel als horizontales Swipe-Carousel.
- Zweisprachig (DE/EN) über einen Sprachumschalter.

## Wohin es skalieren soll (Produktion)

- **4 Magazine**, je **[Ausgaben pro Jahr — Tim: einsetzen]** Ausgaben.
- Pro Ausgabe real gemessen: **~33 Inhalts-Panels** (~24 Artikel + ~9 Anzeigen) und
  **~474 Bilder** (Hochauflösungs-Fotos, viele full-bleed).
- Durchgängig **DE + EN**.
- Leserschaft Größenordnung **[Tim: echte Zahl einsetzen]** pro Ausgabe.
- **Offline-fähig als PWA**, auch auf iOS (Lesen ohne Verbindung).

## Die Frage an dich

Bitte schau dir die Codebase an und schätze sie mit Blick auf die **Skalierung vom
Pilot zur Produktion** ein:

1. **Wo bricht diese Architektur zuerst**, wenn aus einer Ausgabe eines Magazins
   *vier Magazine mit je mehreren Ausgaben pro Jahr* werden?
2. Was ist die **größte strukturelle Schuld** bzw. das größte Architektur-Risiko?
3. Konkret zu:
   - **Datenmodell / Schema** — trägt es 4 Magazine, viele Ausgaben, klare Mandanten-Trennung?
   - **Bild-Auslieferung** — ~474 Bilder/Ausgabe: Bandbreite, Kosten, Caching, Origin-Last.
   - **Rendering & Hosting** — passt die Rendering-Strategie, wie verhalten sich Kosten bei Wachstum?
   - **Redaktions-Workflow** — realistischer Pflegeaufwand bei 4 Magazinen × mehreren Ausgaben.
   - **Performance / Speicher** — große Ausgaben auf mobilen Geräten (insb. iOS).
4. Was würdest du **anders aufsetzen**, wenn es von Anfang an auf diese Größe ausgelegt wäre?

Sei bitte **ehrlich und konkret** — auch unbequeme Befunde. Wir suchen die echten
Schwachstellen und blinden Flecken, keine Bestätigung. Wo du etwas nicht beurteilen
kannst, sag das offen, statt zu raten.
