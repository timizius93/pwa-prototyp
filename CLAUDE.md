# Claude-Kontext für dieses Projekt

Dieses Repo gehört zum Planungs- und Entwicklungsprozess der **41 Publishing Magazin-PWA** — eine Progressive Web App, die mittelfristig die heutige native Magazin-App (Button-Publish-basiert) für alle vier Magazine (ENDURO, E-MOUNTAINBIKE, GRAN FONDO, DOWNTOWN) ablösen soll.

## Du als Claude — vor deinem ersten Tool-Call:

1. **Lies zuerst dein Memory-System.** Es liegt unter
   `~/.claude/projects/-Users-timeckermann-Documents-claude-code-41-Magazin/memory/`
   und enthält die akkumulierte Kontext-Geschichte: Wer der User ist, Projekt-Status, getroffene Entscheidungen, Doc-Templates, Komponenten-Diskussionen.
   Die `MEMORY.md` dort ist der Index.
2. **Lies dann `docs/schema-entwurf.md`** (Sanity-Schema-Konzept) und **`docs/cms-entscheidung.md`** (CMS-/Infra-/Betriebs-Entscheidung) — beides lebendige Dokumente.
3. **Erst dann sprich mit dem User.** Spar dir das Wieder-Aufrollen bereits geklärter Punkte.

## Sprache & Tonalität

- Antworte auf **Deutsch (du-Form)**.
- Tim ist konzeptionell, nicht primär Entwickler — erkläre auf Entscheidungs-Niveau, nicht in Implementierungs-Tiefe.
- Halte Antworten knapp und entscheidungs-orientiert. Lange Code-Walls vermeiden, wenn nicht explizit gefragt.

## Aktueller Projektstand (Mai 2026)

