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
  await edit(data, dir);
  await writeFile(path.join(dir, 'writing/entries.json'), JSON.stringify(data));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

test('Chinese titles, spaces and punctuation survive catalogue URLs and pending pages', async () => {
  const data = await readWriting(root);
  const dir = await mkdtemp(path.join(tmpdir(), 'ai-lab-render-'));
  try {
    await buildWriting(root, dir, data);
    const tree = writingTree(data, { home: true });
    for (const entry of data.entries) {
      assert.equal(decodeURIComponent(entry.href.split('/').at(-2)), entry.source.title);
      assert(tree.includes(entry.href));
      const html = await readFile(path.join(dir, entry.diskPath, 'index.html'), 'utf8');
      assert(html.includes('noindex, follow')); assert(html.includes('回应尚未发布。'));
      assert(html.includes(entry.source.url)); assert(!html.includes('writing-meta'));
      assert(!html.includes('<time')); assert(!html.includes('application/ld+json'));
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('drafts are omitted; publishing requires a nonempty selected body and actual metadata', async () => {
  const f = await fixture(async (data, dir) => {
    data.entries[0].status = 'draft';
    Object.assign(data.entries[1], { status: 'published', body: 'bodies/test.md', published: '2026-09-05', byline: 'Test fixture author' });
    await writeFile(path.join(dir, 'writing/bodies/test.md'), 'Fixture **text**.');
  });
  try {
    const data = await readWriting(f.dir);
    assert.equal(data.entries.length, 3); assert(!writingTree(data).includes('布涅星'));
    assert(data.entries[0].bodyHTML.includes('<strong>text</strong>'));
    const output = path.join(f.dir, 'out'); await buildWriting(f.dir, output, data);
    const html = await readFile(path.join(output, data.entries[0].diskPath, 'index.html'), 'utf8');
    assert(!html.includes('noindex')); assert(html.includes('Test fixture author'));
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
  ]) {
    const f = await fixture(edit);
    try { await assert.rejects(readWriting(f.dir), error); } finally { await f.cleanup(); }
  }
});
