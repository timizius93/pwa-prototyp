# CMS- & Infrastruktur-Entscheidung — 41 Publishing Magazin-PWA

> **Status:** Analyse v0.1 · Stand Mai 2026
> **Zweck:** Entscheidungsgrundlage für die Wahl des CMS und der Bild-/Auslieferungs-Infrastruktur. Für Tim, den Senior-Dev und das spätere Budget-Gespräch mit Max & Robin.
> **Kurzfassung (ENTSCHIEDEN):** **Sanity** für Pilot UND Produktion. Managed-Stack **Sanity + Vercel + Cloudflare** — kein selbst gehosteter Server. Grund: Tim will das Projekt selbst wuppen (mit Claude als Implementierungs-Partner), der Senior-Dev nur punktuell beratend. Damit scheidet Payload (Self-Hosting = Ops-Last) aus. Eine **CDN-Schicht (Cloudflare) ist bei unserer Leserzahl Pflicht** — damit ist das Bild-/Bandwidth-Kostenproblem gelöst, ohne die Redaktions-Pflege zu verschlechtern.

---

## 1. Ausgangsfrage

Vor dem Bauen wollen wir klären:
1. Wie groß ist die Vendor-Abhängigkeit bei Sanity?
2. Werden die Kosten bei großen Bildmengen / vielen Lesern unkontrollierbar?
3. Ist Payload (selbst-hostbar) die bessere Alternative?

---

## 2. Wichtige Projekt-Kennzahl: Leserzahl

**21.000 – 35.000 Leser pro Ausgabe** (variiert je nach Magazin).
4 Magazine × 3–4 Ausgaben/Jahr ≈ **~14 Ausgaben/Jahr**.

Diese Zahl ist der entscheidende Faktor für die Bandwidth-Rechnung (siehe Abschnitt 5).

---

## 3. Sanity — Preise & Lock-in

### Preise (Stand Mai 2026)

| | Free | Growth |
|---|---|---|
| Preis | $0 | $15 pro Seat/Monat (bis 50 Seats) |
| Assets (Speicher) | 100 GB | 100 GB |
| Bandwidth/Monat | 100 GB | 100 GB |
| Documents | 10.000 | 25.000 |
| Overage Bandwidth | – | $0,30 / GB |
| Overage Assets | – | $0,50 / GB |
| Overage API CDN | – | $1 / 250.000 Requests |

Add-on „Erhöhtes Kontingent" (Growth): $299/Monat → 500 GB Bandwidth/Assets, 5M CDN-Requests.

### Vendor-Abhängigkeit (Lock-in)

Ja, vorhanden: Content liegt in Sanitys Cloud, Abfrage via deren Query-Sprache (GROQ), Studio in deren Ökosystem. Export ist möglich, aber ein Wechsel weg von Sanity ist echte Arbeit (~1–2 Wochen Dev).

**Abmildernd:** Unser Schema-Konzept (`schema-entwurf.md`) ist CMS-unabhängig gedacht. Portierbar ist das Konzept; nicht portierbar ist die konkrete Implementierung.

---

## 4. Payload — die selbst-hostbare Alternative

| Aspekt | Payload |
|---|---|
| Lizenz | Open Source (MIT) — wirklich frei |
| Hosting | Selbst hostbar (eigener Server / VPS / Cloud deiner Wahl) |
| Datenbank | MongoDB **oder** Postgres |
| Bilder/Assets | Speicherbar wo man will — lokal, S3, Cloudflare R2, Vercel Blob |
| Next.js | Version 3.0 läuft **nativ in Next.js** (gleicher Stack wie geplant) |
| Cloud-Option | Payload Cloud existiert (kostenpflichtig), ist aber optional |

**Kosten selbst-gehostet (geschätzt):** VPS ~€20–50/Monat + Objektspeicher ~€10–15/Monat = **~€40–90/Monat FLAT**, unabhängig von Team-Größe und Traffic. Kein Per-Seat, keine Overages.

**Der Haken:** Du besitzt den Betrieb — Updates, Backups, Sicherheit, Skalierung. Bei einem Teilzeit-Treiber ohne Dev heißt das: der Senior-Dev muss das aufsetzen UND dauerhaft pflegen.

---

