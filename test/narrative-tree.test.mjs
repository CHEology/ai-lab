import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../experiments/narrative-tree/public/', import.meta.url);

test('both trees and their roots ship as actual vector curves, without embedded bitmap artwork', async () => {
  const names = ['silver-crown', 'silver-roots', 'open-crown', 'open-roots'];
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const name of names) {
    const svg = await readFile(new URL(`assets/${name}.svg`, root), 'utf8');
    assert.match(svg, /<svg\b[^>]*viewBox="0 0 1254 1254"/);
    assert.doesNotMatch(svg, /<image\b|<foreignObject\b|data:image|<script\b/i);
    const curves = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)];
    assert.equal(curves.length, 3, `${name}: three silver ink layers`);
    assert.ok(curves.every(([, d]) => /[Cc]/.test(d) && d.length > 10000), `${name}: detailed Bezier contours`);
    assert.ok(html.includes(`src="assets/${name}.svg"`));
  }
  assert.ok((await readdir(new URL('assets/', root))).every(name => name.endsWith('.svg')));
});
