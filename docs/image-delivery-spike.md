# Image-Delivery-Spike — Bild-Bandbreite & Auslieferungs-Kosten

> **Stand:** 17.06.2026 · Mess-Sprint Punkt 2 (`skeptiker-review.md` §6)
> **Zweck:** Die im Skeptiker-Review benannte „~$600/Ausgabe-Falle" (§3.3) entschärfen — der Pilot
> lieferte Bilder bisher direkt über `cdn.sanity.io` in fester Desktop-Auflösung aus. Das widersprach
> der eigenen Kosten-Architektur (CDN-Layer + bewusste Bild-Auslieferung).
> **Ergebnis:** Code-Teil gebaut & gemessen. Cloudflare-DNS-Teil = Tim-Hausaufgabe (Anleitung unten).

---

## 0. Kurzfassung

Zwei unabhängige Hebel gegen die Bild-Bandbreite:

| Hebel | Was | Status | Wirkung |
|---|---|---|---|
| **A — `srcset`/`sizes`** | Browser lädt die zum Gerät passende Auflösung statt überall 2000–2560 px | ✅ **gebaut & im echten Browser gemessen** | Phone lädt **34–51 % weniger** Bild-MB |
| **B — eigener Bild-Host** | Bilder laufen über `images.41publishing.com`, Cloudflare davor cached sie | ✅ **im Code vorbereitet** (1 env-Variable), ⏳ **DNS = Tim** | Sanity-Origin-Last → ~0 (löst die Overage-Falle) |

Die zwei Hebel adressieren **verschiedene Kosten**: Hebel A senkt die MB **pro Leser** (gut für mobile
Nutzer + Offline-Cache), Hebel B senkt die MB, die **Sanity berechnet** (Origin-Bandbreite). Erst beide
zusammen lösen das Kostenproblem vollständig.

---

## 1. Was gebaut wurde (Code)

Zentraler Helper **`pwa-prototyp/lib/image.ts`** — ersetzt die bisher in jeder Komponente einzeln
gebaute Bild-URL:

- **`imgSet(src, sizes, maxWidth?)`** → liefert `{src, srcSet, sizes}` zum direkten Spreaden aufs `<img>`.
  srcset-Leiter: `480, 640, 768, 1080, 1440, 1920, 2560`. Sanity rendert jede Breite on-the-fly.
- **`imgSetCrop(src, w, h, sizes)`** → dasselbe für Bilder mit festem Zuschnitt (Kiosk-Thumbs, Cover).
- **`imgUrl(src, w)`** → Einzel-URL für kleine Bilder (Logos, Siegel) — ohne srcset, aber **mit Host-Swap**.
- **`withImageHost(url)`** → tauscht `cdn.sanity.io` gegen `NEXT_PUBLIC_IMAGE_HOST` (Hebel B).

**Umgestellt:** alle bandbreiten-relevanten Bilder in `ArticleView` (Full-bleed, Cover-Hero,
Titelseiten, Award-Foto, Verdict, Foto-Raster), `AdView` (Vollbild-Anzeigen), den Bike-Bausteinen
(`HotspotImage`, `GeometryOverlay`, `InteractiveBike`), `TesterCarousel`, `Kiosk` (Cover + TOC-Thumbs)
und den Magazin-Regal-Seiten. Jede Bild-URL läuft jetzt durch den Host-Swap → Cloudflare cached
später **alle** Bilder, nicht nur die großen.

**OfflineSaver angepasst:** Mit srcset hätte der Offline-Save sonst pro Bild alle ~7 Auflösungsstufen
gezogen. Er cached jetzt pro Bild **genau eine** Auflösung (die ~1200px-`src`-Fallbackgröße) →
Offline-Cache bleibt schlank.

---

## 2. Mess-Ergebnisse

### 2.1 Pro-Bild: Auslieferungsgröße über die Breiten-Stufen

Echtes 6000×4000-Foto aus dem Pilot-Dataset, WebP (`auto=format`), gemessen per `curl`:

| Breite | WebP | | Breite | WebP |
|---|---|---|---|---|
| 768 px | 67 KB | | 1440 px | 203 KB |
| 1080 px | 113 KB | | 2000 px | 304 KB |
| 1200 px | 152 KB | | 2560 px | 557 KB |

→ Ein Full-bleed-Foto, das bisher fest mit **2200 px (~400 KB)** geladen wurde, holt sich ein Phone
jetzt als **1080–1440 px (113–203 KB)** = **−50 bis −72 % pro Bild**.