## 5. Die Bild-/Bandwidth-Rechnung (der Kern der Kostenfrage)

### Annahmen
- ~200 Bilder pro Ausgabe
- ~300 KB pro web-optimiertem Bild (Reader-Variante, nicht Print)
- Ein engagierter Leser lädt im Schnitt die ganze Ausgabe ≈ 60 MB

### Auslieferung an die Leser pro Ausgabe
```
35.000 Leser × 60 MB ≈ 2.000 GB ≈ 2 TB pro Ausgabe
```
→ Das ist weit über Sanitys 100 GB/Monat.

### Szenario A: OHNE CDN (Bilder direkt von Sanity an jeden Leser)
```
2.000 GB − 100 GB inkl. = 1.900 GB × $0,30 ≈ $570 Overage pro Ausgabe
× 14 Ausgaben/Jahr ≈ ~$8.000/Jahr — nur Bandwidth
```
**Teuer. Und das gilt für JEDES CMS** (auch Payload), wenn man naiv vom Origin ausliefert.

### Szenario B: MIT CDN davor (Cloudflare) — die Lösung
Ein CDN cached jedes Bild nach dem ersten Abruf und liefert es aus dem eigenen Cache. Sanity sieht danach fast nichts mehr:
```
Origin-Last (zählt auf Sanity-Quota):
200 Bilder × ~30 Cache-Füllungen × 300 KB ≈ 1,8 GB pro Ausgabe
× 14 Ausgaben/Jahr ≈ ~25 GB/Jahr  → locker im Free-Tier
```
Die 2 TB an die Leser liefert Cloudflare aus — bei deren Modell ist Cache-Auslieferung praktisch unbegrenzt/kostenlos.

**Ergebnis: Mit CDN-Schicht wird Bandwidth ein Nicht-Problem — bei Sanity wie bei Payload.**

---

## 6. Cloudflare CDN vs. Cloudflare R2 (Begriffsklärung)

Zwei verschiedene Produkte derselben Firma:

| | Was | Rolle |
|---|---|---|
| **Cloudflare CDN** | Weltweites Auslieferungs-/Cache-Netz, sitzt vor der Seite | Beschleunigt + cached Auslieferung → **die Bandwidth-Lösung** |
| **Cloudflare R2** | Datei-/Objektspeicher (wie S3), ohne Egress-Gebühren | Speichert Dateien, falls man Bilder aus dem CMS auslagert |

### Variante A vs. B (wichtig für die Pflege)

| Variante | Editing-UX | Bandwidth | Empfehlung |
|---|---|---|---|
| **A) CDN davor, Bilder bleiben in Sanity** | ✅ bleibt 100% perfekt (Drag-Drop, Crop, alles im Studio) | ✅ gelöst | **DAS nehmen wir** |
| **B) Bilder auf R2 auslagern** | ❌ separater Upload, umständlicher | ✅ maximal günstig | nur bei extremem Skalierungsdruck |

**Entscheidung:** Variante A. Cloudflare ist unsichtbare Infrastruktur zwischen PWA und Leser — die Redaktion merkt nichts davon, arbeitet weiter komplett im Sanity-Studio.

---

## 7. Entscheidungs-Rahmen Sanity vs. Payload

Mit der CDN-Schicht ist die Bild-Kostenfrage bei beiden gelöst. Die Wahl hängt damit an anderen Faktoren:

| Kriterium | Sanity | Payload |
|---|---|---|
| Schnell starten | ✅ sofort | 🟡 mehr Setup |
| Editor-UX / Live-Preview | ✅ Beste am Markt (Presentation) | 🟡 gut, weniger poliert |
| Ops-Aufwand | ✅ null | ❌ ihr tragt ihn |
| Kosten-Vorhersehbarkeit | 🟡 nutzungsabhängig | ✅ flach |
| Vendor-Unabhängigkeit | ❌ Lock-in | ✅ volle Kontrolle |
| Passt zu Teilzeit-Treiber ohne festen Dev | ✅ | ❌ (braucht dauerhaft Dev) |

**Die Schlüsselfrage:** Habt ihr verlässliche, *laufende* Dev-Unterstützung für den Betrieb?
- **Ja, dauerhaft** → Payload self-hosted wird sehr attraktiv (kostenstabil, unabhängig, ideal für bild-lastig)
- **Nein / nur punktuell / lowest Ops** → Sanity Growth + CDN

