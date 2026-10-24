#!/usr/bin/env python3
"""Regenerate the complete offline inventory after adding any runtime file."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME_SHA = '8d2f2a2e58f65fff47f4eee65ba16fc5763d3563'
parser = argparse.ArgumentParser()
parser.add_argument('--allow-missing-home', action='store_true',
                    help='Only for preparing a patch when the original binary is unavailable.')
args = parser.parse_args()
assets = ['index.html', 'manifest.webmanifest', 'home.png', 'bea.png', 'biscotto.png', 'ricky.png']
for folder in ['css', 'js', 'icons', 'assets']:
    assets.extend(p.relative_to(ROOT).as_posix() for p in sorted((ROOT / folder).rglob('*')) if p.is_file())
version = hashlib.sha256()
for name in assets:
    path = ROOT / name
    if not path.exists():
        if name == 'home.png' and args.allow_missing_home:
            print('ATTENZIONE: home.png non disponibile localmente; verificare il binario nel repository prima del rilascio.')
            blob = HOME_SHA
        else:
            raise SystemExit('Risorsa mancante: ' + name)
    else:
        data = path.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if name == 'home.png' and blob != HOME_SHA:
            raise SystemExit('home.png è cambiata: ripristinare il file originale.')
    version.update((name + ':' + blob + '\n').encode())
template = (ROOT / 'scripts/sw.template.js').read_text()
output = template.replace('__VERSION__', version.hexdigest()[:16]).replace('__ASSETS__', json.dumps(assets, ensure_ascii=False, indent=2))
(ROOT / 'sw.js').write_text(output)
print('Precache:', len(assets), 'risorse; versione', version.hexdigest()[:16])
