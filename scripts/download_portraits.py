"""
Télécharge tous les portraits SF6 depuis le site officiel Capcom.
Usage : py download_portraits.py
"""

import requests
from pathlib import Path

BASE_URL = "https://www.streetfighter.com/6/assets/images/character/select_character{n}_over.png"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.streetfighter.com/6/en-us/character",
}

OUTPUT_DIR = Path("frontend/public/portraits")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Téléchargement des portraits SF6...\n")

for n in range(1, 35):
    url = BASE_URL.format(n=n)
    dest = OUTPUT_DIR / f"character_{n}.png"

    if dest.exists():
        print(f"  ✅ {n} — déjà téléchargé")
        continue

    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            dest.write_bytes(resp.content)
            size_kb = len(resp.content) // 1024
            print(f"  ✅ {n} — {size_kb} KB")
        else:
            print(f"  ❌ {n} — status {resp.status_code}")
    except Exception as e:
        print(f"  ❌ {n} — erreur: {e}")

print(f"\nPortraits sauvegardés dans : {OUTPUT_DIR}")
print("Ouvre le dossier pour voir quel numéro correspond à quel perso !")
