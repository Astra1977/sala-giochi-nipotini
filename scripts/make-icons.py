#!/usr/bin/env python3
"""Draw original generic gamepad icons, without touching home.png. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parent.parent / 'icons'
root.mkdir(exist_ok=True)
for name, size in [('icon-192.png',192), ('icon-512.png',512), ('maskable-512.png',512), ('apple-touch-icon.png',180)]:
    image = Image.new('RGB', (512,512), '#07396a')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((100,158,412,354), radius=70, fill='#ffcf48')
    draw.rounded_rectangle((144,242,236,266), radius=8, fill='#07396a')
    draw.rounded_rectangle((178,208,202,300), radius=8, fill='#07396a')
    draw.ellipse((296,210,328,242), fill='#ed515a')
    draw.ellipse((342,260,374,292), fill='#3683dc')
    image.resize((size,size),Image.Resampling.LANCZOS).save(root/name)
