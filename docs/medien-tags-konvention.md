# Medien-Tags — Konvention für die Bildverwaltung

Sanity hat **bewusst keine Ordner** für hochgeladene Bilder: Der Asset-Speicher ist flach
und **dedupliziert** (dasselbe Bild in zwei Artikeln = physisch nur ein Asset). Ein Bild
„gehört" technisch keinem Artikel, es wird *referenziert* und kann mehrfach genutzt werden.

Ordnung schaffen wir deshalb über **Tags** (im Media-Plugin, Tab „Media"). Ein Bild kann
mehrere Tags haben.

## Tag-Schema

```
<ausgabe>-<artikel>
```

Beispiele: `042-nicolai`, `042-motoren-vt`, `043-editorial`

- **`<ausgabe>`** = Heft-Nummer ohne Magazin-Präfix, dreistellig (`042`, `043`).
  Bei mehreren Magazinen kann das Magazin-Kürzel davor: `emtb-042`, `enduro-018`.
- **`<artikel>`** = kurzer, sprechender Slug des Artikels (kleingeschrieben, mit Bindestrich).

## Warum so

Ein Token deckt **beide** Suchbedürfnisse ab:

- **Beim Bauen eines Artikels** (der eigentliche Use-Case): Bilder fürs Set taggen, dann im
  Bild-Picker („Select" auf einem Bildfeld) nach `042-nicolai` filtern → man sieht nur die
  Bilder dieses Artikels, nicht die ganze Mediathek.
- **Ganze Ausgabe wiederfinden**: nach dem Präfix `042` filtern.

## Workflow

1. In **„Media"** die Bilder fürs Set markieren → Tag `042-nicolai` vergeben.
2. Beim Einpflegen im Artikel: Bildfeld → **„Select"** → Media-Browser → nach dem Tag filtern.

## Granularität

Pro **Artikel** taggen reicht — nicht pro einzelnem Baustein. Ein Bild, das in zwei Artikeln
landet, bekommt einfach beide Tags. Globale Volltextsuche (Lupe oben) deckt Sonderfälle ab,
dafür braucht es keine eigenen Tags.
