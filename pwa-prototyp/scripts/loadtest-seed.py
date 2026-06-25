#!/usr/bin/env python3
"""LAST-TEST-SEED — bildet eine ECHTE E-MTB-Ausgabe 1:1 nach (Bildverteilung von Tim
durchgezählt, #042-Klasse): 33 Panels = 24 Artikel + 9 Anzeigen, 474 Bilder gesamt.

Zweck (Mess-Sprint): Carousel-Skalierung (alle Panels in EINEM State) + die echte
Byte-Last einer realistisch großen Ausgabe MESSEN statt hochrechnen. Jedes Bild ist ein
EINDEUTIGES Stock-Foto (picsum.photos) → kein Browser-Cache verfälscht die Byte-Messung.

Die Pitch-Demo (#042) bleibt unberührt — alles liegt in `issue-lasttest`, fester _id-Präfix
MARKER, vollständig reversibel über loadtest-cleanup.py.
"""
import json, os, glob, urllib.request, urllib.parse, copy, concurrent.futures, threading

PROJECT, DATASET, API = "5ul5gufv", "production", "v2021-06-07"
BASE = f"https://{PROJECT}.api.sanity.io/{API}"
TOKEN = json.load(open(os.path.expanduser("~/.config/sanity/config.json")))["authToken"]
H = {"Authorization": f"Bearer {TOKEN}"}

TEST_ISSUE_ID = "issue-lasttest"
MARKER = "lasttest"
# Echte Magazin-Fotos in Standard-Auflösung (Tim, 17.06.) — absolute Realbedingungen
# statt Stock-Platzhaltern. Werden zyklisch auf die Bild-Slots verteilt (jede Datei 1× hochgeladen).
BILDER_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "pilot-content", "loadtest-bilder")

# Tim hat eine reale Ausgabe durchgezählt — Bilder pro Panel (1 = Anzeige):
DISTRIBUTION = [16, 16, 25, 16, 1, 22, 1, 19, 16, 21, 27, 1, 16, 23, 17, 13, 19,
                6, 17, 16, 1, 9, 20, 1, 16, 9, 1, 29, 17, 1, 1, 60, 1]

_key_counter = [0]


def ukey():
    _key_counter[0] += 1
    return f"lt{_key_counter[0]}"


def query(groq):
    url = f"{BASE}/data/query/{DATASET}?perspective=drafts&query=" + urllib.parse.quote(groq)
    with urllib.request.urlopen(urllib.request.Request(url, headers=H)) as r:
        return json.load(r)["result"]