### 2.2 Ganze Ausgabe: real im Browser gemessen

Chrome headless, echte Device-Emulation, Skript: `pwa-prototyp/scripts/measure-images.mjs`
(lädt die komplette Pilot-Ausgabe = 54 Bilder, liest die vom echten srcset-Resolver gewählten
Auflösungen, summiert die echten Bytes):

| Szenario | Bild-Traffic | Ersparnis |
|---|---|---|
| **Volle Auflösung** (= Zustand ohne srcset, alle Geräte laden Desktop-Größe) | **~8,5 MB** | — |
| **iPhone High-End** (DPR 3 → wählt 1440 px) | **5,7 MB** | **−34 %** |
| **iPhone Standard** (DPR 2 → wählt 1080 px) | **4,2 MB** | **−51 %** |

**Hochrechnung auf eine echte ~40-Artikel-Ausgabe** (≈7× Pilot): grob **~30–40 MB mobil statt ~60 MB**
volle Auflösung. Die exakte Zahl misst Tim am ersten echten Heft — aber die Richtung ist belastbar.

> **Reproduzieren:** `npm run build && npx next start -p 3001`, dann in einem zweiten Terminal
> `node scripts/measure-images.mjs`.

---

## 3. Hebel B aktivieren — Cloudflare-Anleitung (PRODUKTIONS-Thema, NICHT Pilot)

> **Wann ist das relevant?** **Nicht für den Piloten.** Der Pilot hat kaum Traffic — die Sanity-Free-
> Bandbreite (100 GB/Monat) wird nie gerissen. Hebel B löst ein **Produktions**-Kostenproblem (die
> ~$600/Ausgabe-Falle entsteht erst bei 21–35k echten Lesern). Für den Pilot-Betrieb zählt allein
> Hebel A (srcset, schon aktiv). **Diese Anleitung gehört in den Senior-Dev-/Go-Live-Schritt** — sie
> liegt nur schon bereit, damit sie dann nicht neu erarbeitet werden muss, und damit der Pitch zeigen
> kann: „die Kosten-Architektur ist gelöst, hier ist der konkrete Plan". **Gängige Praxis?** Ja — ein
> CDN vor die Bild-Auslieferung zu setzen ist Standard bei jeder content-lastigen Seite.

Ziel: Bilder laufen über **`images.41publishing.com`** statt `cdn.sanity.io`. Cloudflare cached jedes
Bild nach dem ersten Abruf und liefert es selbst aus → Sanity sieht fast keinen Leser-Traffic mehr.
Der Code ist fertig; es fehlt nur das DNS-/Cloudflare-Setup.

**Voraussetzung:** Eine Domain bei Cloudflare. **Wichtig — es muss NICHT die ganze `41publishing.com`
zu Cloudflare umziehen:** Es reicht, EINE Subdomain (`images.41publishing.com`) per NS-Eintrag beim
aktuellen DNS-Anbieter an Cloudflare zu delegieren. Die Haupt-Domain + Mail + Website bleiben unberührt.
(Alternativ ginge auch ein anderer CDN/Proxy — Cloudflare ist nur die im Projekt beschlossene, kostenlose Wahl.)

