# Mess-Protokoll: Zeit pro Artikel (Studio-Workflow)

> **Zweck:** Die Pitch-Behauptung *„1–2 h pro Artikel statt InDesign-Tage"* belastbar machen.
> Der Skeptiker-Review (`skeptiker-review.md`, Kennzahl K3.2) hält fest: die bisherigen
> Pilot-Artikel wurden großteils **per Claude-Seed-Skript** gebaut → das misst *nicht* Tims
> Studio-Workflow. Diese Messung holt das ehrlich nach: **ein Artikel, von Hand, mit Stoppuhr, ohne Claude.**

---

## 0. Scope — was in die Schlagzeilen-Zahl zählt (FIX)

Vergleichsbasis ist der **InDesign-/GZD-Schritt von heute** (Apfel-mit-Apfel). Also:

**Uhr AUS (zählt NICHT):**
- Text schreiben (passiert im Google Doc — in beiden Welten gleich).
- Fotografieren / Bild-Export / Retusche aus der Quelle (passiert in beiden Welten gleich).
- → Voraussetzung vor Start: fertiger Doc-Text **und** die ausgewählten MAG-JPGs liegen bereit.

**Uhr AN — Schlagzeilen-Zahl (= „Doc + Fotos → publiziert"):** alles im Studio ab
„Text + Fotos liegen bereit" bis „Artikel steht fertig im Reader":
- Fotos in die Mediathek laden, taggen, Crop/Hotspot setzen.
- Artikel-Dokument anlegen, Meta pflegen (Titel, Slug, Magazin/Ausgabe-Ref, Rubrik, Sprache).
- Body bauen: titlePage, articleText, Fotos/Grids, pullQuotes — Text rüberkopieren + Bausteine ordnen.
- QA im Reader + publish.

**Separat gestoppt (NICHT in der Schlagzeile, aber protokollieren):**
- **S1 — Interaktiv-Bausteine** (Geometrie, Hotspots, interactiveBike): haben *kein* InDesign-Äquivalent
  → PWA-Mehrwert, ehrlich getrennt ausweisen, nicht in die Vergleichszahl mischen.
- **S2 — EN-Übersetzung** eingeben: heute auch Extra-Aufwand, separat zeigen (i18n-Argument).

---

## 1. Mess-Objekt

| Feld | Eintrag |
|---|---|
| Artikel (Titel) | **Ecoismus statt Extremismus** |
| Typ | Standard-Artikel (Text + Fotos, keine Interaktiv-Bausteine) |
| Ausgabe | E-MTB #042 |
| Anzahl Fotos | **17** (= Median eines echten Heft-Artikels, siehe Last-Test) |
| Anzahl Body-Bausteine (geschätzt) | ~ Standard (titlePage + Texte + Foto-Bausteine) |
| Interaktiv-Bausteine dabei? | nein |
| Mess-Datum | 25.06.2026 |

**Pre-Flight (vor Uhr-Start abhaken — sonst misst du Suchen, nicht Arbeiten):**
- [ ] Google-Doc-Text final & offen
- [ ] Alle MAG-JPGs exportiert & in einem Ordner griffbereit
- [ ] Studio läuft (`cd sanity-studio && npm run dev`), eingeloggt
- [ ] Reader läuft (`cd pwa-prototyp && npm run dev`) zum Gegenchecken
- [ ] Stoppuhr / Timer bereit, Handy stumm, keine Unterbrechungen eingeplant

---

## 2. Zeit-Protokoll

> Methode: Eine Phase = ein zusammenhängender Block. Bei Pause: Uhr anhalten **und** in „Unterbrechungen"
> notieren (Ehrlichkeit schlägt eine zu glatte Zahl — der Skeptiker fragt sonst „mit oder ohne Kaffeepause?").

### Schlagzeilen-Zahl (Doc + Fotos → publiziert)

Tim hat als Gesamtzeit gestoppt (nicht in P1–P4 zerlegt — erste Runde):

| Phase | Was | Netto-Min |
|---|---|---|
| P1–P4 gesamt | Fotos (17) einpflegen + Text 1:1 aus InDesign kopieren + Bausteine bauen + QA | **~30** |
| | **Summe Schlagzeile (DE, einsprachig)** | **~30 min** |

### Separat (PWA-Mehrwert / i18n — nicht in der Vergleichszahl)

| Phase | Was | Netto-Min |
|---|---|---|
| S1 | Interaktiv-Bausteine (Geometrie/Hotspots) | — (keine im Artikel) |
| S2 | EN parallel mitpflegen | **~+15** (Tim-Schätzung, nicht gestoppt) → bilingual ~45 min |

**Unterbrechungen (Uhr war aus):** keine nennenswerten.

---

## 3. Auswertung

| Kennzahl | Wert |
|---|---|
| **Schlagzeile: Minuten / Artikel (DE, Doc+Fotos → publiziert)** | **~30 min** |
| Bilingual (DE + EN parallel) | **~45 min** (30 + ~15 geschätzt) |
| Fotos im Artikel | 17 (Heft-Median) |
| Interaktiv-Bausteine | keine |

**Hochrechnung auf eine ganze Ausgabe** (Einordnung, klar als Schätzung):
~24 Artikel/Ausgabe × ~30 min = **~12 h** reine Studio-Zeit einsprachig · bilingual ~24 × 45 min = **~18 h**
(ohne Anzeigen, ohne Interaktiv-Specials — die fallen nur bei 1–2 Premium-Artikeln an).

---

## 3a. WICHTIGE Einordnung der Zahl (Ehrlichkeit für den Pitch)

- **Was die 30 min messen:** einen Artikel, dessen **Layout, Text und Bildauswahl im InDesign bereits fertig waren**, per **1:1-Copy** in Sanity-Bausteine zu übertragen + die 17 Fotos zu platzieren + QA. Das ist die **Migrations-/Übertragungs-Zeit**, nicht „von der leeren Seite gestaltet".
- **Damit belegt:** Ein fertig layouteter Heft-Artikel ist in **~30 min** in der PWA — sauber, strukturiert, sofort live. Für die These „GZD/Print → PWA spiegeln" ist das ein **starker, harter Wert**.
- **Was sie NICHT belegt:** die Zeit für den **gestalterischen/redaktionellen Erstentwurf** (Bildauswahl, Crops, Reihenfolge, Captions) — die steckte hier schon im InDesign. Im Zielbild „InDesign überspringen, direkt in Sanity" wandert dieser Denk-Anteil in die Sanity-Zeit und **erhöht sie etwas** (wie viel: ungemessen).
- **Trotzdem fair stark:** Die Sanity-Bausteine *sind* das Layout-System — Bausteine bauen = layouten. Die 30 min enthalten echtes Foto-Platzieren + Strukturieren, nicht nur stures Tippen.
- **Pitch-Framing:** „Erste, ungeübte Runde: ein fertiger Heft-Artikel ist in ~30 min (einsprachig) bzw. ~45 min (DE+EN) in die PWA übertragen — Routine schneller. Der reine Gestaltungs-Erstentwurf ist hier nicht enthalten, der passiert heute wie morgen vorher." Ehrlich + überzeugend zugleich.

---

## 4. Verteidigungs-Notizen (gegen den Skeptiker)

- Diese Zahl ist **von Hand gemessen, ohne Claude-Seed** — anders als die bisherigen Pilot-Artikel.
- Scope ist **bewusst der InDesign-vergleichbare Schritt**; Schreiben & Fotografie sind raus (gleich in beiden Welten).
- **Erste manuelle Runde = Lernkurve.** Realistischer Dauerbetrieb ist eher schneller (Routine, Copy-Paste-Patterns).
  Ehrlich so framen: „erste ungeübte Runde, Routine-Wert liegt darunter" — nicht andersrum schönen.
- Interaktiv-Bausteine bewusst getrennt → die Vergleichszahl wird *nicht* durch PWA-Sonderfeatures aufgebläht.
- Gegen die heutige Referenz stellen: **„InDesign-Tage"** ist Tims Erfahrungswert — wenn möglich eine echte GZD-Stunden-/Durchlaufzeit dazu erfragen, dann ist der Vorher-Nachher-Vergleich beidseitig belegt statt nur einseitig gemessen.