- **Phase:** Risiko-Pilot wird gebaut und ist **lauffähig** (Studio + Reader, siehe „Was bereits gebaut ist"). Noch kein Implementierungs-Budget für die Produktion freigegeben (Pilot dient als Entscheidungsgrundlage für Max & Robin).
- **Pilot-Inhalte:** Drei Artikel aus E-MTB Ausgabe #042 unter [`pilot-content/`](pilot-content/) — Nicolai S18 SWIFT (Einzeltest), Motoren-Vergleichstest, Editorial „Run, Forrest, run!".
- **CMS: Sanity** für den Pilot fest; für die Produktion **Default-Kandidat, bestätigt nach Risiko-Pilot** (Payload geprüft & verworfen wg. Self-Hosting-Ops-Last). Siehe `docs/review-konsequenzen.md`.
- **Stack: Sanity + Vercel + Cloudflare** (Managed Services, kein eigener Server). Achtung Vercel-Image-Kosten (`next/image`) — eigener Image-Loader (Sanity/Cloudflare) nutzen. CDN-Caching nur über eigene proxied Domain.
- **Framework:** Next.js (passt zum Stack, faktisch gesetzt).
- **Betriebs-Modell:** Tim wuppt selbst mit Claude; Senior-Dev **früh als Architektur-Leitplanke** (1–2 Tage vor dem Bauen + laufende Reviews) — korrigiert nach externem KI-Review.
- **Pilot = RISIKO-Pilot**, nicht Schönwetter-Demo: schlank (~6–10 Komponenten, EIN Wow-Feature), misst echte Zahlen (Traffic-Kosten, Zeit/Artikel, Offline-iOS, Werbung). Siehe `docs/review-konsequenzen.md`.
- **iOS-Offline-Risiko bekannt:** iOS löscht SW-Cache nach ~7 Tagen → Offline auf echtem iPhone testen, Capacitor als Plan B.
- **Sprachen:** DE + EN über alle 4 Magazine (Spanisch bei E-MTB eingestellt).

## Was bereits gebaut & lauffähig ist (Stand Mai 2026)

- **Sanity-Studio** in [`sanity-studio/`](sanity-studio/) — Projekt-ID **`5ul5gufv`**, Dataset `production`. Schema: i18n-Bausteine (localeString/Text/BlockContent), Dokumente (magazine, issue, person), Artikel-Typen (`articleEditorial` + generischer `article`), Body-Komponenten: titlePage, articleText, fullbleedPhoto, photoGrid, pullQuote + die Einzeltest-Bausteine specLine, tuningTip, ctaBlock, verdictPanel, hotspotImage, geometryOverlay, interactiveBike + die Vergleichstest-Bausteine comparisonTable, awardBox, testerCarousel. Media-Plugin (WP-artige Mediathek). **Custom Studio-Input** `components/HotspotPositioner.tsx`: visueller Hotspot-Placer (klicken/ziehen/× auf dem Foto, nummerierte Liste synchron mit den Markern, Theme-Farbe).
- **Editorial „Run, Forrest, run!"** vollständig real eingepflegt (16 Bausteine, Bilder, Signatur).
- **Nicolai S18 SWIFT — Einzeltest** real gebaut: 22 Body-Bausteine, 15 Fotos, status `final`. Zwei Wow-Features: **`hotspotImage`** (6 klickbare +-Marker → Detail-Popups; Reader `components/HotspotImage.tsx`) und **`geometryOverlay`** (Maßlinien-Overlay aufs Bike-Foto + Größen-Switcher S–XXL, schaltet die Werte an den Linien live um; Reader `components/GeometryOverlay.tsx` mit abgedunkeltem Foto + Label-Knockout. **Responsive:** Desktop zeigt die Werte direkt auf den Linien; auf dem Phone (≤720px) ist das Foto randlos (full-bleed), trägt nur nummerierte Marker, und die Werte stehen als feste, durchnummerierte Liste UNTER Foto+Switcher — eingeklappt nur die 4 Kern-Maße (Reach/Stack/Lenkwinkel/Radstand, `COLLAPSE_AT`), Rest per „Alle … Maße anzeigen". Reihenfolge via `METRIC_ORDER`, Marker + Liste teilen dieselbe Nummer. Studio: visueller **Pfeil-Placer** `GeometryArrowPlacer.tsx` — 2-Punkt-Linien klicken/ziehen, Snapping (waagerecht/senkrecht, Shift=45°, Endpunkt-Snap), hohle Ring-Griffe, **„Groß bearbeiten"-Vollbild** via Portal. **Werte + Pfeil-Positionen sind PLATZHALTER**, Tim pflegt echte Nicolai-Geometrie). Seed-Skripte: `pilot-content/01-nicolai-519-swift/seed_nicolai.py` + `seed_geometry.py`. (Studio braucht jetzt `@types/react-dom` als devDep.)
  - **Geometrie-Wizard (Studio-Input) gebaut:** statt generischer Array-Liste eine Checkliste der Standardmaße (Reach, Stack, Lenkwinkel, …) mit Status „○ offen / ✓ platziert · 614 mm", Klick auf ein offenes Maß startet fokussierte Platzier-Bühne fürs Foto (zwei Klicks → Start/Ende, Snap, dann Wert für die fotografierte Größe eintragen). Bestehende Pfeile per Klick zum Bearbeiten/Löschen. Eigene Maße (z. B. „29\"") als separate Sektion. Komponente: `sanity-studio/components/GeometryWizard.tsx`; in `interactiveBike` UND standalone `geometryOverlay` als `components: {input: …}` für das `annotations`-Array eingehängt. Datenmodell unverändert — vorhandene Pfeile bleiben kompatibel. Werte werden per `client.patch` direkt in die `measurements`-Geschwister-Tabelle geschrieben (Custom-Input kann nur sein eigenes Feld via onChange patchen). Snap: 3-stufig (fremder Endpunkt → fremde Linie lotrecht → Winkel-Snap waagerecht/senkrecht/45°), 18 px Zone. Der alte `GeometryArrowPlacer.tsx` liegt unbenutzt im Repo (Fallback) und kann später raus.
  - **Einheitliches „Klick-aufs-Bild → große Bühne"-Muster für ALLE visuellen Placer (03.06.):** Gemeinsamer Helper `sanity-studio/components/EditStagePortal.tsx` (Vollbild-Portal: abgedunkelter Hintergrund, Kopfleiste mit konfigurierbarem Schließen-Button, Escape, Body-Scroll-Lock, zentrierte Bühne + optionale Seitenleiste). Genutzt von `ClickZonePositioner`, `HotspotPositioner` und `GeometryWizard`: Inline zeigt jede Komponente eine nicht-interaktive Vorschau mit Markern/Zonen/Pfeilen + Hinweis-Pill; Klick aufs Foto öffnet die große Bühne (Foto in 2400px-Auflösung), dort läuft die Zeichen-/Platzier-Logik. Kein separater „Groß bearbeiten"-Button mehr. Beim GeometryWizard liegt die komplette Steuerung (Checkliste/Platzieren/Bearbeiten) jetzt in der **Bühnen-Seitenleiste** → das frühere „frickelig" (Werte-Eingabe lag im Vollbild hinter dem Overlay) ist gelöst. Topbar „Schließen" vs. Karten „Speichern/Fertig" disambiguiert. Datenmodell unverändert, Reader unberührt (Studio-only).
  - **Kombi-Baustein `interactiveBike` gebaut & im Nicolai-Artikel aktiv:** führt Hotspots + Geometrie auf EINEM Foto zusammen, Reader-Umschalter Details ↔ Geometrie (Start: Details), iOS-Segmented-Control, Foto bleibt beim Wechsel stehen. Reader `components/InteractiveBike.tsx`; geteilte Geometrie-Logik in `lib/geometry.ts` (von `GeometryOverlay` + `InteractiveBike` genutzt). Schema `components/interactiveBike.ts` nutzt beide Studio-Placer auf `bikePhoto` (Hotspot-Placer liest jetzt `baseImage` **oder** `bikePhoto`). Die Einzel-Bausteine `hotspotImage`/`geometryOverlay` bleiben als Typen verfügbar; im Nicolai-Artikel wurden ihre zwei Vorkommen durch den einen Kombi-Block ersetzt (Migration: `seed_interactive_bike.py`, idempotent, published + draft → Body jetzt **21** Bausteine).
