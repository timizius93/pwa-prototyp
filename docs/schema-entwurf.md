# Sanity Schema-Entwurf — 41 Publishing Magazin-PWA

> **Status:** Entwurf v0.1 · Stand Mai 2026
> **Zweck:** Diskussionsgrundlage für Tim, Julian, Max & Robin. Beschreibt, wie die Inhalte der vier Magazine in Sanity strukturiert sein werden — nicht als Code, sondern als Feldliste mit Erklärung.
> **Ableitung:** Basiert auf dem realen E-MTB #042 (Button-Publish-Export + Google Docs der Pilot-Artikel) und den heutigen Redaktions-Workflows von 41 Publishing.

---

## 0. Lesehinweis

Dieses Dokument ist in vier Ebenen aufgebaut:

1. **Globale Bausteine** — Dinge, die einmal existieren und in vielen Artikeln referenziert werden (Magazin, Ausgabe, Person, Hersteller).
2. **Komponenten-Bibliothek** — wiederverwendbare Bausteine, die in Artikeln zusammengesteckt werden (Article-Hero, Photo-Grid, Spec-Line, Hotspot-Image …).
3. **Artikel-Typen** — die Dokument-Vorlagen, mit denen ein Artikel im CMS angelegt wird (Einzeltest, Vergleichstest, Editorial, …).
4. **Pilot-Anwendung** — wie die drei E-MTB-#042-Pilot-Artikel konkret in Sanity aussehen würden.

Jede Komponente folgt diesem Schema:
- **Was:** Eine Zeile, was das Ding ist.
- **Wo im Heft:** Konkretes Beispiel aus E-MTB #042 oder einem anderen Magazin.
- **Felder:** Die Eingabefelder im CMS, mit Typ.
- **UX im Editor:** Wie Julian/GZD/Tim das im Sanity-Studio bedienen.
- **Hinweise:** Edge-Cases, offene Fragen, Erweiterungspfade.

**Konventionen:**
- `localizedText` = Feld, das gleichzeitig DE und EN aufnimmt (Sanity rendert beide Sprachen nebeneinander).
- `reference → X` = Verweis auf ein anderes Dokument (z. B. Person, Hersteller).
- Felder mit `?` sind optional.

---

## 1. Architektur-Prinzipien

Vier Grundsätze, die das Schema durchziehen:

1. **Eine Codebase, vier Magazine.** Jedes Magazin (ENDURO, E-MOUNTAINBIKE, GRAN FONDO, DOWNTOWN) ist ein Tenant im selben Sanity-Projekt. Das Magazin wird pro Ausgabe und pro Artikel als Feld geführt — gleiche Schemas, eigenes Branding pro Magazin.
2. **DE + EN von Anfang an.** Jedes redaktionelle Textfeld ist `localizedText`. Spanisch lässt sich später dazuschalten, ohne das Schema zu ändern.
3. **Komponenten-basiert, nicht seitenbasiert.** Eine Artikel-Seite ist eine Sequenz von Komponenten (Hero, Photo-Grid, Spec-Line, Text-Absatz, …). Kein festes „Seite 1 / Seite 2"-Layout — die PWA fließt responsive.
4. **Doppelter Header pro Artikel.** Jeder Artikel hat einen `title_mag` (kurz, plakativ — wird in PWA und Heft verwendet) UND einen `title_web` (länger, SEO-optimiert — wird heute manuell ins WordPress übertragen, in der PWA selbst NICHT angezeigt). `title_web` wird im Sanity-Schema mitgeführt, damit es perspektivisch für eine WordPress-Synchronisation zur Verfügung steht — die PWA bleibt davon aber unberührt.
<!-- In dem Doc haben wir die zwei titel weil diese oft für magazin und später auch im Wordpress Blog verwendet werden, und für Wordpress verwenden wir den titel_web weil hier SEO Relevant ist. In der App wird nur title_mag verwendet -->
---

## 2. Globale Bausteine

### 2.1 `magazine` (Magazin)

**Was:** Eines der vier Magazine.

