# Externer Review & revidierte Entscheidungen

> **Stand:** Mai 2026 · nach Gegencheck durch zwei externe KIs (Gemini Thinking, ChatGPT/Codex 5.5)
> **Zweck:** Festhalten, was der externe Stresstest des Plans ergeben hat und welche Entscheidungen daraufhin angepasst wurden. Rohantworten siehe `ki-prüfung.md`.
> **Kernbotschaft:** Der Plan ist strategisch bestätigt, aber der operative Produktions-Teil war zu optimistisch. Drei Dinge ändern sich: iOS/Offline ehrlich angehen, Senior-Dev früher, vor Finalisierung messen statt annehmen.

---

## 1. Was beide KIs unabhängig kritisiert haben (= ernst genommen)

| # | Kritikpunkt | Bewertung |
|---|---|---|
| 1 | **iOS-PWA-Schwächen**: iOS löscht Service-Worker-Cache nach ~7 Tagen Inaktivität → „offline" bei quartalsweisem Magazin auf iPhones faktisch tot. Install umständlich (manuell, kein Prompt). | Berechtigt — war blinder Fleck |
| 2 | **Senior-Dev zu spät**: „punktuell am Ende" prüft nur eine schon verfestigte Architektur. | Berechtigt — war zu optimistisch |
| 3 | **Vercel-Kosten übersehen**: `next/image` Image-Optimization (5.000 Quellbilder/Monat im Pro-Plan), Bandwidth, Function-Aufrufe. Cloudflare cached nur über eigene proxied Domain, nicht automatisch `cdn.sanity.io`. | Berechtigt — Kostenanalyse war unvollständig |
| 4 | **Pilot über-engineered**: 17 Komponenten + beide Wow-Features zu viel; Pilot als Schönwetter-Demo statt Risiko-Test definiert. | Berechtigt |
| 5 | **GAM/Werbung** kollidiert mit SSR/Core Web Vitals — früh testen. | Berechtigt |
| 6 | **Julian zu spät** eingebunden → Risiko gestalterischer Ablehnung. | Berechtigt |
| 7 | **Editor-UX**: Designer empfinden Sanity oft als trocken (Storyblok als Alternative). | Abzuwägen — Sanity hat „Presentation"-Live-Preview; mit Julian testen |
| 8 | **Manueller Doc→Sanity** bei großen Vergleichstabellen fehleranfällig/zäh. | Teilweise berechtigt — Tims manuelle Präferenz bleibt, aber Halb-Automat-Assist für große Tabellen prüfen |

**Relativiert:** Gemini's „70% iOS-Leser" (erfundene Zahl, Problem aber echt); „KI-Spaghetti-Monolith" (überzeichnet, Kern via „Dev früh" adressiert); „Ihr verkauft eine Illusion" (hart, Kern = Risiko-Pilot, übernommen).

---

## 2. Revidierte Entscheidungen (von Tim bestätigt)

### A) Auslieferung: PWA bauen, Offline auf echtem iPhone testen, Capacitor-Entscheidung vertagen
- Pilot wird als **reine PWA** gebaut.
- **Offline wird auf einem echten iPhone getestet** — keine Annahmen.
- Wenn iOS-Cache-Eviction sich als K.O. erweist: **Capacitor** (dünner nativer Wrapper um die Web-App) als Plan B — behält App-Store-Präsenz + bestehende Nutzer + EINE Codebase. Entscheidung fällt mit echten Testdaten, nicht vorab.

### B) Senior-Dev: früh als Leitplanke statt nur punktuell
- **1–2 Tage Architektur-Setup VOR dem Bauen** (Stack-Validierung, Projektstruktur, Caching-/Image-Strategie, Konventionen).
- **Kurze regelmäßige Reviews während** des Bauens (statt nur ein Pre-Launch-Review am Ende).
- Ändert nicht, dass Tim selbst baut — aber die Leitplanken kommen vorne hin. Kostet etwas mehr Dev-Budget jetzt, ist die richtige Versicherung.

### C) Pilot = Risiko-Pilot, nicht Schönwetter-Demo
- **Schlank:** ~6–10 Core-Komponenten statt 17. **EIN** interaktives Wow-Feature als Spike (nicht Geometrie UND Hotspots UND kompletter Vergleichstest).
- **Muss echte Fragen messen** (siehe Abschnitt 3).
- Ist die *bessere* Grundlage für Max & Robin: ehrliche Zahlen schaffen mehr Vertrauen als Hochglanz.

### D) „Sanity für Produktion" gelockert
- „Sanity für den Pilot" bleibt fest.
- „Sanity für die Produktion" wird zurückgestuft auf **Default-Kandidat, bestätigt NACH dem Risiko-Pilot** — abhängig von (a) Image-Delivery-Messung und (b) Editor-UX-Test mit Julian.

---

## 3. Der Risiko-Pilot muss diese Fragen beantworten (messen, nicht annehmen)

1. **Traffic-Kosten real:** Image-Delivery-Spike mit echten Bildern, echten Größen, Cloudflare-Prototyp — und Vercels eigene Meter (Image-Optimization, Bandwidth, Functions) mitrechnen. Eigener Image-Loader (Sanity/Cloudflare) statt Vercels.
2. **Zeit pro Artikel:** Wie lange braucht Tim wirklich, einen Artikel in Sanity einzupflegen? (Editorial vs. Vergleichstest separat messen.)
3. **Offline auf iOS/Android:** Eine Ausgabe speichern, Flugmodus, nach Tagen erneut öffnen — funktioniert es wirklich?
4. **Werbung:** GAM/Ad-Slot als echter Spike — Layout-Shifts, Core Web Vitals, Consent.
5. **Visuelles Niveau:** Findet Julian (und finden die Gründer) das Ergebnis gestalterisch akzeptabel?
6. **Workflow:** Ist der neue Weg schneller — oder nur anders mühsam?
7. **Architektur-Abnahme:** Kann der Senior-Dev die Architektur guten Gewissens abnehmen?

---

## 4. Technische Spikes, die früh laufen müssen

- **Image-Delivery-Spike** (eigene Asset-Domain / Image-Proxy / Cloudflare Images vs. Vercel `next/image`) — messen, bevor CMS-/Hosting-Kosten finalisiert werden.
- **Offline-/Service-Worker-Spike** auf echtem iOS-Gerät.
- **GAM-Spike** (eine Werbefläche real einbauen + Core Web Vitals messen).
- **Halb-Automat-Import-Spike** für große Spec-Tabellen (Doc/Sheet → Sanity), als Assistenz für Tims manuellen Workflow.

---

## 5. Was unverändert bleibt

- Grundrichtung PWA + strukturierte Daten + Headless-CMS — von beiden KIs bestätigt.
- Sanity als Pilot-CMS.
- Managed-Stack-Prinzip (kein selbst gehosteter Server).
- DE/EN, manueller Content-Workflow als Tims Default, WordPress unangetastet.
- Komponenten-basiertes Schema als Ziel-Architektur (nur der Pilot-Umfang wird reduziert).
- Julian + Max/Robin als Stakeholder; Pilot als Budget-Entscheidungsgrundlage.