- **Cover-Hero-Modus für `titlePage` gebaut** (27.05.): `titlePage` ist jetzt dual — `coverArtwork` (durchgestaltetes Cover-JPG aus InDesign, quer 3840 × 2160 + optional hoch 2160 × 3840 für Mobile) füllt 100dvh als Hero, Masthead schwebt initial transparent mit Top-Vignette + Text-Shadow und wird via IntersectionObserver solid, sobald das Cover aus dem Viewport scrollt. `<picture>` wählt per `orientation`-Media-Query das passende Asset; Sanity-CDN liefert WebP. Wenn `coverArtwork` leer → 3-Layer-Fallback (`backgroundImage` + `foregroundImage` + Titel-Typo) für schlichtere Editorials. Bilder: `pwa-prototyp/components/ArticleView.tsx` (jetzt `'use client'`), `sanity-studio/schemaTypes/components/titlePage.ts`, `pwa-prototyp/app/globals.css` (`.titlepage.is-cover`, `.article-page.has-cover-hero`, `--masthead-h`). Reale Demo-Cover live: **Nicolai S18 SWIFT** + **INSTINCTIV / Ocelote 125**. Designer-Faustregel für Cover-Schriftgröße: kritische Display-Wörter ≥ 4–5 % der Cover-Höhe (Skalierungsfaktor Cover→iPhone ist ~5.5×). **Strategischer Offenpunkt → Julian:** Print-Vielfalt pro Cover beibehalten ODER auf einheitliche Templates wechseln — Tech ist für beides bereit.
- **Vergleichstabelle `comparisonTable` gebaut** (10.06.): generischer, FREIER Tabellen-Baustein (Spalten + Zeilen eingetippt, NICHT relational mit motorModel-Refs wie Schema-Entwurf §3.13 — Tim-Entscheidung: für den Pilot überengineert; die generische Form deckt auch nicht-spec-Tabellen wie Herkunftsländer ab). Pro Spalte ein `numeric`-Flag (rechtsbündig + als Zahl sortieren). **Wow-Feature: sortierbar** — Desktop = echte Tabelle mit klickbaren Spaltenköpfen (↕/▲/▼, aktive Spalte in Akzentfarbe), Phone (≤720px) = jede Zeile als Karte (erste Spalte = Überschrift) + „Sortieren nach"-Dropdown. Sortier-Logik deutsche-Komma-Dezimal-tauglich (`parseNum` in `pwa-prototyp/components/ComparisonTable.tsx`). Schema `sanity-studio/schemaTypes/components/comparisonTable.ts`, GROQ-Projektion in `lib/sanity.ts`, CSS in `globals.css` (`.comparison*`). Erste Spalte ist konventionsgemäß die Subjekt-/Produktspalte.
- **Award-Boxen `awardBox` gebaut** (10.06.): Auszeichnungs-Baustein für Vergleichstests (Best in Test / Best Buy / Editor's Choice / custom). **Layout = redaktionell zentriert nach Heft-Vorlage** (Tim hat das Print-Layout vorgegeben): gesperrtes Label + Trennstrich, Sieger-Name groß (Marke fett · Modell leicht, uppercase), großes Foto, **Siegel mittig unter dem Foto** (leicht überlappend), Verdict zentriert. **Keine Emojis** (Tim-Feedback). Einheitlicher Award-Akzent Teal-Grün (`--aw: #1f9e8c`). Deutsche Heft-Labels: Editors' Choice · Kauftipp · Testsieger. Pro Award: Sieger-Foto + Sieger-Name + Verdict + optionales **`badge`-Bildfeld** für das echte Verlags-Siegel (PNG/SVG). Reader-Case inline in `ArticleView.tsx`, CSS `.award*` in `globals.css`. **CSS-Lehre:** `.award-media > img` muss das Badge ausnehmen (`:not(.award-badge)`), sonst streckt die Cover-Regel das Siegel. Seed `pilot-content/02-motoren-vergleichstest/seed_awards.py` (idempotent, feste _keys, Asset-Dedupe via `originalFilename`): drei reale Awards aus #042 — Editor's Choice (maxon) → Best Buy (Bosch CX) → Best in Test (Avinox). **Sieger-FOTOS sind Platzhalter**; die echten **Siegel pflegt Tim selbst im Studio** in die `badge`-Felder (er hat sie als SVG/PNG — Studio-Edit erzeugt eine Draft, die der Reader via `perspective:drafts` live zeigt).
- **Tester-Carousel `testerCarousel` gebaut** (10.06.): als **Slideshow** (Tim-Wunsch: nicht enger Scroll-Streifen, sondern eine große luftige Slide pro Ansicht — Foto + Bio nebeneinander, Blättern per Pfeil ‹ ›, Dots oder Touch-Wisch via scroll-snap). Porträt + Name + Rolle + Mini-Bio, zieht alles aus den `person`-Docs (Argument für die person-Entität: einmal pflegen, überall referenzieren). Eigene Client-Komponente `pwa-prototyp/components/TesterCarousel.tsx` (Pfeil-/Aktiv-State), CSS `.testers*` in `globals.css`. Schema `sanity-studio/schemaTypes/components/testerCarousel.ts` (Array von `reference → person`). GROQ dereferenziert: `testers[]->{name, roleDefault, bio.de, portrait}`. Seed `seed_testers.py`: 6 neue person-Docs (Bene/Lars/Peter/Erik/JP/Ingo) mit realen DE+EN-Bios, Robin Schmitt wiederverwendet (existierte schon mit echtem Porträt), Carousel „Das Test-Team" vor den Awards eingefügt. **Porträts sind Platzhalter** (#042-Crew-/Action-Shots, keine sauberen Headshots — Tim ersetzt sie). **Geste-Kollision Slideshow-Wisch ↔ Artikel-Swipe GELÖST** (10.06.): (1) `ArticleCarousel` ignoriert Touch-Gesten, die auf einem `[data-hscroll]`-Element starten (neues Flag `drag.ignore` in onStart/Move/End — kein Artikel-Wechsel, kein `preventDefault`); (2) weil das Panel `touch-action: pan-y` setzt (blockiert natives Horizontal-Scrollen), steuert `TesterCarousel` den Wisch **selbst per JS** (eigene Touch-Listener auf dem `[data-hscroll]`-Track, flick-freundliches Snap: kurzer Wisch > max(40px, 15% Slide-Breite) blättert weiter). **Einrasten = eigene eased rAF-Animation** (`animateTo`, easeOutCubic ~380ms) statt native scroll-snap — letzteres („mandatory") schnappte hart/„snappy" zurück (Tim-Feedback); CSS scroll-snap deshalb komplett entfernt, alle Slide-Wechsel (Drag/Pfeile/Dots) laufen über `animateTo`. Vertikaler Wisch auf der Slideshow scrollt weiterhin den Artikel. Per CDP-Touch verifiziert. **Lehre/Muster:** künftige horizontale Scroller im Carousel mit `data-hscroll` markieren + eigenen JS-Wisch geben (natives Scrollen geht wegen `pan-y` nicht).
- **Motoren-VT teil-befüllt** (10.06.): die **zwei echten Tabellen** (Spec 11×6 + Herkunft) + Intro/Brücke + Aufmacher-Foto (Seed `seed_motoren.py`) + die drei Award-Boxen (`seed_awards.py`) + das Tester-Carousel (`seed_testers.py`) sind real eingepflegt (idempotent, DE+EN). **Body-Reihenfolge:** titlePage → Intro → Foto → Spec-Tabelle → Brücke → Herkunfts-Tabelle → Tester-Carousel → Awards. Offen bleibt nur noch der **Tester-Dialog** (`quoteDialog`) + die langen Analyse-Texte.
- **PWA-Reader** in [`pwa-prototyp/`](pwa-prototyp/) — Next.js (App Router): **Kiosk** (Inhaltsverzeichnis der Ausgabe) → **Artikel** als **interaktives Swipe-Carousel im iPhone-Fotos-App-Stil** (Finger-Tracking, Lücke zwischen Artikeln, weicher Snap; `components/ArticleCarousel.tsx`) + Einblend-Animation (`app/template.tsx`). Zieht live aus Sanity, Bilder über **Sanity-CDN + `<img>`** (bewusst NICHT `next/image`).

