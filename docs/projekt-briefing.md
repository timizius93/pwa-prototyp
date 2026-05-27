# Projekt-Briefing: Magazin-PWA für 41 Publishing
*(Eigenständige Zusammenfassung für einen externen Gegencheck — alles Nötige ist hier enthalten, keine weiteren Dateien erforderlich.)*

## Was ist das Projekt?

41 Publishing ist ein Verlag (gegr. 2011, ~40 Mitarbeiter) mit vier digitalen Magazinen rund ums Fahrrad/Lifestyle:
- **ENDURO** (Mountainbike), **E-MOUNTAINBIKE** (E-MTB, aktueller Hauptfokus), **GRAN FONDO** (Rennrad/Gravel), **DOWNTOWN** (Urban/Lifestyle).

Jedes Magazin erscheint 3–4×/Jahr als kuratierte Ausgabe (kein tägliches News-Portal — das läuft separat über WordPress-Websites). Heute werden die Ausgaben als **native App** (iOS/Android) ausgeliefert, erstellt mit **„Button Publish"** (einem InDesign-Plugin).

**Ziel:** Die native App durch eine **Progressive Web App (PWA)** ablösen — installierbar ohne App Store, offline-fähig, responsive, auf einer Subdomain (z. B. mag.ebike-mtb.com).

## Warum der Wechsel?

