import { readFile, mkdir, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { renderWriting } from './markdown.mjs';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const origin = 'https://cheology.github.io/ai-lab/';
const folderIcon = '<svg class="directory-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2 3h8.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V7Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>';
const fileIcon = '<svg class="directory-icon directory-icon--file" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>';

function required(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} 必须是非空文本`);
  return value;
}
function httpsURL(value) {
  const url = new URL(required(value, 'source.url'));
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('原文必须使用不含凭据的 HTTPS 地址');
  return url.href;
}

export async function readWriting(root) {
  const folder = path.join(root, 'writing');
  const data = JSON.parse(await readFile(path.join(folder, 'entries.json'), 'utf8'));
  if (data.version !== 1 || !Array.isArray(data.collections) || !Array.isArray(data.entries)) throw new Error('文字清单格式错误');
  const groups = new Map();
  for (const group of data.collections) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group.id) || groups.has(group.id)) throw new Error('分组 ID 无效或重复');
    required(group.title, 'collection.title'); groups.set(group.id, group);
  }
  const ids = new Set(), paths = new Set(), entries = [];
  for (const entry of data.entries) {
    required(entry.id, 'id'); required(entry.title, 'title');
    if (entry.responseTitle !== undefined) required(entry.responseTitle, 'responseTitle');
    if (entry.toc !== undefined && typeof entry.toc !== 'boolean') throw new Error('toc 必须是布尔值');
    if (ids.has(entry.id)) throw new Error('文字 ID 重复'); ids.add(entry.id);
    if (!groups.has(entry.collection)) throw new Error(`${entry.id} 的分组不存在`);
    if (!['pending', 'published', 'draft'].includes(entry.status)) throw new Error(`${entry.id} 的状态无效`);
    if (entry.title !== entry.title.trim() || entry.title !== entry.title.normalize('NFC') || /[/\\\u0000-\u001f\u007f]/u.test(entry.title) || /^\.+$/.test(entry.title)) throw new Error('标题不能包含路径分隔符、控制字符或非规范名称');
    const diskPath = `writing/${entry.collection}/${entry.title}`;
    const key = diskPath.toLowerCase();
    if (paths.has(key)) throw new Error('文字地址重复'); paths.add(key);
    if (entry.source) {
      required(entry.source.title, 'source.title');
      if (entry.source.title !== entry.title) throw new Error('回应地址必须沿用原文标题');
      entry.source = { ...entry.source, url: httpsURL(entry.source.url) };
    }
    if (entry.collection === 'bluenote' && !entry.source) throw new Error('Blue Note 回应缺少原文链接');
    if (entry.status === 'draft') continue;
    let body = '';
    if (entry.status === 'published') {
      required(entry.body, 'body');
      if (entry.byline !== undefined) required(entry.byline, 'byline');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.published || '') || !Number.isFinite(Date.parse(entry.published)) || new Date(entry.published).toISOString().slice(0, 10) !== entry.published) throw new Error('已发布文字必须有真实有效的发布日期');
      if (!/^bodies\/.+\.md$/.test(entry.body)) throw new Error('正文必须是 bodies/ 中的 Markdown');
      const bodyPath = await realpath(path.resolve(folder, entry.body));
      const bodyRoot = await realpath(path.join(folder, 'bodies'));
      if (!bodyPath.startsWith(bodyRoot + path.sep)) throw new Error('正文路径越界');
      const markdown = await readFile(bodyPath, 'utf8');
      if (!markdown.trim()) throw new Error('已发布文字不能是空正文');
      body = renderWriting(markdown, { toc: entry.toc });
    } else if (entry.body || entry.byline || entry.published) {
      throw new Error('待写页面不能携带正文、署名或发布日期');
    }
    entries.push({ ...entry, bodyHTML: body, diskPath, href: `writing/${entry.collection}/${encodeURIComponent(entry.title)}/`, groupTitle: groups.get(entry.collection).title });
  }
  return { collections: data.collections, entries };
}

function fileRow(entry, prefix) {
  return `<li class="directory-file"><a href="${escape(prefix + entry.href)}">${fileIcon}<span>${escape(entry.title)}</span></a>${entry.status === 'pending' ? '<span class="directory-state">待写</span>' : ''}</li>`;
}

export function writingTree(data, { prefix = './', home = false } = {}) {
  const groups = data.collections.map(group => {
    const entries = data.entries.filter(entry => entry.collection === group.id);
    if (!entries.length) return '';
    return `<li><details class="directory-folder" open><summary><span class="directory-chevron" aria-hidden="true"></span>${folderIcon}<span class="folder-title">${escape(group.title)}</span></summary><ul class="directory-children">${entries.map(entry => fileRow(entry, prefix)).join('')}</ul></details></li>`;
  }).join('');
  if (!groups) return '';
  const tree = `<ul class="directory-tree" aria-label="文字目录">${groups}</ul>`;
  if (!home) return tree;
  return `<ul class="directory-tree" aria-label="作品目录"><li><details class="directory-folder" open><summary><span class="directory-chevron" aria-hidden="true"></span>${folderIcon}<span class="folder-title">文字</span></summary><div class="directory-children">${tree}</div></details></li></ul>`;
}

export async function buildWriting(root, output, data) {
  const template = await readFile(path.join(root, 'templates/writing.html'), 'utf8');
  for (const token of ['<!-- HEAD -->', '<!-- BREADCRUMBS -->', '<!-- CONTENT -->']) {
    if (template.split(token).length !== 2) throw new Error(`文字模板缺少唯一标记 ${token}`);
  }
  function document({ rootURL, title, route, breadcrumbs, content, pending = false }) {
    return template.replaceAll('{{ROOT}}', rootURL)
      .replace('<!-- HEAD -->', () => `<title>${escape(title)} · ai-lab</title>\n    <link rel="canonical" href="${escape(origin + route)}">${pending ? '\n    <meta name="robots" content="noindex, follow">' : ''}`)
      .replace('<!-- BREADCRUMBS -->', () => `<nav class="breadcrumbs" aria-label="所在目录">${breadcrumbs}</nav>`)
      .replace('<!-- CONTENT -->', () => content);
  }
  const index = document({ rootURL: '../', title: '文字', route: 'writing/', breadcrumbs: '<span aria-current="page">文字</span>', content: `<h1 class="page-title">文字</h1><div class="catalogue">${writingTree(data, { prefix: '../' })}</div>` });
  await mkdir(path.join(output, 'writing'), { recursive: true });
  await writeFile(path.join(output, 'writing/index.html'), index);
  for (const entry of data.entries) {
    const title = entry.responseTitle ?? (entry.source ? `回应《${entry.title}》` : entry.title);
    const body = entry.status === 'pending' ? `<p class="writing-pending">${entry.source ? '回应' : '文字'}尚未发布。</p>` : entry.bodyHTML;
    const metadata = entry.status === 'published' ? `<p class="writing-meta">${entry.byline ? `${escape(entry.byline)} · ` : ''}<time datetime="${escape(entry.published)}">${escape(entry.published)}</time></p>` : '';
    const back = entry.source ? `<footer class="writing-source"><a href="${escape(entry.source.url)}" aria-label="阅读 Blue Note 原文《${escape(entry.source.title)}》">Blue Note · 原文<span class="source-arrow" aria-hidden="true">↗</span></a></footer>` : '';
    const html = document({ rootURL: '../../../', title, route: entry.href, pending: entry.status === 'pending', breadcrumbs: `<a href="../../">文字</a><span class="separator" aria-hidden="true">/</span><span>${escape(entry.groupTitle)}</span>`, content: `<article class="reading"><h1 class="page-title">${escape(title)}</h1>${metadata}<div class="writing-body">${body}</div>${back}</article>` });
    await mkdir(path.join(output, entry.diskPath), { recursive: true });
    await writeFile(path.join(output, entry.diskPath, 'index.html'), html);
  }
}
