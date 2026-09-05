import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const output = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const base = new URL('https://cheology.github.io/ai-lab/');
const files = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const name = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(name);
    else if (entry.name.endsWith('.html')) files.push(name);
  }
}
await walk(output);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (/<!-- (HEAD|BREADCRUMBS|CONTENT|CATALOG) -->|\{\{ROOT\}\}/.test(html)) throw new Error(`模板未完成：${file}`);
  const current = new URL(path.relative(output, file).split(path.sep).map(encodeURIComponent).join('/'), base);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (/^(?:#|mailto:|tel:|data:)/.test(value)) continue;
    const target = new URL(value, current);
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) continue;
    let local = path.resolve(output, decodeURIComponent(target.pathname.slice(base.pathname.length)));
    if (local !== output && !local.startsWith(output + path.sep)) throw new Error(`资源路径越界：${value}`);
    if ((await stat(local)).isDirectory()) local = path.join(local, 'index.html');
    if (!(await stat(local)).isFile()) throw new Error(`资源不存在：${value}`);
  }
}
console.log(`Validated ${files.length} pages and all local links/assets under /ai-lab/.`);