**Felder:**
- `name`: string (z. B. „E-MOUNTAINBIKE")
- `slug`: string (z. B. `emtb`)
- `primaryColor`: color (Branding-Akzent für die PWA)
- `logo`: image
- `domain`: string (z. B. `mag.ebike-mtb.com`)
- `defaultLanguages`: array of `'de' | 'en' | 'es'`

**UX im Editor:** Vier Einträge, einmalig angelegt. Editoren wählen pro Artikel das Magazin per Dropdown.

**Hinweise:** Branding-Tokens (Typografie, Farben) gehören perspektivisch hierher. Falls die vier Magazine sehr unterschiedliche Tonalitäten brauchen, kann hier später ein `theme`-Objekt mit Font-Stack, Akzentfarbe, Hero-Stilrichtung ergänzt werden.

---

### 2.2 `issue` (Ausgabe)

**Was:** Eine Heft-Ausgabe eines Magazins.

**Felder:**
- `magazine`: reference → magazine
- `number`: number (z. B. 42)
- `title`: localizedText (z. B. „Run, Forrest, run!" / „Run, Forrest, run!")
- `publishDate`: date
- `cover`: reference → article (typ: cover)
- `tableOfContents`: reference → article (typ: toc)
- `articles`: array of references → article (Reihenfolge entspricht Heft-Reihenfolge)
- `theme`?: string (optionales Schlagwort: „Brixen Papers", „Best of 2026", …)

**UX im Editor:** Pro Ausgabe wird ein Issue-Dokument angelegt. Die Artikel-Reihenfolge wird per Drag-and-Drop verwaltet — wie der Inhaltspaginator im InDesign-Workflow heute.

**Hinweise:** Das ist auch das Dokument, das die PWA als „Ausgabe herunterladen" cached.

---

### 2.3 `person` (Person)

**Was:** Eine Person, die mehrfach in Artikeln auftaucht (Autor, Fotograf, Lektor, Übersetzer, Tester).

**Felder:**
- `name`: string
- `role_default`: string (z. B. „Tester", „Autor")
- `bio`: localizedText (Mini-Biografie, ~1–3 Sätze)
- `portrait`: image
- `social`?: object (Instagram, Strava, …)

**UX im Editor:** Wird einmal angelegt, dann via `reference` in Artikeln verwendet. Zum Beispiel taucht „Bene", „Lars", „Peter" usw. in jedem Vergleichstest auf — nur einmal pflegen.

**Hinweise:** Im Doc-Header steht heute „AUTOR / FOTOGRAF / LEKTOR / ÜBERSETZER" als Freitext. Im CMS wird das zu vier Referenz-Listen.

---

### 2.4 `manufacturer` (Hersteller)

**Was:** Eine Bike- oder Komponenten-Marke.

**Felder:**
- `name`: string (z. B. „NICOLAI", „Specialized")
- `logo`?: image
- `website`: url
- `country`: string (relevant für DOWNTOWN/Origin-Tabellen)
- `categories`: array of `'bike' | 'motor' | 'component' | 'apparel' | 'lifestyle'`

**UX im Editor:** Wird einmal angelegt, dann referenziert. Z. B. „NICOLAI" wird einmal eingepflegt; im Nicolai-Test wird darauf verwiesen.

**Hinweise:** Weil „Hersteller" im neuen System eine echte Entität ist (nicht nur ein Wort im Fließtext), kann die PWA Verknüpfungen herstellen, die heute fundamental nicht gehen. Konkret:
- Auf einer Specialized-Übersichts-Seite alle Specialized-Tests der letzten Ausgaben automatisch listen
- Im aktuellen Bike-Test ein Modul „Weitere Specialized-Tests" einblenden
- Intern eine Frage wie „Wie viele Specialized-Modelle haben wir 2025/2026 getestet?" sekundenschnell beantworten
- Für Werbekunden interessant: „Wir können dir zeigen, wie oft Bosch/Specialized/etc. in unseren Heften vorkam"

In Button Publish steht „Specialized" nur als gerendertes Pixel im Foto und Text — niemand kann darauf abfragen. In Sanity wird's zu einem Datenpunkt.
<!-- Diesen Punkt verstehe ich nicht ganz -->

---

### 2.5 `motorModel` (Motor-Modell) — E-MTB-spezifisch

**Was:** Ein konkreter E-Bike-Motor. Wiederkehrend im E-MTB-Magazin in Bike-Tests und Vergleichstests.

**Felder:**
- `manufacturer`: reference → manufacturer
- `name`: string (z. B. „Performance Line CX-R")
- `maxTorque_Nm`: number
- `maxPower_W`: number
- `supportRatio_percent`: number
- `weight_kg`: number
- `claimedBatteryCapacity_Wh`?: number
- `developmentCountry`?: string
- `assemblyCountry`?: string

**UX im Editor:** Wird einmal angelegt (z. B. „Bosch Performance Line CX-R") und dann in jedem Bike-Test referenziert, der diesen Motor verbaut hat. Im Motoren-Vergleichstest tauchen sie als Liste auf.

**Hinweise:** Diese Struktur löst exakt die Doppelpflege, die heute zwischen Bike-Test-Doc und Motoren-Vergleichstest-Doc passiert (gleiche Daten zweimal eintippen).

---

### 2.6 Sprachen / Lokalisierung

**Mechanik:** `localizedText` ist ein Custom-Field-Typ, der pro Sprache ein Sub-Feld hat:

```
title: {
  de: "NICOLAI S18 SWIFT – Bombproof Backbone"
  en: "NICOLAI S18 SWIFT – Bombproof Backbone?"
}
```

Im Sanity-Studio sieht der Editor die Sprachen nebeneinander oder via Tabs. Beim Veröffentlichen entscheidet ein `availableLanguages`-Feld pro Artikel, welche Sprachen ausgespielt werden.

**Erweiterung später:** Spanisch oder weitere Sprachen brauchen nur ein zusätzliches Sub-Feld — keine Schema-Migration nötig.

---

## 3. Komponenten-Bibliothek

Die Komponenten sind die LEGO-Steine eines Artikels. Eine Artikel-Seite hat ein Array `body: [Component]`, das in der Reihenfolge der gewählten Komponenten gerendert wird.

### 3.1 `titlePage` — Titelseite des Artikels

**Was:** Der Aufmacher / das Cover des Artikels. Gestalterisch aufwendigste Komponente.

**Wo im Heft:** „BREAKING THE CYCLE — 41 Think Tank 2025" (E-MTB #042, S. 018) mit Kreis-Typografie über Berg-Foto.

**Felder:**
- `mode`: `'svg_upload' | 'template'`
- `eyebrow`?: localizedText (z. B. „INSPIRATION")
- `pageNumber`?: number (zeigt im Header „018 — INSPIRATION")
- **wenn mode = `svg_upload`:**
  - `customSvg`: file (Julians SVG-Export aus Figma, Text als Outlines oder live)
  - `backgroundImage`: image
- **wenn mode = `template`:**
  - `template`: `'circular_typography' | 'large_stacked' | 'diagonal' | 'framed' | 'split' | 'minimal'`
  - `title`: localizedText
  - `subtitle`?: localizedText
  - `backgroundImage`: image

**UX im Editor:**
- Pilot-Phase: nur `mode: svg_upload` aktiv — Julian gestaltet wie heute und lädt SVG hoch.
- Spätere Phase: Templates dazu, sodass 80% der Artikel ohne Designer-Touch auskommen.

**Hinweise:** Das ist die einzige Komponente, bei der Design-Freiheit über Standardisierung gewinnt. Mit Julian separat diskutieren, ob/wann Templates Sinn machen.

---

### 3.2 `articleHero` — Artikel-Einstieg

**Was:** Erste Inhaltsseite nach der Titel-Seite. Kategorie + Titel + Lead-Absatz + Autor.

**Wo im Heft:** Nach jeder Title-Page kommt typischerweise ein Hero mit „TEST" + Bike-Name + Intro-Absatz.

**Felder:**
- `category`: string (z. B. „TEST", „VERGLEICHSTEST", „INSPIRATION")
- `title_mag`: localizedText (Heft-/PWA-Titel)
- `subtitle`?: localizedText
- `lead`: localizedText (1–3 Sätze Anreißer)
- `authors`: array of reference → person
- `photographers`?: array of reference → person
- `heroImage`?: image

**UX im Editor:** Mappt 1:1 auf die ersten Felder im Google Doc (TITEL MAG, Autor, Fotograf, Lead-Paragraph).

**Hinweise:** `title_web` (SEO) lebt nicht hier, sondern auf der Artikel-Dokument-Ebene — siehe Abschnitt 4.

---

### 3.3 `articleText` — Fließtext mit Zwischenüberschriften

**Was:** Standard-Textblock mit Heading-2, Heading-3, Pull-Quotes, Listen.

**Wo im Heft:** Der „Body"-Teil jedes Artikels (Nicolai-Test hat 7 Abschnitte mit eigenen Überschriften).

**Felder:**
- `content`: localizedRichText (Sanity Portable Text — H2, H3, p, ul, ol, blockquote, links)

**UX im Editor:** Sanity's eingebauter Block-Editor (wie ein Google-Docs-Light). Inline-Formatierung (fett, kursiv, Link) per Toolbar.

**Hinweise:** Aus dem Google Doc kommen die meisten Heading-2-Sektionen direkt — z. B. „Das NICOLAI S18 SWIFT 2025 im Detail", „Die Geometrie des neuen NICOLAI S18 SWIFT", „Für wen ist das neue NICOLAI S18 SWIFT?".

---

### 3.4 `pullQuote` — Hervorgehobenes Zitat

**Was:** Großes Zitat, optisch hervorgehoben.

**Wo im Heft:** Editorial („Wenn man einmal losläuft, entsteht ein Momentum …"), Reportagen.

**Felder:**
- `text`: localizedText
- `attribution`?: reference → person (oder string)
- `style`?: `'centered' | 'sidebar' | 'fullwidth'`

---

### 3.5 `fullbleedPhoto` — Vollformatiges Foto

**Was:** Ein Foto, das die ganze Breite einnimmt, mit optionalem Scroll-Effekt.

**Wo im Heft:** Praktisch jeder Artikel hat 1–3 Fullbleed-Fotos.

**Felder:**
- `image`: image (MAG-Version aus Sanity Asset Library)
- `caption`?: localizedText
- `credit`?: reference → person (Fotograf)
- `scrollEffect`: `'none' | 'parallax' | 'scale' | 'kenBurns' | 'mask' | 'sticky'`
- `aspectRatio`: `'auto' | '16:9' | '3:2' | '1:1' | 'portrait'`

**UX im Editor:** Bild hochladen, Scroll-Effekt per Dropdown wählen, fertig.

**Hinweise:** Sanity erzeugt automatisch responsive Varianten (klein für Smartphone, groß für Tablet/Desktop) — keine manuellen iPad/iPhone-Crops mehr.

---

### 3.6 `photoGrid` — 2er / 3er / 4er Bild-Kombination

**Was:** Mehrere Bilder nebeneinander in einem Grid.

**Wo im Heft:** Im Nicolai-Test mehrfach (Dämpfer + Gabel, Lade-Port + Motor-Cover, Bremsen-Detail-Doppel).

**Felder:**
- `layout`: `'2_horizontal' | '2_vertical' | '3_horizontal' | '3_asymmetric_1+2' | '4_grid' | '4_horizontal'`
- `images`: array of object:
  - `image`: image
  - `caption`?: localizedText
  - `credit`?: reference → person

**UX im Editor:** Layout per Dropdown wählen, Bilder hochladen, Captions schreiben.

---

### 3.7 `specLine` — Pipe-getrennte Schnell-Spec

**Was:** Die wichtigsten Eckdaten des getesteten Produkts als kompakter Schnell-Überblick (Bike-Modell, Motor, Federweg, Gewicht, Preis, Hersteller-Link).
<!-- Weiß ich gar nicht genau wo das im Magazin eingebaut wird -->
**Wo im Doc:** Im Google Doc steht das direkt unter dem Hero-Bild als eine Pipe-getrennte Zeile (Beispiel: „NICOLAI S18 SWIFT | Bosch Performance Line CX / 600 Wh | 180/180 mm (v/h) | 24,2 kg in Größe M | 10.999 € | Hersteller-Website").

**Wo im Heft:** Wie GZD/Julian das im Layout platzieren, variiert — manchmal als Box unter dem Hero-Foto, manchmal als kleine Tabelle, manchmal in der Marginalspalte. Aktuell vermutlich kein fester Platz, weil's im InDesign-Layout flexibel ist. **Für die PWA empfehle ich einen festen Platz** (z. B. immer direkt unter dem Hero) — das schafft Wiedererkennung über alle Tests hinweg und reduziert pro-Artikel-Layout-Entscheidungen.

**Felder:**
- `bikeName`: string (oder reference → bike, wenn als eigener Doc-Typ)
- `motor`: reference → motorModel (rendert „Bosch Performance Line CX / 600 Wh")
- `travel_front_mm`: number
- `travel_rear_mm`: number
- `weight_kg`: number
- `weight_size`: string (z. B. „M")
- `price_eur`: number
- `manufacturerLink`: url

**UX im Editor:** Strukturierte Felder, kein Freitext. Vorteil: konsistente Darstellung über alle Bike-Tests + automatische Erfassung („alle Bikes unter 25 kg") + Übersetzung der Einheiten.

---

### 3.8 `geometryOverlay` — Interaktive Geometrie-Ansicht

**Was:** Bike-Foto + ein- und ausblendbares Overlay mit Geometrie-Werten + Größen-Switcher.

**Wo im Heft:** Aktuell statisch nur für Test-Größe (Nicolai S18 SWIFT in Größe M).

**Felder:**
- `bikePhoto`: image (das eine Standbild des Bikes)
- `arrows`: array of object — definiert Pfeil-Positionen einmalig:
  - `key`: `'reach' | 'stack' | 'headAngle' | 'seatAngle' | 'chainstay' | 'wheelbase' | …`
  - `startX`: number (0–1, relativ zur Bildbreite)
  - `startY`: number (0–1, relativ zur Bildhöhe)
  - `endX`: number
  - `endY`: number
  - `labelOffsetX`?: number
  - `labelOffsetY`?: number
- `measurements`: array of object — eine Zeile pro Größe:
  - `size`: `'S' | 'M' | 'L' | 'XL' | 'XXL'`
  - `reach_mm`: number
  - `stack_mm`: number
  - `headAngle_deg`: number
  - `seatAngle_deg`: number
  - `chainstay_mm`: number
  - `wheelbase_mm`: number
  - `topTube_mm`?: number
  - `seatTube_mm`?: number
  - `bbDrop_mm`?: number
- `photographedSize`: `'S' | 'M' | 'L' | 'XL' | 'XXL'`
- `disclaimer`?: localizedText (default: „Foto in Größe {photographedSize} – Maße siehe Tabelle.")

**UX im Editor:**
1. Bike-Foto hochladen.
2. „Pfeile platzieren"-Modus aktivieren → Julian/Tim klickt die Start- und Endpunkte der Pfeile auf dem Foto an (einmal pro Bike).
3. Geometrie-Tabelle ausfüllen — 5 Zeilen × Werte.
4. Test-Größe markieren.

**Hinweise:** Killer-Feature für Demo. Heute nur statisch für eine Größe in der App; mit der PWA für alle Größen interaktiv ohne Mehraufwand.

---

### 3.9 `hotspotImage` — Foto mit klickbaren `+`-Markern

**Was:** Bild mit frei platzierbaren Hotspots, die beim Klick Detail-Fotos / Text / Video / Link öffnen.

**Wo im Heft:** Heute auf dem Bike-Standbild — z. B. Hotspot über der Bremse → Detail-Foto der Magura MT7.

**Felder:**
- `baseImage`: image
- `hotspots`: array of object:
  - `x`: number (0–1)
  - `y`: number (0–1)
  - `label`?: localizedText (Kurz-Beschriftung am Marker)
  - `action`: `'detail_photo' | 'text_popup' | 'video' | 'external_link'`
  - **wenn action = detail_photo:** `targetImage`: image + `targetCaption`?: localizedText
  - **wenn action = text_popup:** `targetText`: localizedText
  - **wenn action = video:** `videoUrl`: url
  - **wenn action = external_link:** `linkUrl`: url

**UX im Editor:** Julian klickt im Sanity-Studio aufs Bild → Hotspot wird gesetzt → wählt Action-Typ → füllt Inhalt aus. Drag-and-Drop zum Verschieben.

**Hinweise:** Sanity bietet ein eingebautes Image-Hotspot-Plugin, das wir mit dem Action-Layer erweitern.

---

### 3.10 `verdictPanel` — Fazit + Tops/Flops als Foto-Overlay

**Was:** Der typische Test-Abschluss: Fazit-Text + Tops-Liste + Flops-Liste, gelegt als Overlay über ein großformatiges Foto. Eine eigenständige Komponente, nicht drei separate.

**Wo im Heft:** Jeder Bike-Test endet damit. Der Fazit-Text steht zusammen mit den beiden Bullet-Listen über einem Closing-Shot des Bikes (Action oder Studio). Im Nicolai-Test: Fazit „Mit dem S18 SWIFT stellt NICOLAI ein E-MTB auf die Räder …" + 5 Tops + 2 Flops über einem Foto.

**Felder:**
- `headline`?: localizedText (Default: „Fazit zum {Bike-Name}" — optional überschreibbar)
- `verdict`: localizedText (Fließtext, 3–6 Sätze)
- `tops`: array of localizedText (Bullet-Liste)
- `flops`: array of localizedText (Bullet-Liste)
- `backgroundImage`: image (das Closing-Shot-Foto)
- `overlayStyle`?: `'dark' | 'light' | 'gradient'` (Lesbarkeits-Voreinstellung je nach Foto-Helligkeit)
- `imagePosition`?: `'left' | 'right' | 'full'` (Layout-Variante)

**UX im Editor:** Eine zusammenhängende Komponente — Editor füllt Fazit-Text, Tops, Flops, lädt das Hintergrundfoto hoch. Stilrichtung per Dropdown.

**Hinweise:** Bewusst als kombinierte Komponente modelliert, weil es im Heft IMMER zusammen auftritt. Vermeidet, dass Editor versehentlich Tops/Flops ohne Fazit oder ohne Foto baut.
<!-- Tops und Flops sind zusammen mit dem Fazit immer als overlay über einem Foto -->

---

### 3.11 `tuningTip` — Tuning-Tipp

**Was:** Hervorgehobener Einzeiler-Tipp.

**Wo im Heft:** Nicolai: „Tuning-Tipp: Dropper mit mehr Hub verbauen".

**Felder:**
- `tip`: localizedText
- `icon`?: string (z. B. ein Schraubenschlüssel-Symbol)

---

### 3.12 `awardBox` — Auszeichnung im Vergleichstest

**Was:** „Best in Test", „Best Buy", „Editor's Choice" — die drei Auszeichnungen pro Vergleichstest.

**Wo im Heft:** Motoren-VT endet mit drei Award-Boxen (Avinox M1 = Best in Test, Bosch CX = Best Buy, maxon AIR S = Editor's Choice).

**Felder:**
- `awardType`: `'best_in_test' | 'best_buy' | 'editors_choice' | 'custom'`
- `customLabel`?: localizedText (wenn awardType = custom)
- `winnerImage`: image
- `winnerName`: string (z. B. „Avinox M1")
- `winnerReference`?: reference → motorModel | bike
- `verdict`: localizedText

---

### 3.13 `comparisonTable` — Spec-Tabelle für Vergleichstests

**Was:** Tabelle mit mehreren Produkten als Zeilen + Specs als Spalten.

**Wo im Heft:** Motoren-VT hat zwei: die Haupt-Spec-Tabelle (Drehmoment, Watt, Gewicht, Akku) und die Origin-Tabelle (Entwicklung, Assembly, Herkunft).

**Felder:**
- `title`?: localizedText
- `columns`: array of object:
  - `key`: string (z. B. „maxTorque_Nm")
  - `label`: localizedText (z. B. „Max. Drehmoment [Nm]")
  - `unit`?: string
- `rows`: array of object:
  - `subject`: reference → motorModel | manufacturer | bike
  - `values`: object (Key/Value-Map passend zu columns)
- `notes`?: localizedText (Erläuterungs-Fußnoten)

**UX im Editor:** Editor definiert die Spalten einmal pro Tabelle, dann eine Zeile pro Produkt mit Werten.

**Hinweise:** Zukunfts-Killer-Feature: Vergleichstabellen können sortierbar / filterbar in der PWA dargestellt werden — z. B. „Sortiere nach Gewicht" oder „Filtere alle Motoren > 100 Nm". In InDesign undenkbar.

---

### 3.14 `quoteDialog` — Dialog zwischen Personen

**Was:** Dialog-Sequenz mit Sprecher-Namen, wie ein kurzes Drehbuch.

**Wo im Heft:** Motoren-VT enthält den Tester-Dialog („Bene: Alright, straight up …", „Lars: If the mode's called Turbo …", „Peter: It did. In my back.").

**Felder:**
- `lines`: array of object:
  - `speaker`: reference → person
  - `text`: localizedText
- `style`?: `'casual' | 'formal'`

---

### 3.15 `testerCarousel` — Tester-Portraits

**Was:** Reihe von Tester-Portraits mit Mini-Bio.

**Wo im Heft:** Motoren-VT: 7 Tester mit jeweils Portrait-Foto und 2-3-Satz-Beschreibung.

**Felder:**
- `testers`: array of reference → person (Mini-Bio + Portrait kommen aus dem Person-Dokument)
- `layout`: `'horizontal_scroll' | 'grid' | 'sequential'`

**Hinweise:** Hier zahlt sich `person` als eigene Entität aus — der gleiche Tester (Bene, Lars, Peter) taucht in JEDEM Vergleichstest auf, mit gleicher Bio. Einmal pflegen.

---

### 3.16 `adSlot` — Werbeplatz

**Was:** Vorgesehene Stelle für eine Werbeanzeige.

**Wo im Heft:** Mehrfach pro Ausgabe.

**Felder:**
- `slotType`: `'display' | 'native' | 'interstitial' | 'sponsored_content'`
- `position`: `'between_articles' | 'inline' | 'fullpage'`
- `gamAdUnitId`?: string (Google Ad Manager Ad Unit ID)
- `fallbackContent`?: object (Eigen-Werbung, wenn GAM keinen Treffer hat)

**Hinweise:** Schema-mäßig nur ein Placeholder — die echte Auslieferung passiert via Google Ad Manager.

---

### 3.17 `ctaBlock` — Call-to-Action

**Was:** Hervorgehobener Block mit Link, z. B. „Mehr Infos unter nicolai-bicycles.com" am Ende eines Tests.

**Felder:**
- `headline`?: localizedText
- `buttonLabel`: localizedText
- `targetUrl`: url

---

## 4. Artikel-Typen

Top-Level-Dokumente, die der Editor anlegt. Jeder Artikel-Typ hat einen festen Header (gemeinsame Felder) und einen flexiblen `body` aus Komponenten.

### 4.1 Gemeinsames Header-Schema (`articleBase`)

Diese Felder hat JEDER Artikel-Typ:

- `magazine`: reference → magazine
- `issue`: reference → issue
- `pageNumberInIssue`?: number
- `category`: string (Test, Biketest, Produkttest, Vergleichstest, News, Bike-News, Produktnews, Know How, Inspiration, Special, Hausbesuch, Editorial)
- **Flags:**
  - `topstory`: boolean
  - `hideOnFrontpage`: boolean
  - `showInApp`: boolean (Default true)
- **Titel (zwei Versionen — bewusst getrennt):**
  - `title_mag`: localizedText (Heft/PWA-Titel, plakativ)
  - `title_web`: localizedText (SEO-Titel, länger)
- `slug`: string (Artikel-URL, z. B. `/nicolai-S18-swift-test`)
- **SEO:**
  - `metaDescription`: localizedText
  - `keywords`: array of localizedText
- **Social Media:**
  - `socialText`: localizedText
  - `socialHashtags`: array of string
- **Credits:**
  - `authors`: array of reference → person
  - `photographers`: array of reference → person
  - `editors`?: array of reference → person (Lektor)
  - `translators`?: array of reference → person (Übersetzer)
- **Workflow-Status:**
  - `status`: `'draft' | 'in_review' | 'final' | 'published'`
  - `crossingContent`?: text (Cross-Promo-Notizen, frei)
  - `publishingNotes`?: text (interne Notizen, z. B. „Spec-Tabelle Zeile 334")
- `availableLanguages`: array of `'de' | 'en'`
- **Body:**
  - `body`: array of components (siehe Sektion 3)

**Hinweise:** Diese Felder mappen 1:1 auf die Meta-Sektion eures Google-Doc-Templates. Wenn Julian/Tim heute „TITEL MAG", „Artikel-URL", „Meta", „Autor" usw. in ein Doc tippt, tippt er sie morgen in dieselben Felder in Sanity.

---

### 4.2 `articleSingleReview` — Einzeltest

**Was:** Test eines einzelnen Produkts (Bike, Komponente, Lifestyle-Produkt).

**Beispiel:** Nicolai S18 SWIFT.

**Zusätzliche Felder (über `articleBase` hinaus):**
- `subject`: reference → bike (oder `subjectFreeform`: string, wenn kein Bike)
- `subjectCategory`: `'bike' | 'motor' | 'component' | 'apparel' | 'lifestyle'`

**Typischer Body-Aufbau:**
1. `titlePage`
2. `articleHero` (Kategorie „TEST", Bike-Name, Lead)
3. `fullbleedPhoto` (Hero-Bild)
4. `specLine` (die Pipe-Spec)
5. `articleText` (Hintergrund: Hersteller-Geschichte, Konzept)
6. `photoGrid` (Detail-Bilder)
7. `articleText` (Ausstattung)
8. `hotspotImage` (Interaktive Bike-Ansicht)
9. `articleText` (Geometrie-Beschreibung)
10. `geometryOverlay` (Interaktive Geometrie)
11. `articleText` (Fahreindruck)
12. `fullbleedPhoto` (Action-Shot)
13. `tuningTip`
14. `articleText` („Für wen ist das …?")
15. `verdictPanel` (Fazit + Tops/Flops als Overlay über Closing-Shot)
16. `ctaBlock` (Hersteller-Link)

---

### 4.3 `articleGroupTest` — Vergleichstest

**Was:** Mehrere Produkte im direkten Vergleich.

**Beispiel:** „11 E-Bike-Motoren im großen Vergleichstest 2026".

**Zusätzliche Felder:**
- `subjects`: array of reference → motorModel | bike | manufacturer
- `subjectCategory`: `'bike' | 'motor' | 'component' | 'apparel' | 'lifestyle'`
- `awards`: array of awardBox-Komponenten (oder einzelne Felder, je nach Editor-UX-Wunsch)

**Typischer Body-Aufbau:**
1. `titlePage`
2. `articleHero` (Kategorie „VERGLEICHSTEST", Lead)
3. `fullbleedPhoto`
4. `articleText` (Methodik: Wie haben wir getestet?)
5. `comparisonTable` (Haupt-Spec-Tabelle aller Kandidaten)
6. `articleText` (pro Kandidat eine Mini-Vorstellung — kann auch als Komponente `productLineup` modelliert werden)
7. `testerCarousel` (Tester-Portraits)
8. `quoteDialog` (Tester-Dialog)
9. `articleText` (Test-Methodik im Detail)
10. `comparisonTable` (Origin-Tabelle, weitere Datentabellen)
11. Pro Kandidat ein `articleText`-Block + `photoGrid` mit Verdict
12. `awardBox` × 3 (Editor's Choice, Best Buy, Best in Test)
13. `articleText` (Fazit)

---

### 4.4 `articleEditorial` — Editorial

**Was:** Persönliche Einleitung des Heft-Gründers, meist am Anfang der Ausgabe.

**Beispiel:** „Run, Forrest, run!" von Robin Schmitt.

**Zusätzliche Felder:**
- `author`: reference → person (zwingend einer, z. B. Robin Schmitt)
- `signature`: localizedText (z. B. „Cheers, Robin Schmitt — Gründer E-MOUNTAINBIKE")

**Typischer Body-Aufbau:**
1. `titlePage` (oft sehr einfach: Title + Hintergrundfoto)
2. `articleText` (durchgehender Fließtext mit Pull-Quotes)
3. `fullbleedPhoto` / `photoGrid` (eingestreut)
4. Signatur am Ende

**Hinweise:** Editorial ist die freieste Form — wenig Struktur-Zwang.

---

### 4.5 `articleReportage` — Reportage / Travel-Feature

**Was:** Story-getriebener Artikel über ein Event, einen Ort, einen Hersteller-Besuch.

**Beispiel:** „Vom Bike-Punk zum Global Player — Zu Besuch bei Megamo".

**Zusätzliche Felder:**
- `location`?: string (z. B. „Girona, Spanien")
- `gpsCoordinates`?: object (für Reise-Karten, später)

**Typischer Body-Aufbau:**
- Wie Editorial, aber mit mehr `fullbleedPhoto` + `photoGrid`, oft mit Karten/Routen in Phase 2.

---

### 4.6 `articleThinkTank` — Think-Tank-Artikel

**Was:** Eigenes Format der 41-Publishing-Redaktion — strategische Branchen-Analyse.

**Beispiel:** „#02 The Eurobike Sabbatical — A Clear Answer for 2026".

**Zusätzliche Felder:**
- `thinkTankNumber`: number (z. B. 2)
- `thinkTankSeries`?: string (z. B. „Brixen Papers")

**Hinweise:** Eigene Komponente, weil die Think-Tank-Artikel optisch und strukturell ein eigenes Branding haben.

---

### 4.7 `articleCover` — Cover

**Was:** Die Titelseite der Ausgabe.

**Beispiel:** EMTB #042 Cover „Run, Forrest, Run!".

**Felder:**
- `magazine`: reference → magazine
- `issue`: reference → issue
- `issueTitle`: localizedText
- `coverImage`: image
- `coverPhotographer`?: reference → person
- `headlines`: array of localizedText (mehrere Teaser-Headlines fürs Cover)

---

### 4.8 `articleToc` — Inhaltsverzeichnis

**Was:** „Was ist drin?" — kategorisiert.

**Beispiel:** EMTB #042 Seite 005 mit Kategorien „Insider & Inspiration", „Vergleichstest", „Test & Know-How", „Regulars".

**Felder:**
- `categoryGroups`: array of object:
  - `categoryLabel`: localizedText
  - `entries`: array of reference → article (mit auto-generierter Seitenzahl-Anzeige + Thumbnail)

**Hinweise:** Sollte zu großem Teil automatisch aus der `issue.articles`-Liste generiert werden, damit Tim nicht doppelt pflegt.

---

### 4.9 `articleRegulars` — Regulars (Impressum, Newsletter, „What's next")

**Was:** Wiederkehrende Standard-Seiten am Heft-Ende.

**Felder:** vermutlich ein einfacher `articleText`-Body — wird mit Tim/Julian noch geschärft.

---

## 5. Anwendung auf die drei Pilot-Artikel

Hier wird konkret, wie eure Pilot-Artikel im Sanity-Studio aussehen.

### 5.1 Nicolai S18 SWIFT — `articleSingleReview`

**Dokument-Header:**
```
magazine:                    → E-MOUNTAINBIKE
issue:                       → E-MTB #042 „Run, Forrest, run!"
category:                    Test, Biketest
title_mag.de:                NICOLAI S18 SWIFT – Bombproof Backbone
title_mag.en:                NICOLAI S18 SWIFT – Bombproof Backbone
title_web.de:                Neues NICOLAI S18 SWIFT im ersten Test – Bombproof Backbone?
title_web.en:                NICOLAI S18 SWIFT First Test – Bombproof Backbone?
slug:                        /nicolai-S18-swift-test
metaDescription.de:          Das neue NICOLAI S18 SWIFT soll ein unverwüstliches E-Enduro …
keywords:                    [„Nicolai S18 Swift", „NICOLAI S18 SWIFT"]
authors:                     → Patrick Gruber, → Benedikt Schmidt
photographers:               → Lars Engmann
status:                      final
availableLanguages:          [de, en]
subject:                     → NICOLAI S18 SWIFT (bike)
subjectCategory:             bike
```

**Body:**
| # | Komponente | Inhalt |
|---|------------|--------|
| 1 | `titlePage` | SVG-Upload (von Julian) mit Hero-Foto Nicolai im Studio |
| 2 | `articleHero` | Lead: „Wenn die Abfahrt zählt – soll das NICOLAI S18 SWIFT die richtige Wahl sein …" |
| 3 | `fullbleedPhoto` | `NICOLAI-MAG-1062.jpg`, Effekt: parallax |
| 4 | `specLine` | NICOLAI S18 SWIFT \| Bosch PL CX / 600 Wh \| 180/180 mm \| 24,2 kg in M \| 10.999 € |
| 5 | `articleText` | „Zwei Schweißer, ein Kalle, eine Garage …" (Hersteller-Story) |
| 6 | `articleText` | H2 „Das NICOLAI S18 SWIFT 2025 im Detail" + Konzept |
| 7 | `fullbleedPhoto` | `NICOLAI-MAG-6040.jpg` |
| 8 | `articleText` | H2 „Die Ausstattung des NICOLAI S18 SWIFT 2025" + Spezifikation |
| 9 | `photoGrid` | 2er-Layout: Dämpfer + Gabel-Detail |
| 10 | `photoGrid` | 2er-Layout: Bremsen MT7 + Bremsen-Wahl |
| 11 | `hotspotImage` | Studio-Foto mit ~6 Hotspots (Bremse, Motor, Cockpit, Sattelstütze, Reifen, Display) |
| 12 | `articleText` | H2 „Die Geometrie des neuen NICOLAI S18 SWIFT 2025" |
| 13 | `geometryOverlay` | Interaktive Ansicht mit allen 5 Größen (S–XXL) |
| 14 | `articleText` | H2 „Das neue NICOLAI S18 SWIFT 2025 im Test" |
| 15 | `fullbleedPhoto` | Action-Shot (z. B. `NICOLAI-MAG-6071.jpg`), Effekt: kenBurns |
| 16 | `articleText` | Fahreindruck (bergauf, bergab) |
| 17 | `tuningTip` | „Dropper mit mehr Hub verbauen" |
| 18 | `articleText` | H2 „Für wen ist das neue NICOLAI S18 SWIFT 2025?" |
| 19 | `verdictPanel` | Fazit + 5 Tops + 2 Flops als Overlay über Closing-Shot |
| 20 | `ctaBlock` | „Mehr Infos unter nicolai-bicycles.com" |

**Aufwand für Tim, wenn der Inhalt schon im Doc liegt:** geschätzt 1–2 Stunden für Texte einpflegen + Bilder hochladen + Geometrie + Hotspots setzen. Heute mit InDesign deutlich mehr.

---

### 5.2 Motoren-Vergleichstest — `articleGroupTest`

**Dokument-Header:**
```
magazine:                    → E-MOUNTAINBIKE
issue:                       → E-MTB #042
category:                    Vergleichstest
title_mag.de:                Motor Madness: 11 e-MTB-Motoren im großen Vergleichstest
title_mag.en:                Motor madness: 11 exciting e-MTB motors in a head-to-head group test
title_web.en:                What's the Best E-Bike Motor of 2026? 11 E-Bike Motors in a Full-On Showdown.
slug:                        /e-bike-motoren-vergleich (übernimmt URL des letztjährigen Tests)
authors:                     → Robin Schmitt, → Benedikt Schmidt
photographers:               → Peter Walker, → Lars Engmann, → Robin Schmitt
status:                      final
subjects:                    → 11 motorModels (Bosch CX, Bosch CX-R, Bosch SX, maxon AIR S, Pinion MGU E1.12, Shimano EP801, S-Works 3.1, Avinox M1, Fazua Ride60, TQ HPR60, MAHLE M40)
```

**Body (Auszug — der Vergleichstest ist deutlich länger als der Einzeltest):**
| # | Komponente | Inhalt |
|---|------------|--------|
| 1 | `titlePage` | SVG-Upload |
| 2 | `articleHero` | Kategorie „VERGLEICHSTEST", Lead über 2026 als Wendepunkt |
| 3 | `fullbleedPhoto` | Motoren-Aufmacher |
| 4 | `articleText` | Intro: 11 Motoren, DEKRA-Labor, 7 Tage Test, … |
| 5 | `photoGrid` | 2er: Test-Crew in Action |
| 6 | `comparisonTable` | 11 Motoren × {Drehmoment, Watt, Akku, Gewicht} |
| 7 | `articleText` | „Unser Test-Feld im Detail" — pro Motor 2–3 Sätze |
| 8 | `testerCarousel` | 7 Tester (Bene, Lars, Peter, Robin, Erik, JP, Ingo) |
| 9 | `quoteDialog` | Dialog: „Bene: Alright, straight up …" |
| 10 | `articleText` | „Wie wir getestet haben" (Trail + Labor + Reichhöhe) |
| 11 | `comparisonTable` | Origin-Tabelle (Entwicklung / Assembly / Herkunft) |
| 12 | `articleText` | Hauptanalyse: „The hype is real", „Was wollen Rider wirklich?" |
| 13 | `photoGrid` | Diagramme (Effizienz, Lautstärke, Idle-Power) |
| 14 | Pro Motor (× 11): `articleText` + `fullbleedPhoto` | Verdict pro Motor |
| 15 | `awardBox` × 3 | Editor's Choice: maxon AIR S / Best Buy: Bosch CX / Best in Test: Avinox M1 |
| 16 | `articleText` | Conclusions — E-Bike-Motor-Test 2026 |

**Hinweise:** Hier zahlt sich `motorModel` als globale Entität massiv aus — alle 11 Motoren werden einmal als Doc angelegt, dann im Test referenziert. Die `comparisonTable` zieht ihre Daten automatisch aus den Motor-Docs (kein doppeltes Eintippen).

---

### 5.3 Editorial „Run, Forrest, run!" — `articleEditorial`

**Dokument-Header:**
```
magazine:                    → E-MOUNTAINBIKE
issue:                       → E-MTB #042
category:                    Editorial
title_mag.de:                Run, Forrest, run!
title_mag.en:                Run, Forrest, run!
authors:                     → Robin Schmitt
photographers:               (mehrere — aus den eingestreuten Bildern)
status:                      final
author:                      → Robin Schmitt
signature.de:                Cheers, Robin Schmitt — Gründer E-MOUNTAINBIKE
```

**Body:**
| # | Komponente | Inhalt |
|---|------------|--------|
| 1 | `titlePage` | Hintergrund-Foto + Titel-Typo |
| 2 | `articleText` | „Das Leben passiert einfach …" (Lead) |
| 3 | `fullbleedPhoto` | `JP_OTB_2.0_Crop_MAG-.jpg` (das berühmte JP-Frontflip-Cover-Foto) |
| 4 | `articleText` | Über JPs Frontflip |
| 5 | `photoGrid` | 3er: Alpe-Michael-Fotos |
| 6 | `articleText` | „In dieser Ausgabe tauchen wir …" |
| 7 | `photoGrid` | 2er: Motoren-VT-Teaser |
| 8 | `articleText` | Motoren-Test-Ankündigung |
| 9 | `photoGrid` | 4er: Think-Tank-Brixen |
| 10 | `articleText` | „Wir leben in einer Szene …" + Think-Tank-Story |
| 11 | `fullbleedPhoto` | Leserumfrage-Illustration |
| 12 | `articleText` | Über Markt-Veränderungen |
| 13 | `photoGrid` | 2er: Megamo-Factory-Visit |
| 14 | `articleText` | Über First-Mover + Newcomer |
| 15 | `photoGrid` | 2er: Alkoholfreier-Aperol-Teaser |
| 16 | `articleText` | DOWNTOWN-Cross-Promo + Schlussabsatz |
| 17 | Signatur | „Cheers, Robin Schmitt — Gründer E-MOUNTAINBIKE" |

**Hinweise:** Editorial ist der einfachste der drei Pilot-Artikel — keine Spec-Tabellen, keine Hotspots, kein Geometrie-Overlay. Eignet sich gut als „erster, schnellster Migrations-Test".

---

## 6. Workflow-Mapping: Google Doc → Sanity

So sieht der konkrete Pfad aus, wie ein Doc-Inhalt im neuen System landet.

### Heute (Status quo)

```
Google Doc  ─────┬───► InDesign (GZD) ──► Button Publish ──► Native App
                 │
                 └───► WordPress (manuell aufgebaut)
```

Doppelpflege: Doc → InDesign UND Doc → WordPress.

### Mit Sanity-PWA (MVP-Vision)

```
Google Doc  ─────► Sanity (MANUELL durch Redaktion) ─────► PWA

WordPress  ─────► bleibt unberührt, eigener Workflow wie heute
```

**Bewusste Entscheidungen zum Workflow:**

1. **Doc → Sanity bleibt manuell.** Auch wenn eine automatische Übernahme via Apps-Script technisch ginge: die manuelle Pflege ist gewollt. Gründe: Qualitäts-Kontrolle beim Einpflegen (Bilder zuordnen, Komponenten wählen), Tims Rolle als Mediengestalter bleibt erhalten, keine versteckten Fehler durch fehlerhafte Auto-Parser. Ein Apps-Script kann später als Hilfsmittel ergänzt werden (z. B. zum Vorbefüllen des Headers), aber nicht als Voraussetzung.

2. **WordPress bleibt komplett separat.** Die vier Magazin-Websites (enduro-mtb.com, ebike-mtb.com, granfondo-cycling.com, downtown-mag.com) sind mit über 12 Jahren an Artikeln gewachsen. Eine Rück-Migration nach Sanity ist nicht realistisch und auch nicht das Ziel.
<!-- Den Wordpress Blog würde ich aber erstmal unangetastet lassen, ich schätze das wäre auch ein enormer aufwand artikel von über 12 jahren ins neue system zu übertragen -->

3. **Forward-Sync Sanity → WordPress** wäre theoretisch möglich (neue Artikel aus Sanity automatisch als WP-Draft anlegen), bleibt aber **explizit außerhalb des PWA-MVP-Scopes**. Falls überhaupt, frühestens Phase 2 — und nur dann, wenn die heutige manuelle Doc-zu-WP-Pflege nachweislich Schmerzen verursacht. Aktuell läuft das mit eingespieltem Workflow gut, also: nicht anfassen.

**Wichtig — kein Architektur-Lock-in heute:** Die Option „später WordPress-Sync nachrüsten" entsteht NICHT durch heutige Vorarbeit, sondern automatisch dadurch, dass Sanity ein Headless-CMS ist. Sanity speichert Content als strukturierte Daten — jeder Downstream-Konsument (PWA jetzt, WordPress später, Newsletter, Mobile-App, …) kann auf dieselben Daten zugreifen, ohne dass das Schema angefasst werden muss. Eine spätere WP-Anbindung wäre ein Sync-Skript-Projekt (~1 Woche Senior-Dev-Arbeit) — kein Re-Architecting. Das einzige, was wir heute „auf Vorrat" mitnehmen, ist das optionale `title_web`-Feld. Diese Entscheidung kann also komplett verschoben werden, ohne dass es später teurer wird.

### Mapping Doc-Feld → Sanity-Feld

| Doc-Feld                  | Sanity-Feld                    |
|---------------------------|--------------------------------|
| Magazin-Name (Header)     | `magazine` (reference)          |
| TITEL MAG                 | `title_mag` (localizedText)     |
| TITEL WEB (SEO!)          | `title_web` (localizedText)     |
| Artikel-URL               | `slug`                          |
| Keyword deutsch/englisch  | `keywords`                      |
| Social Media              | `socialText`                    |
| Meta                      | `metaDescription`               |
| Crossing Content          | `crossingContent`               |
| Publishing-Hinweis        | `publishingNotes`               |
| AUTOR                     | `authors[]` (references)        |
| FOTOGRAF                  | `photographers[]` (references)  |
| LEKTOR                    | `editors[]` (references)        |
| ÜBERSETZER                | `translators[]` (references)    |
| STATUS                    | `status`                        |
| Body-Absätze + Headings   | `articleText` (Portable Text)   |
| Bild-Filename + Caption   | `fullbleedPhoto` / `photoGrid`  |
| Spec-Line („… \| … \| …") | `specLine` (strukturiert)       |
| Fazit + Tops & Flops      | `verdictPanel` (kombiniert)     |
| Tuning-Tipp               | `tuningTip`                     |
| Inline-Tabelle            | `comparisonTable`               |

### Migrations-Pfad für alte Hefte

1. **Manuell für Pilot:** Drei Artikel werden händisch nach Sanity übertragen (~1–3h pro Artikel) → Demo für Max & Robin.
2. **Halb-automatisch für Live-Heft:** Ein Apps-Script (Google Drive API) parst den Doc-Header und legt ein Sanity-Dokument an, Body wird halb-strukturiert importiert, Editor finalisiert.
3. **Volltext-Migration alter Hefte:** Optional, in Phase 2. Aufwand pro Heft realistisch 1–2 Manntage, sobald das Tooling steht.

---

## 7. Offene Entscheidungen (für nächste Gespräche)

Folgende Punkte sind im aktuellen Entwurf bewusst offen oder noch nicht final:

1. **Title-Page-Workflow:** SVG-Upload (Pilot) vs. Template-Library (Skalierung) — mit Julian zu klären.
2. **`bike` als eigener Doc-Typ?** Aktuell als Reference im SingleReview gedacht. Könnte sinnvoll sein, damit z. B. „alle Tests des Specialized Levo der letzten 3 Jahre" abfragbar werden. Diskussion mit Tim.
3. **Sanity-Plan-Stufe:** Free Tier reicht für Pilot. Für produktiven Betrieb (mehrere Editoren, mehr Assets, höhere Bandbreite) wird ein bezahlter Plan nötig — Kostenrechnung vor Budget-Termin mit Max & Robin.
4. **i18n-Mechanik:** Field-level (DE/EN nebeneinander pro Feld) vs. Document-level (zwei verlinkte Docs pro Sprache). Aktueller Vorschlag: Field-level — endgültige Entscheidung nach erstem Editor-Test mit Julian.
5. **WordPress-Sync:** Bewusst aus dem Scope herausgenommen (Tim's Entscheidung). Die WordPress-Sites bleiben unangetastet mit ihrem heutigen Doc→WP-Workflow. Ein optionaler Forward-Sync (Sanity → WordPress) wird frühestens Phase 2 diskutiert — und nur, wenn ein konkreter Pain Point auftaucht.
6. **Theming pro Magazin:** Wie weit sollen Farben/Typografie/Layout pro Magazin abweichen? Kleine Branding-Tokens (Akzentfarbe, Logo) oder grundverschiedene Looks? Frage an Julian.
7. **Hotspot-Editor in Sanity:** Standard-Plugin reicht für x/y-Position. Action-Layer (Detail-Foto / Text / Video) ist Custom-Input — sollte aber im Pilot bewiesen werden.
8. **Werbe-Integration:** GAM-Setup ist ein eigenes Sub-Projekt. Im Schema nur ein Placeholder, die echte Integration kommt vor Go-Live.

---

## 8. Was bewusst NICHT im MVP ist

Um den Scope kontrollierbar zu halten:

- ❌ **Automatischer Google-Doc-Import** — Tim bevorzugt manuelle Pflege; ein Auto-Import bleibt auch nach MVP optional und höchstens als unterstützendes Tool.
- ❌ **WordPress-Sync aus Sanity** — bewusst raus; WordPress läuft unverändert weiter.
- ❌ **Migration alter WordPress-Artikel nach Sanity** — über 12 Jahre Inhalte, kein realistisches Ziel.
- ❌ **Migration alter Hefte** — höchstens manuell für die Pilot-Demo.
- ❌ **Volltext-Suche über alle Hefte** — easy nachzurüsten (Sanity bietet Suche von Haus aus), aber nicht MVP-Fokus.
- ❌ **Push-Notifications für neue Ausgaben** — Web-Push ist möglich, aber UX-Frage für später.
- ❌ **Personalisierung / Empfehlungen** — nicht in der DNA der Magazin-PWA, eher in der Website-Welt zu Hause.
- ❌ **Reader-Login / Premium-Inhalte** — falls perspektivisch relevant, dann separat designen.
- ❌ **Multi-Tenant-Setup (vier Magazine parallel)** — Schema unterstützt es, aber Pilot läuft erst mal nur für E-MTB. Skalierung auf andere Magazine in Phase 2.
- ❌ **Theming pro Magazin** — Branding-Tokens (Farbe, Logo) ja, aber tiefgreifende Layout-Varianten nicht im MVP.

---

## 9. Nächste Schritte

1. **Dieses Dokument mit Tim final besprechen** — sitzt das so?
2. **Dokument als Diskussionsgrundlage Julian zeigen** — speziell Title-Page-Workflow und Theming klären.
3. **Kostenrechnung erstellen** — Sanity-Plan + Vercel + Domain + Senior-Dev-Stunden — für Max-&-Robin-Gespräch.
4. **POC-Sanity-Studio aufsetzen** — minimal: Schema implementieren, einen Pilot-Artikel (Editorial — am einfachsten) eingeben, Live-Preview zeigen.
5. **Pilot-PWA-Render** — ein simpler Next.js-Reader, der den einen Artikel aus Sanity liest und in der PWA-Optik anzeigt.
6. **Demo-Termin mit Max & Robin** — mit Story-Bogen: Problem (Button Publish, Zero-Daten, Doppelpflege) → Lösung (PWA, Sanity, ein Workflow) → Beweis (lauffähiger Pilot, Editorial-Artikel).

---

## 10. Anhang

### A. Sanity-spezifische Annahmen

- Sanity Studio v3 (aktuelle Version, TypeScript-basiert).
- Hosting des Studios auf `sanity.studio` oder selbst-gehostet.
- Image-Assets über Sanity's Asset-CDN mit automatischer Crop-/Resize-Transformation.
- `@sanity/document-internationalization` oder Custom-`localeString` für i18n.
- Live-Preview via Sanity Presentation (das ist eine der Haupt-Selling-Points gegenüber anderen CMS).

### B. Externe Abhängigkeiten

- **Google Drive API** — für späteren Doc-Import (Phase 2).
- **Google Ad Manager** — für Werbeauslieferung (vor Go-Live).
- **Vercel** — Hosting + Build-Pipeline (Standard-Setup).
- **WordPress** — bestehende Websites (vier Stück, eine pro Magazin) — bleiben dauerhaft unabhängig mit ihrem eigenen Workflow.

### C. Glossar

- **PWA** — Progressive Web App; installierbar wie native App, läuft aber im Browser, kein App-Store nötig.
- **CMS** — Content Management System; hier: Sanity.
- **Headless-CMS** — CMS ohne eigenes Frontend; liefert nur Daten per API.
- **Portable Text** — Sanity's strukturiertes Rich-Text-Format (Alternative zu HTML).
- **i18n** — Internationalization; mehrsprachige Inhalte.
- **MVP** — Minimum Viable Product; kleinste sinnvolle Lieferung.
