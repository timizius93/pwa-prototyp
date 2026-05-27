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

- **Sanity-Studio** in [`sanity-studio/`](sanity-studio/) — Projekt-ID **`5ul5gufv`**, Dataset `production`. Schema: i18n-Bausteine (localeString/Text/BlockContent), Dokumente (magazine, issue, person), Artikel-Typen (`articleEditorial` + generischer `article`), 5 Body-Komponenten (titlePage, articleText, fullbleedPhoto, photoGrid, pullQuote). Media-Plugin (WP-artige Mediathek) installiert.
- **Editorial „Run, Forrest, run!"** vollständig real eingepflegt (16 Bausteine, Bilder, Signatur). + **2 Platzhalter-Artikel** (Nicolai-Test, Motoren-VT) nur als Kiosk-/Navigations-Füllung — von Tim später real zu bauen.
- **PWA-Reader** in [`pwa-prototyp/`](pwa-prototyp/) — Next.js (App Router): **Kiosk** (Inhaltsverzeichnis der Ausgabe) → **Artikel** als **interaktives Swipe-Carousel im iPhone-Fotos-App-Stil** (Finger-Tracking, Lücke zwischen Artikeln, weicher Snap; `components/ArticleCarousel.tsx`) + Einblend-Animation (`app/template.tsx`). Zieht live aus Sanity, Bilder über **Sanity-CDN + `<img>`** (bewusst NICHT `next/image`).

**Lokal starten** (Node via Homebrew: `eval "$(/opt/homebrew/bin/brew shellenv)"`): Studio → `cd sanity-studio && npm run dev` (Port 3333). Reader → `cd pwa-prototyp && npm run dev` (Port 3000). Reader-Lesetoken in `pwa-prototyp/.env.local` (gitignored).
- **Test am iPhone:** über die Netzwerk-URL (`http://<LAN-IP>:3000`) — die IP muss in `next.config.mjs` unter `allowedDevOrigins` stehen, sonst läuft kein Client-JS (keine Hydration → Swipe tot). Bei CSS-/JS-Änderungen, die nicht durchschlagen: `rm -rf pwa-prototyp/.next` + Reader neu starten (Turbopack-Stale-Cache).

## Nächster Schritt (für die neue Session)

**Empfohlen als Nächstes:** der **Nicolai-Einzeltest** als „schwieriger" Artikel (Spec-Line, Tabellen) + **EIN** interaktives Wow-Feature (Geometrie-Overlay *oder* Hotspots — nicht beides) als Risiko-Spike. Liefert den sauberen „Zeit-pro-Artikel"-Messwert + das eigentliche Wow für die Demo. Inhalt liegt in [`pilot-content/01-nicolai-519-swift/`](pilot-content/01-nicolai-519-swift/); Body-Aufbau steht in `docs/schema-entwurf.md` §5.1. Dabei den Platzhalter-Artikel `article-nicolai-s18-swift` durch echten Inhalt ersetzen.

Weitere offene Brocken: **Design-Pass** am Reader — gehört **mit Julian** gemacht (Review: „Julian zu spät"); **Magazin-Kiosk** (Ebene über der Ausgabe) als Demo-Aufmacher „skaliert auf 4 Magazine"; **Live-Preview** via Sanity Presentation. Sobald es Richtung Produktions-Architektur geht: Senior-Dev früh einbinden.

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