**Schritt 1 — Cloudflare Worker anlegen** (Dashboard → Workers & Pages → Create Worker). Code:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    url.hostname = 'cdn.sanity.io' // Anfrage an Sanity weiterreichen (Pfad bleibt identisch)
    return fetch(new Request(url, request), {
      cf: {cacheEverything: true, cacheTtlByStatus: {'200-299': 31536000}}, // 1 Jahr cachen
    })
  },
}
```

**Schritt 2 — Custom Domain binden:** Worker → Settings → Domains & Routes → Add `images.41publishing.com`.
(Cloudflare legt den DNS-Eintrag automatisch an.)

**Schritt 3 — Sanity-CORS** für den neuen Host freigeben (sonst scheitern die CORS-Bild-Fetches des
OfflineSavers):
```
cd sanity-studio && npx sanity cors add https://images.41publishing.com --no-credentials
```

**Schritt 4 — env-Variable setzen** (Vercel → Project → Settings → Environment Variables, und lokal in
`pwa-prototyp/.env.local`):
```
NEXT_PUBLIC_IMAGE_HOST=images.41publishing.com
```

**Schritt 5 — Service Worker & OfflineSaver mitziehen:** Beide filtern aktuell hart auf `cdn.sanity.io`
(`public/sw.js` Bild-Regeln, `components/OfflineSaver.tsx` Zeile ~150/160). Sobald der Host aktiv ist,
dort `images.41publishing.com` ergänzen — sonst werden die Bilder offline nicht gecacht. **(Bewusst
nicht vorab geändert, damit der laufende iOS-Offline-Test nicht angefasst wird.)**

**Schritt 6 — Cache-Hit-Rate messen:** Cloudflare-Dashboard → Analytics → die `cf-cache-status: HIT`-Quote
+ die an Sanity durchgereichte Origin-Last beobachten. **Das ist die zweite harte Pitch-Zahl** (neben der
MB-pro-Leser oben): „X % der Bild-Auslieferung kommt aus dem CDN, Sanity-Origin-Last ≈ Y GB/Ausgabe".

---

## 4. Was der Spike NICHT beweist (Ehrlichkeit fürs Pitch-Deck)

- **Cache-Hit-Rate ist noch nicht real gemessen** — erst nach dem Cloudflare-Setup (Schritt 6). Die
  Origin-Last-Reduktion ist im `cms-entscheidung.md` §5 durchgerechnet, aber im Pilot noch nicht belegt.
- Die ganze-Ausgabe-MB-Zahl ist auf der **6-Panel-Pilot-Ausgabe** gemessen + hochgerechnet, nicht an
  einem echten 40-Artikel-Heft.
- srcset deckt die **angezeigten** Bilder ab; klick-nachgeladene Detail-Popups (Hotspots) sind
  unverändert (bewusst, kleine Bilder).

---

## 5. Last-Test an einer echten Ausgabe (17.06.) — Nachtrag

Um nicht aus 6 Panels hochzurechnen, eine **reale Ausgaben-Größe nachgebaut**: `issue-lasttest`,
33 Panels (24 Artikel + 9 Anzeigen) mit **431 echten Magazin-Fotos** (4000 px, aus
`pilot-content/loadtest-bilder/`) in Tims durchgezählter Bildverteilung. Skripte:
`pwa-prototyp/scripts/loadtest-{seed,cleanup,measure}`.

**Echte Bildzahl korrigiert die Kostengrundlage:** Tim hat eine reale Ausgabe durchgezählt →
**474 Bilder**, nicht die in `cms-entscheidung.md §5` geschätzten ~200 (**2,4× zu niedrig**).
Die Bild-Bandbreite/Kosten sind also höher als gerechnet — srcset + CDN sind damit Pflicht.

**Zwei Befunde:**
1. **DOM-Skalierung:** 414 img-Tags, 8.023 DOM-Knoten, **1,34 MB HTML** (vs. 0,22 MB bei 6 Panels) —
   das Carousel lädt *alle* Panels in einen State. Lighthouse (Kiosk) trotzdem **94/100** (TBT 10 ms).
2. **iOS-Memory-Crash (der harte Befund):** Die volle Ausgabe **stürzt auf dem iPhone ab**
   („… ist wiederholt ein Problem aufgetreten"). Alle 431 Bilder hängen gleichzeitig im DOM →
   alle dekodiert im RAM (dekodiert ≈ Pixel×4, ~3 MB/Bild selbst als kleine srcset-Stufe → >1 GB)
   → iOS-Tab-Limit (~1–1,5 GB) gesprengt. **M4-MacBook läuft flüssig** (genug RAM) → kein Speed-
   oder Code-Problem, reines iOS-Speicher-Limit.

**Konsequenz:** **srcset löst die Bandbreite, NICHT den Speicher.** Für Produktions-Ausgaben muss
das `ArticleCarousel` **virtualisieren** (nur aktives ± Nachbar-Panel mounten, Rest leerer
Platzhalter gleicher Größe). → **nächster Bau-Schritt (eigene Session): Carousel-Lazy-Mount**,
danach Gegentest gegen `issue-lasttest` am iPhone.

> Die absolute MB-Zahl ließ sich headless nicht sauber messen (Sanity rendert die srcset-Stufen
> der 4000-px-Originale on-the-fly → Massen-Fetch läuft ins Transform-Limit). Belastbar bleibt die
> **Ersparnis-Quote** (Verhältnis) aus §2 + Tims **iPhone-Gefühl** (am Mac flüssig, am iPhone
> Memory-Crash). Echte Cache-Hit-/Origin-Zahlen kommen mit dem Cloudflare-Setup (§3).
```