- Button Publish ist veraltete, fragile Infrastruktur ohne aktiven Support (kürzlich kompletter Ausfall).
- App-Store-Abhängigkeit, doppeltes Layout (iPad + iPhone), kein Web, kein Offline-Web.
- Kosten (externe InDesign-Firma „GZD" + Button-Publish-Lizenz + App-Store).
- **Kritischer technischer Befund:** Der Button-Publish-Export enthält **null strukturierte Daten** — jeder Text, jede Überschrift, jede Spec-Tabelle ist als PNG-Bild gerendert auf einem fixen 1024px-Layout. Konsequenz: kein Archiv-Wert, keine Suche, keine Wiederverwendung, jede Sprache ist faktisch ein eigenes Heft. Wenn Button Publish stirbt, sind alle Alt-Ausgaben technisch tot.

## Ausgangslage / harte Fakten

- **Echte Content-Quelle:** Google Docs in Google Drive, halb-strukturiert mit klarem Meta-Header (TITEL MAG, TITEL WEB/SEO, Autor, Fotograf, Keywords, Checkliste, …). Aus denselben Docs werden heute auch (manuell) die WordPress-Artikel gebaut.
- **Spec-Daten:** bei Einzeltests teils in separatem Google Sheet, bei Vergleichstests inline im Doc als Tabelle.
- **Fotos:** in Google Drive, zwei Export-Varianten pro Bild — `-WEB-` (für WordPress, mit Wasserzeichen + Fotograf-Credit) und `-MAG-` (fürs Heft, sauber).
- **Reichweite:** 21.000–35.000 Leser pro Ausgabe (variiert je Magazin), ~14 Ausgaben/Jahr über alle 4 Magazine.
- **Sprachen:** DE + EN über alle Magazine (Spanisch wurde bei E-MTB eingestellt).

## Team / Constraints

- **Tim** (treibt das Projekt): Mediengestalter, **Teilzeit, kein Entwickler**, konzeptionell stark. Will das Projekt **selbst umsetzen mit Claude Code (KI) als Implementierungs-Partner**.
- **Julian Lemme:** Art Director (intern), macht Design/Bildauswahl — noch nicht offiziell eingebunden.
- **GZD:** externe Firma, heutige InDesign-Pflege.
- **Max & Robin Schmitt:** Gründer, entscheiden über Budget. Aktuell ist nur „weiter recherchieren" freigegeben — der **Pilot dient als Entscheidungsgrundlage** für ein echtes Budget.
- **Senior-Dev (Freelance):** soll nur **punktuell beratend** tätig sein (Architektur-Review, Pre-Launch-Review, Werbe-Integration, Notfall-Lifeline) — nicht die Routine-Implementierung.

## Getroffene Entscheidungen

| Thema | Entscheidung | Begründung |
|---|---|---|
| **CMS** | **Sanity** (Headless-CMS) — für Pilot UND Produktion | Doc-Template ≈ Sanity-Schema; beste Live-Preview; Managed (kein Ops für einen Nicht-Dev) |
| **Stack** | **Sanity + Next.js + Vercel + Cloudflare** (alles Managed, kein eigener Server) | Tim soll nicht Sysadmin sein |
| **Payload (Alternative)** | **Verworfen** | Self-Hosting = Ops-Last (Updates, Backups, Security), passt nicht zum Selbst-Wuppen-Modell eines Teilzeit-Nicht-Devs |
| **Bild-Bandwidth** | **Cloudflare CDN davor** (Bilder bleiben in Sanity) | Bei 35k Lesern = ~2 TB/Ausgabe; ohne CDN ~$8k/Jahr Overage; mit CDN quasi gelöst, Pflege bleibt unberührt |
| **Sprachen** | DE + EN, Schema von Anfang an mehrsprachig (field-level i18n) | weitere Sprachen später per Config zuschaltbar |
| **Content-Workflow** | Google Doc → Sanity bleibt **manuell** (Tims bewusste Entscheidung) | Quality-Gate + Tims Job-Inhalt; Auto-Import höchstens als Hilfsmittel |
| **WordPress** | bleibt **komplett unangetastet** | 12+ Jahre Artikel, Rück-Migration unrealistisch; Forward-Sync höchstens Phase 2 |

## Schema-Ansatz (Sanity)

**Komponenten-basiert, nicht seiten-basiert.** Ein Artikel = ein Header (gemeinsame Felder) + ein flexibler `body` aus wiederverwendbaren Komponenten.

- **Globale Bausteine (referenzierbar):** Magazin, Ausgabe, Person (Autor/Fotograf/Tester), Hersteller, Motor-Modell.
- **~17 Komponenten:** Title-Page, Article-Hero, Article-Text, Pull-Quote, Fullbleed-Photo (mit Scroll-Effekt), Photo-Grid (2/3/4), Spec-Line, Geometry-Overlay (interaktiv, datengetrieben), Hotspot-Image (klickbare Marker auf Foto), Verdict-Panel (Fazit + Tops/Flops über Foto), Tuning-Tip, Award-Box, Comparison-Table, Quote-Dialog, Tester-Carousel, Ad-Slot, CTA.
- **Artikel-Typen:** Einzeltest, Vergleichstest, Editorial, Reportage, Think-Tank, Cover, Inhaltsverzeichnis, Regulars.
- **Header pro Artikel** spiegelt 1:1 das Google-Doc-Template (zwei Titel: `title_mag` für PWA/Heft, `title_web` für SEO/WordPress).

**Interaktive Highlights** (in Button Publish unmöglich, als „Wow"-Demo gedacht): datengetriebenes Geometrie-Overlay mit Größen-Switcher (S–XXL) und klickbare Hotspots auf Bike-Fotos.

## Pilot-Plan

Drei reale Artikel aus E-MTB Ausgabe #042 werden manuell in Sanity nachgebaut + als PWA gerendert — als Demo für Max & Robin:
1. **Editorial** „Run, Forrest, run!" (einfachster Artikel, erster Schritt)
2. **Einzeltest** Nicolai S18 SWIFT (mit Geometrie-Overlay + Hotspots)
3. **Vergleichstest** 11 E-MTB-Motoren (mit Tabellen, Tester-Portraits, Awards)

Keine neue/laufende Ausgabe als Pilot — bewusst eine bereits fertige, weil die Produktion zeitkritisch ist.

## Bewusst NICHT im MVP

Automatischer Doc-Import, WordPress-Sync, Migration alter Hefte, Volltext-Suche, Push-Notifications, Reader-Login, paralleles Multi-Magazin-Setup, tiefes Theming pro Magazin. (Schema unterstützt vieles davon, aber Fokus bleibt eng.)

## Offene Punkte

- Framework Next.js noch nicht formell abgehakt (faktisch gesetzt).
- Genaue Bild-Anzahl/-Größe pro Ausgabe (für Kostenrechnung).
- Sanity-Plan-Stufe + Anzahl Seats.
- Title-Page-Workflow im Detail (SVG-Upload vs. Template-Library) — mit Julian.

---

## Bitte kritisch prüfen (für die gegencheckende KI)

Bitte sei ein kritischer „Red Teamer", kein Ja-Sager. Konkret:

1. **Ist Sanity die richtige Wahl** für ein bild-lastiges Magazin mit 21–35k Lesern/Ausgabe und einem Nicht-Dev als Treiber? Welche Schwächen/versteckten Kosten übersehen wir? Gibt es bessere Alternativen (z. B. Storyblok, Strapi, Contentful, Directus, statisches Setup)?
2. **Ist das „Tim wuppt selbst mit KI, Dev nur punktuell"-Modell realistisch** für eine öffentliche Produktiv-App mit dieser Reichweite? Wo sind die größten Risiken? Was wird typischerweise unterschätzt?
3. **Ist die Bandwidth-/Kosten-Analyse plausibel?** (Annahmen: ~200 Bilder/Ausgabe, ~300 KB/Bild, ~60 MB/Leser, CDN-Caching senkt Sanity-Origin-Last drastisch.) Stimmt die Größenordnung? Was fehlt (z. B. Vercel-Kosten, Funktions-Aufrufe, Build-Minuten)?
4. **Ist der komponenten-basierte Schema-Ansatz angemessen** — oder über-/unter-engineered für ein 3–4×/Jahr erscheinendes Magazin?
5. **Welche blinden Flecken** hat der Plan insgesamt? (z. B. SEO der PWA, Werbe-Integration/GAM-Realität, Offline-Strategie, Accessibility, Analytics, DSGVO, App-Store-Erwartung der bestehenden Leser, Migration der Nutzerbasis von nativer App zu PWA.)
6. **Stimmt die strategische Reihenfolge?** (Erst Pilot als Budget-Entscheidungsgrundlage, dann echtes MVP.) Oder sollte etwas anders priorisiert werden?
7. **Was würdest du anders machen** — und warum?
