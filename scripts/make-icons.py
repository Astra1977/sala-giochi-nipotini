#!/usr/bin/env python3
"""Export PWA sizes from the generated Super Nipotini icon master.
Pillow is build-only. Original home.png is never edited.
"""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent.parent
art = Image.open(root / 'assets/icon-master.webp').convert('RGB')
icons = root / 'icons'
for name, size in [('icon-192.png',192), ('icon-512.png',512), ('apple-touch-icon.png',180), ('favicon-48.png',48)]:
    art.resize((size,size),Image.Resampling.LANCZOS).save(icons/name,optimize=True)
# Complete faces remain inside the Android safe circle: same artwork, inset.
for size in [192,512]:
    image = Image.new('RGB',(size,size),'#087e94')
    inner = round(size*.72)
    image.paste(art.resize((inner,inner),Image.Resampling.LANCZOS),((size-inner)//2,(size-inner)//2))
    image.save(icons/f'maskable-{size}.png',optimize=True)
