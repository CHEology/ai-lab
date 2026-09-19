import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderWriting } from './markdown.mjs';
import { escape } from './writing.mjs';

export const narrativeDesign = {
  title: '根与冠 整理稿 0916',
  route: 'experiments/narrative-tree/narrative-design/',
  byline: 'GPT-6',
  published: '2026-09-16',
};

// Publish this selected project note without copying working documents into dist.
export async function buildNarrativeDesign(root, output) {
  const markdown = await readFile(path.join(root, 'experiments/narrative-tree/NARRATIVE-DESIGN.md'), 'utf8');
  const template = await readFile(path.join(root, 'templates/writing.html'), 'utf8');
  const { title, route, byline, published } = narrativeDesign;
  const body = renderWriting(markdown)
    .replace(/<table>/g, '<div class="project-table" tabindex="0" role="region" aria-label="对照表，可横向滚动"><table>')
    .replace(/<\/table>/g, '</table></div>');
  const html = template.replaceAll('{{ROOT}}', '../../../')
    .replace('<!-- HEAD -->', () => `<title>${escape(title)} · 根与冠 · ai-lab</title>\n    <link rel="canonical" href="https://cheology.github.io/ai-lab/${route}">`)
    .replace('<!-- BREADCRUMBS -->', () => '<nav class="breadcrumbs" aria-label="所在目录"><a href="../../../">项目</a><span class="separator" aria-hidden="true">/</span><a href="../">根与冠 / Of roots and leaves</a></nav>')
    .replace('<!-- CONTENT -->', () => `<article class="reading"><h1 class="page-title">${escape(title)}</h1><p class="writing-meta">${escape(byline)} · <time datetime="${published}">${published}</time></p><div class="writing-body">${body}</div></article>`);
  const folder = path.join(output, route);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), html);
}