**Lokal starten** (Node via Homebrew: `eval "$(/opt/homebrew/bin/brew shellenv)"`): Studio → `cd sanity-studio && npm run dev` (Port 3333). Reader → `cd pwa-prototyp && npm run dev` (Port 3000). Reader-Lesetoken in `pwa-prototyp/.env.local` (gitignored).
- **Test am iPhone:** über die Netzwerk-URL (`http://<LAN-IP>:3000`) — die IP muss in `next.config.mjs` unter `allowedDevOrigins` stehen, sonst läuft kein Client-JS (keine Hydration → Swipe tot). Bei CSS-/JS-Änderungen, die nicht durchschlagen: `rm -rf pwa-prototyp/.next` + Reader neu starten (Turbopack-Stale-Cache).
- **Seeden via API + Reader-Perspektive:** Der Reader liest mit `perspective: 'drafts'`. Sobald im Studio editiert wurde, existiert eine Draft (`drafts.<id>`), die von der `published`-Version abweicht. Programmatische Seeds/Patches müssen dann **die Draft mitpatchen** (`drafts.<id>`), sonst zeigt der Reader die Änderung nicht. `seed_geometry.py` patcht beide Versionen idempotent.

## Nächster Schritt (für die neue Session)

**Erledigt (Stand 10.06.):** Nicolai-Einzeltest (Hotspots + Geometrie + `interactiveBike`); Cover-Hero `titlePage`; **Werbung** (Zwei-Modi-Schema + Reader + Specialized-Custom-Modul); **Vergleichstest-Bausteine** `comparisonTable` (sortierbar), `awardBox` (Heft-Layout, Siegel-Felder), `testerCarousel` (Slideshow mit eigenem Wisch). Der **Motoren-VT ist als Pilot-Demo abgeschlossen** — Tester-Dialog (`quoteDialog`) hat Tim bewusst verworfen (nicht nötig).

