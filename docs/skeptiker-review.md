# Skeptiker-Review — Hält der Pilot einer Gründer-Prüfung stand?

> **Stand:** 10.06.2026 · Adversarial Review (Claude, auf Tims Wunsch: „Spiele den Skeptiker")
> **Zweck:** Bevor Max & Robin den Piloten als Entscheidungsgrundlage sehen, alle Schwachstellen finden, die die Budget-Freigabe killen würden. Befund + Empfehlung, keine Code-Änderungen.
> **Methode:** Komplettes Memory + alle `docs/` gelesen, Code-Audit beider Apps (Studio + Reader), Live-Verifikation der Sanity-/Vercel-Preise (10.06.2026), iOS-PWA-Stand recherchiert.
> **Begleitend:** [`skeptiker-review-praesentation.html`](skeptiker-review-praesentation.html) — dieselben Inhalte als Folien-Deck.

---

## 0. Kurzurteil

**Der Pilot ist als Demo stark und als Risiko-Pilot bisher schwach.** Das Bau-Niveau (Studio-Placer, Reader, Wow-Features, Werbe-Modell) liegt über dem, was man von einem Teilzeit-Nicht-Dev-Setup erwarten würde — das ist echtes Pitch-Material. Aber: Von den **sieben Mess-Fragen, die der Pilot laut eigener Definition beantworten MUSS** (`review-konsequenzen.md` §3), ist **keine einzige belastbar beantwortet**. Der Pilot ist genau in die Richtung gedriftet, vor der das externe KI-Review gewarnt hat: Schönwetter-Demo statt Risiko-Test.

Der Tech-Stack (Sanity + Vercel + Cloudflare) ist für das Betriebsmodell **richtig gewählt** — aber die aktuelle Implementierung ist das **Gegenteil der Kosten-Architektur**, die in den eigenen Docs beschlossen wurde (Details §4). Das ist im Pilot okay, muss aber VOR dem Pitch als bewusster Zustand benannt und als Plan gezeigt werden — sonst widerlegt der eigene Code die eigene Kostenrechnung.

**Empfehlung in einem Satz:** Keinen einzigen weiteren Baustein bauen — die nächsten Sessions sind ein **Mess-Sprint** (Offline/iOS, Bild-Traffic, Zeit-pro-Artikel) plus **zwei überfällige Stakeholder-Termine** (Julian, Senior-Dev) plus **drei Zahlen einsammeln** (Ist-Kosten, Leser-Analytics, iOS-Split). Erst dann ist der Pilot eine Entscheidungsgrundlage.

---

## 1. Die fünf Budget-Killer (priorisiert)

### K1 — Es gibt keinen Business Case (härtester Killer)

Die erste Gründer-Frage ist nicht „kann das offline?", sondern: **„Was kostet uns das heute, was kostet das neue, was sparen wir?"** Aktueller Stand:

| Zahl | Status |
|---|---|
| Ist-Kosten heute (Button Publish + GZD + App Store) | **Unbekannt** — Tim muss sie erst erfragen (bestätigt 10.06.) |
| Produktions-Kosten PWA (Infra + Senior-Dev + Tims Zeit) | Nie als Vorlage gerechnet |
| Laufende Kosten pro Ausgabe (Traffic real) | Nie gemessen (Image-Spike steht aus) |
| Erlös-Hebel Premium-Werbung | Behauptet, aber ohne Preis-/Aufwandszahl |

Ohne diese vier Zahlen ist der Pilot eine Tech-Demo, kein Entscheidungsdokument. Das Gegenargument „aber es sieht toll aus" hat bei Geschäftsführern, die eine Budget-Freigabe unterschreiben, noch nie gewonnen.

**Empfehlung:** Ist-Kosten bei Max/Robin bzw. Buchhaltung erfragen (GZD-Jahresrechnung, Button-Publish-Lizenz, Apple/Google-Developer-Konten). Daraus eine einzige Folie: „Heute X €/Jahr → PWA Y €/Jahr + Z einmalig". Selbst wenn X klein ist, trägt das Argument „totes System ohne Support + Ausfall bereits passiert" — aber dann muss man das Risiko bepreisen, nicht die Ersparnis.

### K2 — Das Kern-Versprechen ist ungetestet: Es gibt (noch) keine PWA

Der Pilot heißt PWA, hat ein Web-App-Manifest (installierbar, standalone) — aber **keinen Service Worker, keine Offline-Fähigkeit, null Caching**. Das per iOS-Eviction bekannte **größte Einzelrisiko des gesamten Projekts** (deshalb wurde der „Risiko-Pilot" überhaupt so genannt) ist nicht angefasst:

- Recherche-Stand 2026: Die 7-Tage-Eviction gilt weiterhin für Safari-Websites; **installierte** Home-Screen-PWAs sind offiziell ausgenommen, aber es gibt widersprüchliche Praxis-Berichte (u. a. [MagicBell-Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [vinova](https://vinova.sg/navigating-safari-ios-pwa-limitations/)). Heißt: **Der reale 7-Tage-Test auf Tims iPhone ist weiterhin alternativlos** — und er dauert kalendarisch 1–2 Wochen. Wer ihn vor dem Pitch nicht startet, kann ihn nicht mehr nachholen.
- Wenn Max oder Robin fragt: „Funktioniert das offline auf meinem iPhone, wie die alte App?" — ist die ehrliche Antwort heute: **„Wissen wir nicht, das haben wir nie gebaut."** Das killt die Glaubwürdigkeit der gesamten Risiko-Pilot-Erzählung.
- Ungelöst bleibt auch die **Migration der Bestandsnutzer**: Die native App hat eine installierte Basis; PWA-Installation auf iOS ist manuell (Teilen-Menü). Plan nötig: In-App-Hinweis in der alten App, QR/Deep-Links, ggf. Capacitor-Wrapper als Store-Brücke (Plan B existiert ja bereits auf dem Papier).

**Empfehlung:** Minimaler Service Worker (App-Shell + „Ausgabe speichern") als nächster Bau-Schritt — nicht weil es schön ist, sondern weil es die einzige offene K.O.-Frage ist. Den 7-Tage-iOS-Test **sofort** starten (Kalenderzeit!). Capacitor-Plan-B im Pitch aktiv zeigen statt verstecken: „Wir haben gemessen, hier ist Plan B falls iOS uns blockiert" ist ein Stärke-Argument.

### K3 — Der Risiko-Pilot misst nicht, was er messen sollte

Selbst-definierte Pflicht (`review-konsequenzen.md` §3) vs. Realität:

| # | Mess-Frage | Status 10.06. |
|---|---|---|
| 1 | Traffic-Kosten real (Image-Spike, Cloudflare-Prototyp, Vercel-Meter) | ❌ Nicht gemessen; Bilder laufen direkt über `cdn.sanity.io`, kein Proxy, kein Cloudflare |
| 2 | Zeit pro Artikel | ⚠️ Nur Editorial, grob „mit Kaffeepausen". Nicolai + Motoren-VT wurden großteils **per Claude-Seed-Skript** befüllt — das misst nicht Tims Studio-Workflow |
| 3 | Offline iOS/Android real | ❌ Kein Service Worker vorhanden |
| 4 | Werbung | ✅ Am besten beantwortet — aber mit **eigenem Direktverkaufs-Modell statt GAM**. Achtung: ältere Planungs-Doku nennt noch „Google Ad Manager" als Monetarisierung → vor dem Pitch eine konsistente Story festlegen |
| 5 | Visuelles Niveau (Julian + Gründer) | ❌ Julian hat den Piloten nie gesehen |
| 6 | Workflow schneller oder nur anders mühsam? | ⚠️ Anekdotisch („richtig geil"), nicht protokolliert |
| 7 | Architektur-Abnahme durch Senior-Dev | ❌ Senior-Dev existiert weiterhin nicht |

Das ist der unbequemste Befund: Die Korrekturen aus dem externen Review wurden **dokumentiert und akzeptiert, aber nicht gelebt**. Ein kritischer Gründer (oder ein von Max/Robin hinzugezogener Berater), der `review-konsequenzen.md` liest und dann den Stand sieht, findet diese Lücke in fünf Minuten.

**Empfehlung:** Die Tabelle oben ist die To-do-Liste bis zum Pitch. Punkt 2 ehrlich nachholen: **einen** weiteren Artikel komplett von Hand im Studio einpflegen und die Zeit stoppen (ohne Claude-Seeds), sonst ist die wichtigste Workflow-Kennzahl angreifbar.

### K4 — Stakeholder-Lücken: Julian und der Senior-Dev

- **Julian (Art Director):** Beide Review-KIs nannten „Julian zu spät" als Risiko gestalterischer Ablehnung; es wurde als Konsequenz akzeptiert — passiert ist nichts. Dabei sind inzwischen lauter Design-Entscheidungen gefallen (Cover-Hero, Foto-Raster, Award-Layout, Hochformat-Richtung), die seinen Bereich betreffen. Gründer-Frage: „Was sagt Julian dazu?" → „Der hat es nie gesehen" ist eine schlechte Antwort, und schlimmer: Julian könnte sich übergangen fühlen und im Termin **gegen** das Projekt kippen. Ein 1-Stunden-Termin vor dem Pitch macht ihn vom Risiko zum Verbündeten.
- **Senior-Dev:** Die beschlossene Korrektur war „1–2 Tage Architektur-Leitplanke VOR dem Bauen + laufende Reviews". Gebaut wurde seit Mai — ohne. Das lässt sich nicht rückwirkend heilen, aber: **Ein bezahlter 1–2-Tage-Review VOR dem Pitch** verwandelt den Makel in ein Asset („externe Architektur-Abnahme liegt vor, hier die Befunde und der Härtungs-Plan"). Mein Code-Audit (§5) liefert dem Dev die Einstiegsliste.
- **Leserzahl:** Die 21.000–35.000 stammen aus dem **Mediakit** (= vermarktungsoptimierte Zahl), echte Analytics + iOS/Android-Split liegen nicht vor (Tim, 10.06.). Die GESAMTE Traffic-Kostenrechnung und das Offline-Risiko (iOS-Anteil!) hängen an dieser Zahl. Wenn die echte Zahl z. B. 8.000 ist, wird die Kostenrechnung besser, aber das Reichweiten-Argument schwächer — in beiden Fällen will man es **vor** dem Termin wissen, nicht darin.

### K5 — Die „Tim + KI"-Frage kommt garantiert — Antwort vorbereiten

Max & Robin führen >40 Mitarbeiter; mindestens einer von beiden wird fragen:

1. **„Was passiert, wenn Tim ausfällt?"** (Bus-Faktor 1)
2. **„Wer hebt den Hörer ab, wenn am Launch-Tag der Ausgabe die Seite weiß ist?"** (Incident-Fall: Teilzeit-Nicht-Dev + Freelancer im Hauptjob-Meeting)
3. **„Wer haftet für Sicherheit/DSGVO?"** (eine KI übernimmt keine Verantwortung)

Diese Fragen sind im Memory als „bekannte Risiken" notiert, aber es gibt **keine vorbereitete Antwort**. Ausweichen wäre fatal — die Gegenposition ist vorbereitbar: (a) Doku-Stand ist real gut (CLAUDE.md, docs/, Memory — ein neuer Dev findet sich schnell zurecht), (b) Managed-Stack heißt: Anbieter tragen Betrieb/Verfügbarkeit der Infrastruktur, (c) Senior-Dev-Vertrag mit definiertem Notfall-SLA als Teil des Produktions-Budgets einpreisen, (d) das quartalsweise, statische Produkt (siehe §4.2) ist die incident-ärmste Form einer Web-App überhaupt. Aber diese Antwort muss als Folie existieren.

---

## 2. Ungeprüfte Annahmen (Inventur)

1. **„21–35k Leser"** — Mediakit, nicht Analytics (K4).
2. **„~200 Bilder × 300 KB × 60 MB pro Leser"** — die gesamte 2-TB-Rechnung ist eine Schreibtisch-Schätzung; eigene Docs sagen „messen, nicht diskutieren". Hero-Bilder sind real eher 0,5–2 MB; ohne `srcset` lädt heute auch das Phone die Desktop-Größen → die echte Zahl kann in beide Richtungen abweichen.
3. **„1–2 h pro Artikel"** (`schema-entwurf.md` §5.1) — nie gemessen (K3.2).
4. **„iOS-Eviction trifft uns / trifft uns nicht"** — offizieller Stand: installierte PWAs ausgenommen, Praxis widersprüchlich → nur der Real-Test zählt.
5. **„Cloudflare-CDN löst die Bild-Kosten"** — als Konzept richtig, aber nie prototypisch gebaut; der Reader nutzt heute direkt `cdn.sanity.io`, wo Cloudflare **nicht** cachen kann.
6. **„Premium-Werbeklasse refinanziert die PWA"** — kein Preis-Test mit einem echten Kunden, keine Aufwands-Kalkulation (Specialized-Modul = mehrere Sessions inkl. iOS-Bugfix).
7. **„Sanity-Editor-UX funktioniert für Julian"** — Mess-Frage 5, nie getestet (Storyblok-Hinweis beider Review-KIs steht unbeantwortet im Raum).
8. **„Drafts-Privatsphäre"** — Pilot-Dataset ist public; **prüfen**, ob Drafts via API ohne Token lesbar sind (bei Sanity sind Drafts in public Datasets grundsätzlich abfragbar). Für den Piloten (Alt-Inhalte aus #042) unkritisch, für Produktions-Inhalte (unveröffentlichte Ausgabe!) ein No-Go → privates Dataset = Growth-Plan = ohnehin eingeplant.

---

## 3. Tech-Stack-Urteil: Ist Sanity + Vercel sinnvoll?

**Ja — für DIESES Betriebsmodell ist der Stack richtig.** Die Entscheidungslogik aus `cms-entscheidung.md` hält dem Skeptiker-Test stand: Ein Teilzeit-Nicht-Dev darf keinen Server betreiben; Payload-Verwurf war korrekt begründet; die Alternativen (Strapi/Directus/Self-Host) scheitern alle am selben Ops-Kriterium. Auch die wichtigste frühe Architektur-Entscheidung — **kein `next/image`/Vercel-Optimizer** — war goldrichtig und umgeht Vercels bekannteste Kostenfalle.

**Aber drei Dinge müssen klar benannt werden:**

### 3.1 Die Implementierung widerspricht aktuell der eigenen Kosten-Architektur

Beschlossen (Docs) vs. gebaut (Code):

| Beschlossen | Gebaut (Stand 10.06.) |
|---|---|
| Cloudflare-CDN vor eigener Asset-Domain cached die Bilder | Bilder laufen direkt über `cdn.sanity.io` → **zählt 1:1 auf Sanity-Bandwidth**, Cloudflare kann dort nichts cachen |
| Caching-Schicht, CDN „Pflicht bei dieser Leserzahl" | `useCdn: false`, `perspective: 'drafts'`, `force-dynamic` → **jeder Seitenaufruf = Vercel-Function + Live-Sanity-API-Request**, null Caching auf allen Ebenen |
| Kostenbewusste Bild-Auslieferung | Kein `srcset`/`sizes` → Phones laden Desktop-Auflösungen (1400–2400 px) |

Für den Piloten ist das **bewusst und vertretbar** (Live-Preview der Drafts ist Demo-Gold). Aber im Pitch muss die Story lauten: „So läuft der Demo-Modus; der Produktions-Modus ist konzipiert und hier ist die Messung" — und dafür muss der Image-Proxy-Spike einmal real gelaufen sein. Sonst gilt: **Der eigene Code widerlegt die eigene Kostenfolie.**

### 3.2 Der größte ungenutzte Hebel: Das Produkt ist quartalsweise statisch

Ein Magazin, das 3–4× pro Jahr erscheint und zwischen den Ausgaben **unverändert** ist, ist der Idealfall für statisches Rendering (SSG/ISR): Die komplette Ausgabe wird bei Veröffentlichung **einmal** gebaut und dann als statische Dateien ausgeliefert.

Konsequenzen, wenn man das in der Produktion so baut:
- **Vercel-Functions ≈ 0** (statt 1 Function-Aufruf pro Leser-Seitenaufruf), Edge-Requests bleiben im Pro-Inklusivvolumen.
- **Sanity-API-Last ≈ 0** im Lesebetrieb (statt 250k-Request-Limit zu reißen — heute zählt durch `useCdn:false` jeder Aufruf gegen das teurere API-Kontingent).
- **Robustheit:** Statische Seiten haben keinen Incident-Pfad „Function crasht am Launch-Tag" — direkt relevant für K5.
- Damit wird sogar der Plan-B-Host trivial (statisches Bundle läuft überall, inkl. Cloudflare für ~$5/Monat).

Das ist keine neue Komponente, sondern eine Render-Strategie-Entscheidung — gehört GENAU in den 1–2-Tage-Senior-Dev-Termin.

### 3.3 Kostenfallen konkret (live verifiziert, 10.06.2026)

Quellen: [sanity.io/pricing](https://www.sanity.io/pricing), [vercel.com/pricing](https://vercel.com/pricing).

| # | Falle | Zahl | Einordnung |
|---|---|---|---|
| 1 | **Sanity-Bandwidth ohne CDN-Layer** | 100 GB/Mon inkl., dann **$0,30/GB** → 2 TB/Ausgabe ≈ **~$600/Ausgabe ≈ $8k/Jahr** | DIE Falle. Gelöst nur, wenn Bild-Proxy/eigene Domain wirklich gebaut wird (Spike!) |
| 2 | **Vercel Hobby = nicht-kommerziell** | Pilot läuft auf Hobby | Für interne Demo Grauzone; mit Werbung/echten Lesern: **Pro ($20/Seat/Mon) Pflicht** |
| 3 | **Function-Aufrufe durch `force-dynamic`** | Pro: $20-Credit inkl., Active CPU $0,128/h, Edge Requests $2/Mio | Bei 35k Lesern × mehrere Seitenaufrufe ohne Caching real spürbar; mit SSG/ISR ≈ 0 |
| 4 | **Sanity-API-Requests (nicht CDN)** | 250k/Mon inkl., dann $1/25k | `useCdn:false` heißt: JEDER Read zählt hier. 35k Leser reißen das locker. Mit Statik irrelevant |
| 5 | **Sanity Extra-Datasets** | **$999/Monat pro Dataset (!)** | Versteckter Hammer: NIEMALS „ein Dataset pro Magazin" designen. Ein Dataset + `magazine`-Feld (so bereits geplant ✓) |
| 6 | **Private Datasets erst ab Growth** | Growth $15/Seat/Mon | Für Produktion Pflicht (unveröffentlichte Ausgaben dürfen nicht public sein). 2–4 Seats = $30–60/Mon — okay, aber einpreisen |
| 7 | **Fehlendes `srcset`** | Phone lädt ~2–4× zu große Bilder | Multipliziert Falle 1 unnötig; Produktions-Fix ist klein |
| 8 | **Usage-Drift generell** | Vercel Spend Management: Budget-Alarm + **Hard-Cap mit Auto-Pause** verfügbar | Sofort aktivieren, sobald Pro. Schützt vor den viralen $96k-Rechnungen (Cara-Fall 2024) — Restrisiko: Pause = Seite offline |

**Realistische Kostenszenarien Produktion (4 Magazine, mit CDN-Layer + Statik):**
- **Basis:** Sanity Growth (3 Seats ≈ $45) + Vercel Pro (1–2 Seats ≈ $20–40) + Cloudflare Free = **~$65–85/Monat ≈ $800–1.000/Jahr**.
- **Schlecht konfiguriert** (kein Bild-Proxy, kein Caching): **+$600 pro Ausgabe** Sanity-Overage + Function-Kosten → $8–10k/Jahr. Der Unterschied zwischen beiden Szenarien ist KEINE Anbieter-Eigenschaft, sondern **eine Woche Architektur-Arbeit** — exakt dafür ist der Senior-Dev-Termin da.

### 3.4 Abhängigkeiten ehrlich bilanziert

| Abhängigkeit | Schwere | Einordnung |
|---|---|---|
| **Sanity** | Mittel | Content-Export sauber möglich (`sanity dataset export` → NDJSON + alle Assets, kein Geisel-Szenario). Echte Bindung: GROQ-Queries, Portable Text, Custom-Studio-Inputs (unsere Placer!) — Wechsel = 2–4 Wochen Arbeit. **Preismodell-Drift ist real** (Umstellung 2024 hat Bestandskunden verteuert) → jährlich Preise prüfen, Exit-Hygiene: regelmäßiger Dataset-Export als Backup (heute nicht eingerichtet!) |
| **Vercel** | Niedrig | Bewusst kein `next/image`, keine Vercel-Spezialdienste → Next.js-App ist umzugsfähig (Cloudflare Workers via OpenNext ~$5/Mon, Netlify, Self-Host). Statik-Strategie senkt die Bindung weiter |
| **Cloudflare** | Niedrig | Free-Plan-CDN für Bild-Caching heute zulässig (alte Traffic-Klausel 2023 entschärft); 2 TB/Quartal unauffällig |
| **Next.js/React** | Mittel–Hoch | Die eigentliche Langzeit-Bindung — Framework-Großversionen erzwingen Pflege-Zyklen. Akzeptabel, aber im Produktions-Budget „1–2 Wartungs-Sessions/Jahr" einplanen |
| **Claude/KI als Implementierungs-Partner** | Mittel | Ehrlich benennen: Das Betriebsmodell hängt an Tims Verfügbarkeit UND an einem KI-Abo. Abfederung = Doku (gut!) + Senior-Dev-Lifeline + statische Architektur (wenig kann brechen) |

**Fazit Stack:** Behalten. Nichts am Stack selbst gefährdet die Budget-Freigabe — gefährlich ist nur die Lücke zwischen beschlossener und gebauter Architektur, und die ist mit einem Mess-Spike + Senior-Dev-Tag schließbar.

---

## 4. Code-Befund (Senior-Dev-Blick aufs Repo)

Vorab das Wichtigste — **eine Falschmeldung entkräftet:** Ein erster Audit-Durchlauf meldete „Sanity-Token im Repo committet". **Stimmt nicht** — verifiziert: `.env.local` ist sauber gitignored, nicht im Index, nicht in der Git-History; die Seed-Skripte lesen den Token aus `~/.config/sanity/config.json`. Secrets-Hygiene ist in Ordnung. ✓

Was bleibt (Pilot-akzeptabel, aber als Härtungs-Liste für die Produktion dokumentiert):

| Prio | Befund | Beleg | Produktions-Konsequenz |
|---|---|---|---|
| Hoch | Öffentliche Vercel-URL zeigt **Drafts** (`perspective:'drafts'`) und ist **indexierbar** (kein `robots`/`noindex`) | `lib/sanity.ts:10` | Vor echten Inhalten: published-Perspektive + Draft-Preview nur hinter Auth; für den Piloten mind. `noindex` (auch wg. SEO-Duplikaten zu ebike-mtb.com) |
| Hoch | Null Caching: `force-dynamic` + `useCdn:false` auf allen Routen | `app/page.tsx:4`, `app/artikel/[slug]/page.tsx:5` | SSG/ISR-Umstellung (siehe §3.2) |
| Hoch | Kein Service Worker → kein Offline (Manifest existiert ✓) | `app/manifest.ts` vorhanden, `sw` fehlt | Der K2-Spike |
| Mittel | Carousel lädt **alle** Panels der Ausgabe mit vollem Body in einem Request/State | `getIssuePanels()` → `ArticleCarousel` | Bei 30-Artikel-Ausgaben Lazy-Load nötig; für 6-Panel-Pilot okay |
| Mittel | Hardcoded: `ISSUE_ID='issue-emtb-042'`, Sprache `.de` in jeder GROQ-Projektion, `de-DE`-Datumsformate | `lib/sanity.ts:17,26ff` | Multi-Issue-Routing + Sprach-Parameter = bekanntes To-do (EN/DE-Umschalter steht eh auf der Liste); Aufwand ehrlich: mehrere Tage, kein Nachmittag |
| Mittel | `strict:false`, keine Tests, `any`-Typen durchgehend | `tsconfig.json` | Vor Produktion: strict + Tests für Geometrie-/Sortier-Logik (Tims Quality-Erwartung sagt das selbst) |
| Niedrig | `globals.css` 2.368 Zeilen monolithisch; `ArticleView.tsx` 507 Zeilen Block-Switch | — | Bewusste Spike-Qualität; bei Produktion modularisieren |
| Niedrig | Kein automatischer Sanity-Export/Backup eingerichtet | — | Cron/Skript für `dataset export` = billige Versicherung (auch gegen Lock-in, §3.4) |

Diese Tabelle ist bewusst die **Mitgift für den Senior-Dev-Termin** — sie zeigt Max & Robin außerdem, dass das Projekt seine eigenen Schwächen kennt (Vertrauens-Argument).

---

## 5. Pitch-Argumente, die einer kritischen Gründer-Frage NICHT standhalten (und ihre Fixes)

| Behauptung | Gründer-Konter | Fix vor dem Pitch |
|---|---|---|
| „Offline-fähig wie die alte App" | „Zeig mir." | SW bauen + iOS-7-Tage-Test JETZT starten; sonst Formulierung ändern: „Offline ist Plan, hier der Teststand + Capacitor-Plan-B" |
| „Spart GZD-/Button-Publish-Kosten" | „Wie viel genau?" | Ist-Kosten erfragen (K1) |
| „1–2 h pro Artikel statt InDesign-Tage" | „Gemessen oder geschätzt?" | Einen Artikel von Hand einpflegen + stoppen (K3.2) |
| „Premium-Werbung refinanziert das" | „Hat ein Kunde das je gesehen/bepreist?" | Specialized-Modul EINEM Vermarkter/Kunden zeigen, grobe Preis-Hypothese mitbringen; Aufwand pro Modul ehrlich nennen (Stunden–Tage) |
| „21–35k Leser pro Ausgabe" | „Aus Analytics oder Mediakit?" | Echte Zahlen + iOS-Split besorgen (K4) |
| „Tim wuppt das mit KI" | „Und wenn Tim ausfällt / am Launch-Tag was bricht?" | K5-Folie: Doku + Managed-Stack + Senior-Dev-SLA + statische Architektur |
| „Sanity ist das richtige CMS" | „Sagt wer — hat es der Art Director benutzt?" | Julian-Session vor dem Pitch (Mess-Frage 5) |

---

## 6. Empfehlung: Der Weg zur Budget-Freigabe

**Phase 1 — Mess-Sprint (nächste 3–5 Sessions, KEINE neuen Features):**
1. **Service-Worker-Spike** (App-Shell + eine Ausgabe offline) → sofort danach **iOS-7-Tage-Test starten** (Kalenderzeit läuft!). Android nebenher.
2. **Image-Delivery-Spike:** eigene Asset-Domain/Proxy + Cloudflare davor, eine Artikel-Session mit echten Bildern messen (MB pro Leser, Cache-Hit-Rate, was bei Sanity ankommt). Nebenbei `srcset` für die größten Bilder.
3. **Zeit-pro-Artikel:** einen Artikel (oder die ausstehenden Asset-Pflegen) von Hand im Studio, Protokoll führen.
4. **Lighthouse/Performance-Audit** als harte Demo-Zahl (steht ohnehin auf der Liste).

> **Nachtrag (Tims Entscheidung, 10.06.):** Punkte 5+6 (Julian-Session, Senior-Dev-Review) bewusst **nach** der ersten Pitch-Runde — der Senior-Dev-Review wird im Pitch als „Position 1 des beantragten Budgets" ausgewiesen (Honest-Slide), nicht als Vorleistung erbracht. Bedingung: Falls Julian bei Pitch-Runde 1 dabei ist, sieht er den Piloten vorher kurz (30 min), nicht zum ersten Mal im Termin. Punkt 7 (Ist-Kosten, Leserzahlen, iOS-Split) erledigt Tim vor dem Pitch.

**Phase 2 — Stakeholder & Zahlen (parallel, von Tim):**
5. **Julian-Session** (1 h, Pilot zeigen, Editor-UX testen lassen) — macht ihn zum Verbündeten.
6. **Senior-Dev finden + 1–2 Tage Review buchen** — Ergebnis „Architektur-Abnahme mit Auflagen" ist eine Pitch-Folie, keine Schwäche. §4-Tabelle als Einstieg mitgeben.
7. **Drei Zahlen einsammeln:** Ist-Kosten heute, echte Leser-Analytics, iOS/Android-Split.

**Phase 3 — Pitch-Paket:**
8. Business-Case-Folie (heute X → morgen Y), Kostenmodell ($65–85/Mon-Szenario + Senior-Dev-Tage), Risiko-Folie mit Messwerten, **„Was der Pilot bewusst NICHT beweist"-Folie** (Ehrlichkeit schlägt Hochglanz — das war die Kernlehre des externen Reviews), Produktions-Roadmap mit Härtungs-Liste (§4).

**Kurzfristige Pilot-Hygiene (kleine Eingriffe, wenn freigegeben):** `noindex` auf die Vercel-URL; Vercel Spend-Cap aktivieren sobald Pro; einmaliger `sanity dataset export` als Backup.

---

## 7. Was der Skeptiker AUCH sagen muss (damit das Review fair bleibt)

- Die **strategische Grundlage ist ungewöhnlich solide**: Zero-Daten-Befund des Alt-Systems, echter Ausfall als Trigger, CMS-agnostisches Schema-Konzept, dokumentierte Entscheidungen mit Begründung. Das ist mehr Vorarbeit, als die meisten finanzierten Projekte haben.
- Die **frühen Architektur-Entscheidungen waren überdurchschnittlich gut**: kein `next/image` (Kostenfalle umgangen), ein Dataset statt vier ($999-Falle umgangen), generische statt relationale Tabelle (Überengineering vermieden), Werbe-Modell am echten Verkaufsprozess entlang gebaut.
- Das **gebaute Niveau** (Studio-Placer mit Bühnen-Pattern, Geometrie-Wizard, Swipe-Carousel, Custom-Anzeige inkl. gelöstem iOS-Compositing-Bug) beweist die Kernthese „Tim + KI können das Produkt bauen" besser als jede Folie.
- Die Lücken sind **sämtlich schließbar** in Wochen, nicht Monaten — nichts davon ist ein strukturelles K.O. Genau deshalb lohnt es sich, sie VOR dem Gründer-Termin zu schließen statt darin erklärt zu bekommen.

---

*Anhang — live verifizierte Preisdaten (10.06.2026): Sanity Free $0 (20 Seats, 2 public Datasets, 10k Docs, 100 GB Assets, 100 GB Bandwidth/Mon, 1 Mio CDN-Req, 250k API-Req) · Growth $15/Seat/Mon (private Datasets, 25k Docs; Overage: $0,30/GB Bandwidth, $0,50/GB Assets, $1/25k API-Req, $999/Extra-Dataset/Mon) · Vercel Hobby $0 („personal, non-commercial") · Pro $20/Seat/Mon + Usage ($20 Credit; 1 TB Transfer, 10 Mio Edge-Req inkl.; Overage $0,15/GB, $2/Mio Edge-Req, $0,128/h Active CPU, $0,05/1k Image-Transformations; Spend Management mit Hard-Cap). iOS-PWA-Quellen: [MagicBell PWA-iOS-Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [vinova iOS-PWA-Limitations](https://vinova.sg/navigating-safari-ios-pwa-limitations/).*
