import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWriting, writingTree, buildWriting } from '../scripts/writing.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(edit) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ai-lab-writing-'));
  await mkdir(path.join(dir, 'writing/bodies'), { recursive: true });
  await cp(path.join(root, 'templates'), path.join(dir, 'templates'), { recursive: true });
  const data = JSON.parse(await readFile(path.join(root, 'writing/entries.json'), 'utf8'));
  for (const entry of data.entries) {
    entry.status = 'pending';
    for (const key of ['body', 'byline', 'published', 'responseTitle']) delete entry[key];
  }
  await edit(data, dir);
  await writeFile(path.join(dir, 'writing/entries.json'), JSON.stringify(data));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

test('Chinese titles, spaces and punctuation survive catalogue URLs and pending pages', async () => {
  const f = await fixture(() => {});
  const dir = path.join(f.dir, 'out');
  try {
    const data = await readWriting(f.dir);
    await buildWriting(f.dir, dir, data);
    const tree = writingTree(data, { home: true });
    for (const entry of data.entries) {
      assert.equal(decodeURIComponent(entry.href.split('/').at(-2)), entry.source.title);
      assert(tree.includes(entry.href));
      const html = await readFile(path.join(dir, entry.diskPath, 'index.html'), 'utf8');
      assert(html.includes('noindex, follow')); assert(html.includes('回应尚未发布。'));
      assert(html.includes(entry.source.url)); assert(!html.includes('writing-meta'));
      assert(!html.includes('<time')); assert(!html.includes('application/ld+json'));
    }
  } finally { await f.cleanup(); }
});

test('drafts are omitted; publishing requires a nonempty selected body and actual metadata', async () => {
  const f = await fixture(async (data, dir) => {
    data.entries[0].status = 'draft';
    Object.assign(data.entries[1], { status: 'published', responseTitle: '回应的独立标题 & <原文>', body: 'bodies/test.md', published: '2026-09-05', byline: 'Test fixture author' });
    await writeFile(path.join(dir, 'writing/bodies/test.md'), 'Fixture **text**.');
  });
  try {
    const data = await readWriting(f.dir);
    assert.equal(data.entries.length, 3); assert(!writingTree(data).includes('布涅星'));
    assert(data.entries[0].bodyHTML.includes('<strong>text</strong>'));
    const output = path.join(f.dir, 'out'); await buildWriting(f.dir, output, data);
    const html = await readFile(path.join(output, data.entries[0].diskPath, 'index.html'), 'utf8');
    assert(!html.includes('noindex')); assert(html.includes('Test fixture author'));
    assert(html.includes('<h1 class="page-title">回应的独立标题 &amp; &lt;原文&gt;</h1>'));
    assert(html.includes('<title>回应的独立标题 &amp; &lt;原文&gt; · ai-lab</title>'));
    assert(html.includes(`rel="canonical" href="https://cheology.github.io/ai-lab/writing/bluenote/${encodeURIComponent('Z.A.T.O. 随想')}/"`));
    assert(writingTree(data).includes('<span>Z.A.T.O. 随想</span>'));
    assert(html.includes(data.entries[0].source.url));
    const manifestPath = path.join(f.dir, 'writing/entries.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    delete manifest.entries[1].byline;
    await writeFile(manifestPath, JSON.stringify(manifest));
    await buildWriting(f.dir, output, await readWriting(f.dir));
    const unsigned = await readFile(path.join(output, data.entries[0].diskPath, 'index.html'), 'utf8');
    assert(unsigned.includes('<p class="writing-meta"><time datetime="2026-09-05">2026-09-05</time></p>'));
    assert(!unsigned.includes('Test fixture author'));
    assert(!unsigned.includes('undefined'));
    await writeFile(path.join(f.dir, 'writing/bodies/test.md'), '  ');
    await assert.rejects(readWriting(f.dir), /空正文/);
  } finally { await f.cleanup(); }
});

test('bad destinations, duplicate routes, source-title drift and fake pending metadata fail', async () => {
  for (const [edit, error] of [
    [d => { d.entries[0].title = '../escape'; }, /标题/],
    [d => { d.entries[1].title = d.entries[0].title; }, /地址重复/],
    [d => { d.entries[0].source.title = 'Changed title'; }, /原文标题/],
    [d => { d.entries[0].source.url = 'javascript:alert(1)'; }, /HTTPS/],
    [d => { d.entries[0].published = '2026-09-05'; }, /待写/],
    [d => { d.entries[0].status = 'published'; }, /body/],
    [d => { d.entries[0].responseTitle = ' '; }, /responseTitle/],
  ]) {
    const f = await fixture(edit);
    try { await assert.rejects(readWriting(f.dir), error); } finally { await f.cleanup(); }
  }
});