**Als Nächstes (nächste Session, von Tim angekündigt 10.06.): Anpassungen — Navigation, kleine Bugs, Feinschliff.**
Kein neuer großer Baustein geplant; Fokus auf Politur des Bestehenden (u. a. Navigation). Konkrete Punkte sammelt Tim. (Die ausführliche Werbe-Planung unten ist erledigt/historisch — Umsetzung siehe „Was bereits gebaut".)

**Harte Fakten (Tim am 27.05.):**
- Werbung wird **nur als ganze Seiten** verkauft — keine Inline-Banner, kein Sticky-Bottom. In der PWA = ein eigenes **Vollbild-Panel im Swipe-Carousel** zwischen Artikeln.
- Heutiger Workflow: Kunde liefert fertiges Anzeigen-Bild, Verlag legt **Linkbox(en)** mit Bitly-URL drüber. Eine Anzeige kann **mehrere Bilder gestapelt** sein (Merida-Beispiel: zwei InDesign-Bilder untereinander, dadurch scrollbar). Klicks via Bitly getrackt, Buchung **pauschal**.
- **Häufigkeit: 9 Anzeigen auf 39 Heft-Seiten (~23 %), wird in der PWA 1:1 beibehalten.**
- **Kennzeichnung:** „AD"-Label nur im Kiosk / in der Übersicht (heute in der nativen App genau so), **die Anzeige selbst trägt keine zusätzliche Kennzeichnung**.

**Der strategische Hebel (eigentliches Highlight, von Tim aufgebracht):**
Werbung in der PWA muss nicht zwingend das fertige Print-Bild sein. Mit **custom-codierten interaktiven Modulen** entsteht eine **neue Premium-Werbeproduktklasse**, die im Heft und in der nativen Button-App technisch unmöglich ist (Parallax, Hover, Animationen, Spec-Hotspots, ggf. Konfigurator). Das ist ein **Refinanzierungs-Argument vor Max & Robin**: PWA = höherer Werbeumsatz pro Premium-Anzeige. Skaliert nicht für alle Anzeigen (Aufwand pro Modul = Stunden bis Tage), aber für 1–2 Top-Kunden pro Ausgabe sinnvoll.

**Daraus folgt: Zwei-Modi-Schema** (nicht drei — die mittlere „Rich"-Stufe ist im Tim-Workflow eh nur „Standard mit mehreren Bildern"):

```
Document-Type: advertisement
├── sponsor                (string)
├── magazine, issue        (refs)
├── position               (number — frei platzierbar in der Ausgabe, gemeinsame Sortierung mit Artikeln)
├── language               (DE | EN | beide)
├── mode                   ('standard' | 'custom')
│
├── (mode=standard)
│   ├── images[]            (1–n Bilder, untereinander gestapelt scrollbar)
│   │   ├── image
│   │   └── clickZones[]    (x, y, w, h, url) — Bitly-Links
│   │                        ↑ HotspotPositioner-Pattern wiederverwendet (Zonen statt Punkte)
│   └── gallery?            (optional Lightbox-Bilder, falls Kunde mitschickt)
│
└── (mode=custom)
    └── componentId         ('specialized-levo-4', 'merida-vamok', …)
                             → Reader lädt React-Komponente aus pwa-prototyp/components/ads/<id>.tsx
                             → Ad-Registry mappt ID auf Komponente
```

**Reader-Integration:**
- GROQ-Query für den Carousel zieht **Artikel UND Anzeigen**, mischt sie nach `position`. `ArticleCarousel` rendert pro Panel entweder `<ArticleView>` oder `<AdView>`.
- Kiosk listet Anzeigen als eigene Kartenvariante mit kleinem **„AD"-Badge** + Sponsor-Name (nicht als reguläre Artikel-Card mit Titel/Kategorie).
- Mobile-Crop: bei Standard-Modus **Letterbox akzeptieren** (schwarzer/dunkler Rahmen drum herum signalisiert „andere Inhalts-Ebene"). Bei Custom-Modus löst sich's automatisch (HTML/CSS responsive).

**Demo-Plan für die neue Session (drei reale Anzeigen aus E-MTB-#042, Tim hat Assets):**
1. **Standard mit 1 Bild + Klick-Zonen** — z. B. Centurion oder Riese-Müller (eine der einfachen).
2. **Standard mit mehreren gestapelten Bildern + Galerie** — Merida VAMOK (zwei Bilder + Lightbox-Galerie).
3. **Custom-Modul** — Specialized Turbo Levo 4: Maus-Parallax + Staggered Reveal (Logo → Test-Sieger-Badge → Modellname → Slogan → CTA fadet nacheinander rein) + Hover-Effect am „Jetzt kaufen"-Button (Glow + Pfeil) + periodischer Schimmer-Sweep über das Test-Sieger-Badge + Touch-Gyro auf Mobile.

**Eine offene Detail-Entscheidung für die neue Session:**
- **Klick-Zonen-Sichtbarkeit:** Print-treu unsichtbar (User sieht nur Cursor-Pointer), sichtbar mit kleinem „↗"-Icon am Zonen-Rand, oder Hybrid (subtiler Toast „tippe für Links" beim ersten Anzeigen-Aufruf der Session)? Mini-Entscheidung, kein Showstopper — wird in der Session geklärt.

**Weitere offene Punkte** (in dieser Reihenfolge):
1. **Motoren-VT abgeschlossen** (10.06.) — `quoteDialog` von Tim verworfen. Verbleibt nur **Asset-Pflege durch Tim im Studio**: echte Sieger-Fotos der Awards + echte Tester-Porträts (aktuell Platzhalter) + die Best-Buy-/Editor's-Choice-Siegel.
2. **EN/DE-Sprachumschalter** im Reader (Reader hardgecodet auf `.de`, GROQ-Projection in `lib/sanity.ts` müsste parametrisiert werden) — demonstriert live das i18n-Argument.
3. **Lighthouse-Audit + iOS-PWA-Test** als Pilot-Mess-Session (Add-to-Home, Offline-Cache-Verhalten nach 7 Tagen, harte Zahl für Capacitor-Plan-B-Frage).
4. **Live-Preview via Sanity Presentation** — Demo-Aufwerter.
5. **Echte Geometriedaten** in den Nicolai-Switcher (aktuell Platzhalter; Tim hat Zugriff auf das echte Nicolai-Sheet).
6. **Cover-Strategie**, **Schrift-Feintuning**, **Design-Pass**, **Magazin-Kiosk-Skalierung**, **Hochformat-first auf Mobile** — gehören mit **Julian** zusammen (Review: „Julian zu spät"). Hochformat-Richtung: Tim hat entschieden (03.06.), dass die PWA mobil hochkant wird (alte App quer = Button-Publish-Zwang, kein Design-Wunsch; Pitch-Argument „echte Lesehaltung"). Magazin-weiter Umbau (alle Bausteine bekommen Hochformat-Master via vorhandenem `<picture>`-Orientierungs-Pattern; Anzeigen brauchen zusätzlich eigene Klick-Zonen pro Orientierung). Pilot bleibt vorerst Querformat-Assets. Details: Memory `mobile-hochformat-richtung`.
7. **Produktions-Architektur**, **CDN-Caching**, **Bild-Pipeline-Kosten** — gehören mit **Senior-Dev**, sobald Richtung Go-Live.

## Repo-Aufbau

```
/
├── CLAUDE.md                      ← Diese Datei
├── architektur.html               ← Original Architektur-Onepager (Stand April 2026)
├── index.html                     ← HTML-Prototyp der Reader-/Kiosk-Ansicht
├── sanity-studio/                 ← Sanity Studio (CMS): Schema + Config (Projekt 5ul5gufv)
├── pwa-prototyp/                  ← PWA-Reader (Next.js): Kiosk + Artikelseiten, rendert aus Sanity
├── docs/
│   ├── schema-entwurf.md          ← Sanity-Schema-Konzept (lebendiges Dokument)
│   ├── cms-entscheidung.md        ← CMS-/Infra-/Betriebs-Entscheidung
│   ├── projekt-briefing.md        ← Briefing für externen KI-Gegencheck
│   ├── ki-prüfung.md              ← Rohantworten der zwei Review-KIs
│   └── review-konsequenzen.md     ← Revidierte Entscheidungen nach dem Review
├── pilot-content/                 ← Echte Inhalte aus EMTB #042 für Migration-Test
│   ├── 01-nicolai-519-swift/      ← Hinweis: Doc-Filename sagt S18, Heft-Layout sagt 519 — vermutlich Tippfehler in einem der beiden
│   ├── 02-motoren-vergleichstest/
│   └── 03-editorial/
├── aktuelle ausgabe/EMTB_042_GER_SD/   ← Kompletter Button-Publish-Export der aktuellen E-MTB-Ausgabe
└── dummie contetn/                ← (Ordnernamen-Typo aus Anfangsphase) — Sample-Assets vom Beginn
```

## Wichtige Befunde aus der Analyse-Phase

- **Button-Publish-Export hat null strukturierte Daten** — alle Texte sind als PNG gerendert. Daher: keine Auto-Migration alter Hefte möglich, aber starkes Argument für PWA.
- **Google Docs sind die echte Content-Quelle** — halb-strukturiert mit klarem Meta-Header (TITEL MAG, TITEL WEB, Autor, Checkliste, …). Das ist die Vorlage für das Sanity-Schema.
- **Spec-Daten:** bei Einzeltests teilweise in separatem Google Sheet, bei Vergleichstests inline im Doc als Tabelle.
- **Foto-Workflow:** identische Quelle, zwei Export-Varianten — `…-WEB-….jpg` (für WordPress, mit Wasserzeichen + Fotograf-Credit) und `…-MAG-….jpg` (fürs Heft, sauber). In Sanity wird die Master-Quelle gespeichert, Varianten on-the-fly.

## Team / Stakeholder

- **Tim Eckermann** (Mediengestalter Teilzeit, Projekt-Treiber) — primärer User
- **Max & Robin Schmitt** (Gründer) — Entscheider für Budget-Freigabe
- **Julian Lemme** (Art Director, intern) — noch nicht offiziell ins Projekt eingebunden
- **GZD** (externe Firma) — InDesign-Pflege heute; potenziell ablösbar durch direkten Sanity-Workflow

## Was NICHT tun

- **Pilot-Bau ist freigegeben** (das ist der Risiko-Pilot als Entscheidungsgrundlage). Aber: keine **Produktions**-Implementierung / kein Go-Live-Bau, bevor Budget-Entscheidung von Max & Robin steht und der Senior-Dev die Architektur abgenommen hat.
- Den `architektur.html` und `index.html` nicht überschreiben — das sind historische Referenz-Dokumente.
- Keine Doppelpflege: was im Schema-Entwurf steht, nicht in Memory duplizieren (Memory ist für die übergreifenden Entscheidungen + Personen-/Workflow-Kontext, Schema-Entwurf ist für die technische Substanz).