### → ENTSCHIEDEN: Sanity (Managed-Stack)

Tim will das Projekt selbst wuppen (Claude als Implementierungs-Partner), Senior-Dev nur punktuell beratend. Das beantwortet die Schlüsselfrage eindeutig mit „nur punktuell" → **Sanity gewinnt, auch für die Produktion.**

Begründung: Self-Hosting (Payload) würde Tim — einen Mediengestalter in Teilzeit, keinen Dev — zum unfreiwilligen Sysadmin machen (Updates, Backups, Security-Patches, Skalierung). Genau das soll vermieden werden. Managed Services (Sanity + Vercel + Cloudflare) bedeuten: **kein Server, den Tim pflegen muss** — der Anbieter übernimmt Ops & Ausfallsicherheit. Das macht es realistisch, dass ein Nicht-Dev eine Produktiv-App betreibt.

**Rolle des Senior-Devs = punktuelle Checkpoints, nicht Implementierung:**
1. Architektur-Review vor dem Start (paar Stunden)
2. Produktions-Review vor Go-Live (1–2 Tage): Sicherheit, Performance, Edge-Cases
3. GAM / Werbe-Integration (das fummelige Spezial-Thema)
4. Notfall-Lifeline, wenn Produktives bricht und Tim + Claude nicht weiterkommen

**Bekannte Risiken des Selbst-Wuppen-Modells:** Tempo (Teilzeit → läuft im Tim-Stundentakt), die „letzten 20%" (läuft-bei-mir → produktionsreif), Bus-Faktor (alles in einem Kopf → durch Doku in `docs/` + `CLAUDE.md` abgefedert).

---

## 8. Empfehlung / Entscheidung

1. **Sanity für Pilot UND Produktion** (entschieden). Pilot startet auf Free-Tier (kostet nichts, beste Live-Preview), produktiv später Growth-Plan. Managed-Stack **Sanity + Vercel + Cloudflare** — kein selbst gehosteter Server.

2. **Payload verworfen** — nicht weil schlecht, sondern weil Self-Hosting nicht zum Selbst-Wuppen-Modell eines Nicht-Devs in Teilzeit passt.

3. **CDN-Schicht (Cloudflare) als gesetzt einplanen** — sobald echter Leser-Traffic draufkommt, ist sie Pflicht. Löst die Bild-Bandwidth-Kosten.

4. **R2-Offloading (Variante B) als bekannten Hebel für später vormerken** — nur einbauen, wenn echte Zahlen zeigen, dass es nötig ist. Nicht im Pilot, nicht verfrüht optimieren.

5. **Senior-Dev als punktueller Berater** — gezielte Checkpoints (Architektur-Review, Pre-Launch-Review, GAM, Notfall-Lifeline), keine Routine-Implementierung.

---

## 9. Offene Punkte

- ~~Senior-Dev: punktuelle Beratung oder dauerhafter Betrieb?~~ → GEKLÄRT: punktuell beratend; Tim wuppt selbst → Sanity-Managed-Stack
- Genaue Bild-Anzahl + Durchschnittsgröße pro Ausgabe verifizieren (meine 200 × 300 KB sind Schätzung)
- Sanity Growth-Seats: wie viele Personen pflegen wirklich Content? (Tim, Julian, GZD, ggf. Redakteure)
- Cloudflare-Setup: wer richtet das CDN ein, eigene Bild-Domain (z. B. images.41publishing.com)?
- Print-Master (.tif) NICHT in Sanity laden — web-optimierte Hi-Res-JPEGs als Sanity-Master, Print-TIFFs bleiben in der Drive

---

## 10. Glossar

- **CDN** — Content Delivery Network; cached + liefert Inhalte schnell weltweit aus.
- **Egress-Gebühren** — Kosten fürs Rausschicken von Daten aus einem Speicher; bei R2 = $0.
- **Origin** — der Ursprungs-Server, von dem das CDN die Inhalte holt (hier: Sanity oder R2).
- **Lock-in** — Abhängigkeit von einem Anbieter, aus der ein Wechsel teuer/aufwendig ist.
- **Seat** — bezahlter Nutzer-Zugang im CMS.
