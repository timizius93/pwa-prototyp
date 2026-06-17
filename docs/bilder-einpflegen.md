# Bilder in Sanity einpflegen — Workflow

## Primärweg: Drag & Drop direkt aufs Bildfeld

Beim Bauen eines Artikels zieht man die Fotos **direkt aus dem Finder auf das Bildfeld**
(„Drag or paste image here"). Ein Drag = hochgeladen **und** im Baustein platziert, in einem
Schritt. Kein Umweg über die globale Mediathek, kein „Select"-Dialog, keine Tag-Filterung.

### Voraussetzung: Google Drive for Desktop

Browser-zu-Browser-Drag (Drive-**Web**-Oberfläche → Sanity) funktioniert **nicht**. Man braucht
das Foto als echte lokale Datei. Dafür **Google Drive for Desktop** installieren — das mountet
Drive im Finder, und man zieht direkt aus dem Ausgaben-Ordner ins Studio.

> ⚠️ Onboarding-Hinweis: Viele im Team nutzen bisher nur die Drive-Web-Oberfläche. Für den
> Bild-Workflow ist „Google Drive for Desktop" (Finder-Integration) Pflicht. Ohne sie bleibt
> nur der umständliche Weg „aus dem Web herunterladen → wieder hochladen".

Alternative ohne Drag: Button **„Upload"** am Bildfeld → Datei-Picker → in den im Finder
gemounteten Drive-Ordner navigieren → Foto wählen.

## Warum NICHT über Mediathek + Per-Artikel-Tags

Der naheliegende, aber falsche Weg: erst alle Bilder in die globale Mediathek laden, dann pro
Artikel taggen und beim Einpflegen nach Tag filtern. Das **skaliert nicht**:

> 4 Magazine × ~10 Ausgaben/Jahr × ~24 Artikel = **~960 Tags pro Jahr** → unbenutzbare Tag-Liste.

Man würde ein Ordner-Problem durch ein Tag-Problem ersetzen. Die lokale Ordnerstruktur auf der
Platte (Drive) ist die bessere „Ablage" — Sanity ist für die *Referenzierung*, nicht fürs
Archivieren.

## Tags: nur grob, optional

Tags lohnen sich nur für **wenige, stabile Eimer** zum Wiederverwenden — nicht pro Artikel:

- pro **Magazin**: `emtb`, `enduro`, `granfondo`, `downtown`
- pro **Typ**: `tester-portrait`, `award-siegel`, `logo`

Die Frage „welche Bilder gehören zu Artikel X" beantwortet sich ohnehin, indem man den Artikel
öffnet — die Bilder sind dort referenziert. Sanity **dedupliziert** automatisch (dasselbe Bild
zweimal hochgeladen = ein Asset).

## Skalierung später (Produktions-/Roadmap-Thema, nicht Pilot)

Wenn die Bildorganisation über 4 Magazine wirklich wächst:

- **Sanity Media Library** (neueres Sanity-Produkt): echte Ordner/Collections, organisations-weit
  projektübergreifend, reichere Metadaten/Suche. Naheliegender Upgrade-Pfad, bleibt im
  Sanity-Ökosystem. GA-Status & Preis vor Entscheidung verifizieren.
- **Externes DAM** (Cloudinary, Bynder, Frontify, …): eigenständiges Medien-System mit
  Rechte-/Lizenz-Management, Versionierung, Brand-Portalen. Schwere Artillerie — nur bei
  zentralem Verlagsarchiv mit Rechte-Management sinnvoll. Eigene Kosten + Integration + Ops.

Für Pilot und erste Produktions-Phase braucht es **keins von beidem**.