def mutate(muts):
    req = urllib.request.Request(
        f"{BASE}/data/mutate/{DATASET}",
        data=json.dumps({"mutations": muts}).encode(),
        headers={**H, "Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def count_images(obj):
    n = 0
    if isinstance(obj, dict):
        a = obj.get("asset")
        if isinstance(a, dict) and str(a.get("_ref", "")).startswith("image-"):
            n += 1
        for v in obj.values():
            n += count_images(v)
    elif isinstance(obj, list):
        for v in obj:
            n += count_images(v)
    return n


def collect_image_dicts(obj, out):
    if isinstance(obj, dict):
        a = obj.get("asset")
        ref = str(a.get("_ref", "")) if isinstance(a, dict) else ""
        if ref.startswith("image-") or ref == "PLACEHOLDER":  # PLACEHOLDER = aufgefüllte fullbleed
            out.append(obj)
        for v in obj.values():
            collect_image_dicts(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_image_dicts(v, out)


def make_fullbleed():
    """Minimaler fullbleedPhoto-Baustein (1 Bild) — zum exakten Auffüllen auf Ziel-Bildzahl."""
    return {
        "_type": "fullbleedPhoto", "_key": ukey(),
        "image": {"_type": "image", "asset": {"_type": "reference", "_ref": "PLACEHOLDER"}},
        "caption": {"_type": "localeString", "de": "", "en": ""},
        "scrollEffect": "none",
    }


def adjust_body(body, target):
    """Body auf GENAU `target` Bilder bringen: zu viele Bild-Bausteine weglassen,
    Rest mit fullbleed auffüllen. Text/Tabellen/etc. bleiben immer erhalten."""
    out, cnt = [], 0
    for b in body:
        n = count_images(b)
        if n == 0:
            out.append(b)
        elif cnt + n <= target:
            out.append(b)
            cnt += n
    while cnt < target:
        out.append(make_fullbleed())
        cnt += 1
    return out


def upload_local(path):
    """Echte Magazin-Datei hochladen. MARKER im Dateinamen → cleanup findet sie wieder."""
    ctype = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    fn = urllib.parse.quote(f"{MARKER}-{os.path.basename(path)}")
    data = open(path, "rb").read()
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                f"{BASE}/assets/images/{DATASET}?filename={fn}",
                data=data, headers={**H, "Content-Type": ctype}, method="POST",
            )
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r)["document"]["_id"]
        except Exception:
            if attempt == 2:
                raise
    return None


def main():
    print("1) Originale laden …")
    arts = query('*[_type in ["articleEditorial","article"] && defined(slug.current)]')
    ad = query('*[_type=="advertisement" && count(images[].image.asset._ref) > 0][0]')
    print(f"   {len(arts)} Artikel-Vorlagen + 1 Anzeigen-Vorlage")

    clones, slots = [], []
    art_i = 0
    for pos, target in enumerate(DISTRIBUTION):
        if target == 1:  # Anzeige (1 ganzseitiges Motiv)
            clone = copy.deepcopy(ad)
            for k in ("_rev", "_createdAt", "_updatedAt"):
                clone.pop(k, None)
            clone["_id"] = f"{MARKER}-ad-{pos}"
            clone["issue"] = {"_type": "reference", "_ref": TEST_ISSUE_ID}
            clone["position"] = pos
            first = clone.get("images", [{}])[0]
            first.pop("imageMobile", None)
            first.pop("clickZonesMobile", None)
            clone["images"] = [first]
            clone.pop("gallery", None)
        else:  # Artikel mit genau `target` Bildern
            clone = copy.deepcopy(arts[art_i % len(arts)])
            art_i += 1
            for k in ("_rev", "_createdAt", "_updatedAt"):
                clone.pop(k, None)
            clone["_id"] = f"{MARKER}-art-{pos}"
            clone["issue"] = {"_type": "reference", "_ref": TEST_ISSUE_ID}
            clone["position"] = pos
            clone["slug"] = {"_type": "slug", "current": f"{MARKER}-{pos}"}
            clone["body"] = adjust_body(clone.get("body", []), target)
            if isinstance(clone.get("title_mag"), dict):
                clone["title_mag"] = {**clone["title_mag"], "de": f"{clone['title_mag'].get('de','Artikel')} · T{pos}"}
        imgs = []
        collect_image_dicts(clone, imgs)
        clones.append(clone)
        slots.extend(imgs)

    need = len(slots)
    files = sorted(glob.glob(os.path.join(BILDER_DIR, "*.jpg")) +
                   glob.glob(os.path.join(BILDER_DIR, "*.jpeg")) +
                   glob.glob(os.path.join(BILDER_DIR, "*.png")))
    if not files:
        raise SystemExit(f"Keine Bilder in {BILDER_DIR}")
    print(f"2) {len(clones)} Panels, {need} Bild-Slots — {len(files)} echte Bilder vorhanden "
          f"(zyklisch verteilt, {need - len(files) if need > len(files) else 0} Slots teilen sich Bilder)")

    print(f"3) {len(files)} echte Magazin-Bilder hochladen (je 1×) …")
    asset_ids = [None] * len(files)
    done, lock = [0], threading.Lock()

    def work(i):
        asset_ids[i] = upload_local(files[i])
        with lock:
            done[0] += 1
            if done[0] % 40 == 0 or done[0] == len(files):
                print(f"   {done[0]}/{len(files)}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        list(ex.map(work, range(len(files))))
    asset_ids = [a for a in asset_ids if a]
    # Zyklisch auf die Slots verteilen (eindeutige Bilder = len(files); überzählige Slots teilen)
    for i, slot in enumerate(slots):
        slot["asset"] = {"_type": "reference", "_ref": asset_ids[i % len(asset_ids)]}

    print("4) Test-Ausgabe + Klone schreiben …")
    test_issue = {
        "_id": TEST_ISSUE_ID, "_type": "issue",
        "magazine": {"_type": "reference", "_ref": "magazine-emtb"},
        "number": 999,
        "title": {"_type": "localeString", "de": "LAST-TEST (temporär)", "en": "LOAD TEST"},
        "publishDate": "2026-06-17",
        "coverImage": {"_type": "image", "asset": {"_type": "reference", "_ref": asset_ids[0]}},
    }
    muts = [{"createOrReplace": test_issue}] + [{"createOrReplace": c} for c in clones]
    for i in range(0, len(muts), 5):
        mutate(muts[i:i + 5])
        print(f"   {min(i + 5, len(muts))}/{len(muts)}")

    print(f"\n✓ FERTIG: '{TEST_ISSUE_ID}' — {len(clones)} Panels, {len(asset_ids)} Bilder (echte #042-Verteilung).")
    print("  Nächster Schritt: ISSUE_ID = 'issue-lasttest' in lib/sanity.ts, build, messen.")


if __name__ == "__main__":
    main()
