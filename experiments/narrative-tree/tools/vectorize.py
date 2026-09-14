#!/usr/bin/env python3
"""Trace the approved ink drawings into layered, pure-path SVG artwork.

Requires Potrace 1.16 and Pillow. Run with:
  uv run --with pillow python experiments/narrative-tree/tools/vectorize.py

This preserves the approved composition; tracing does not invent new detail.
The PNG sources are retained outside public/ for reproducibility.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from concurrent.futures import ThreadPoolExecutor
import argparse
import re
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
NAMES = ('silver-crown', 'silver-roots', 'open-crown', 'open-roots')
# Nested contours retain quiet gray hairlines and bright silver ink. Separating
# these preserves the drawing's texture better than a single binary silhouette.
LAYERS = ((40, '#555555'), (105, '#aaaaaa'), (175, '#eeeeee'))
NS = '{http://www.w3.org/2000/svg}'

def trace(name):
    source = ROOT / 'artwork-sources' / (name + '.png')
    if not source.exists():
        source = ROOT / 'public/assets' / (name + '.png')
    image = Image.open(source).convert('L')
    width, height = image.size
    # Subpixel contours: interpolation before tracing improves curve placement;
    # the deliverable contains Bezier paths only, never this working bitmap.
    image = image.resize((width * 2, height * 2), Image.Resampling.BICUBIC)
    groups = []
    with TemporaryDirectory(prefix='tree-vector-') as scratch:
        for threshold, color in LAYERS:
            mask = image.point(lambda p: 0 if p >= threshold else 255, mode='1')
            pbm = Path(scratch) / f'{threshold}.pbm'
            svg = Path(scratch) / f'{threshold}.svg'
            mask.save(pbm)
            subprocess.run(['potrace', str(pbm), '-s', '-o', str(svg), '--flat',
                            '-t', '2', '-a', '1.15', '-O', '0.12', '-u', '100',
                            '-C', color], check=True)
            tree = ET.parse(svg)
            group = tree.getroot().find(NS + 'g')
            # Potrace coordinates are quantized in units of 1/100 source pixel.
            # Parent scale returns the 2x tracing plane to the original viewBox.
            markup = ET.tostring(group, encoding='unicode')
            markup = markup.replace('ns0:', '').replace(':ns0', '')
            markup = re.sub(r' xmlns="[^"]+"', '', markup)
            markup = re.sub(r'\s+', ' ', markup)
            groups.append(markup)
    output = ROOT / 'public/assets' / (name + '.svg')
    description = ('银白细线描绘的根系，沿主干与分叉延伸出纤细根须。' if name.endswith('roots')
                   else '银白细线描绘的大树，疏密相间的枝条与细碎叶纹舒展在黑色平面上。')
    content = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
               f'width="{width}" height="{height}" shape-rendering="geometricPrecision">\n'
               f'<desc>{description}</desc>\n'
               f'<rect width="{width}" height="{height}" fill="#000"/>\n'
               '<g transform="scale(.5)">\n' + '\n'.join(groups) + '\n</g>\n</svg>\n')
    assert '<image' not in content and 'data:image' not in content
    output.write_text(content)
    return f'{name}: {len(content):,} bytes, {content.count("<path")} compound Bezier paths'

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('names', nargs='*')
    args = parser.parse_args()
    names = args.names or NAMES
    if any(name not in NAMES for name in names):
        parser.error('Unknown artwork name')
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(trace, names):
            print(result)
