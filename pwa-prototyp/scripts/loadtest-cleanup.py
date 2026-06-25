#!/usr/bin/env python3
"""LAST-TEST-CLEANUP — entfernt restlos, was loadtest-seed.py angelegt hat.

Reihenfolge wichtig: erst die Klon-Dokumente + Test-Ausgabe löschen, DANN die
Stock-Assets (Assets lassen sich nicht löschen, solange ein Dokument sie referenziert).
"""
import json, os, urllib.request, urllib.parse

PROJECT, DATASET, API = "5ul5gufv", "production", "v2021-06-07"
BASE = f"https://{PROJECT}.api.sanity.io/{API}"
TOKEN = json.load(open(os.path.expanduser("~/.config/sanity/config.json")))["authToken"]
H = {"Authorization": f"Bearer {TOKEN}"}

MARKER = "lasttest"
TEST_ISSUE_ID = "issue-lasttest"


def query(groq):
    url = f"{BASE}/data/query/{DATASET}?query=" + urllib.parse.quote(groq)
    with urllib.request.urlopen(urllib.request.Request(url, headers=H)) as r:
        return json.load(r)["result"]


def delete_batch(ids):
    if not ids:
        return 0
    n = 0
    for i in range(0, len(ids), 20):
        chunk = ids[i:i + 20]
        try:
            req = urllib.request.Request(
                f"{BASE}/data/mutate/{DATASET}",
                data=json.dumps({"mutations": [{"delete": {"id": x}} for x in chunk]}).encode(),
                headers={**H, "Content-Type": "application/json"}, method="POST",
            )
            urllib.request.urlopen(req).read()
            n += len(chunk)
        except Exception as e:
            print(f"   Batch-Fehler ({len(chunk)} Stück): {e} — einzeln versuchen")
            for x in chunk:
                try:
                    req = urllib.request.Request(
                        f"{BASE}/data/mutate/{DATASET}",
                        data=json.dumps({"mutations": [{"delete": {"id": x}}]}).encode(),
                        headers={**H, "Content-Type": "application/json"}, method="POST",
                    )
                    urllib.request.urlopen(req).read()
                    n += 1
                except Exception as e2:
                    print(f"     {x}: {e2}")
    return n


def main():
    # 1) Klon-Dokumente + drafts + Test-Ausgabe
    docs = query(f'*[_id match "{MARKER}-*" || _id match "drafts.{MARKER}-*" || _id=="{TEST_ISSUE_ID}" || _id=="drafts.{TEST_ISSUE_ID}"]._id')
    print(f"1) {len(docs)} Dokumente (Klone + Test-Ausgabe) löschen …")
    print(f"   {delete_batch(docs)} gelöscht")

    # 2) Stock-Assets (erst jetzt, da nicht mehr referenziert)
    assets = query(f'*[_type=="sanity.imageAsset" && originalFilename match "{MARKER}-*"]._id')
    print(f"2) {len(assets)} Stock-Bilder löschen …")
    print(f"   {delete_batch(assets)} gelöscht")
    print("\n✓ Aufgeräumt. Reader-ISSUE_ID wieder auf 'issue-emtb-042' stellen!")


if __name__ == "__main__":
    main()
