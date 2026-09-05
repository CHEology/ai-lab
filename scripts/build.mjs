import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

async function assertPublicTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.') || entry.name === 'node_modules') {
      throw new Error(`不允许发布隐藏文件、符号链接或 node_modules：${path.join(directory, entry.name)}`);
    }
    if (entry.isDirectory()) await assertPublicTree(path.join(directory, entry.name));
    else if (!entry.isFile()) throw new Error(`不支持的文件：${entry.name}`);
  }
}

async function readProjects() {
  const projects = [];
  const directory = path.join(root, 'experiments');
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (!entry.isDirectory() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) {
      throw new Error(`实验目录名只能使用小写字母、数字和连字符：${entry.name}`);
    }
    const folder = path.join(directory, entry.name);
    const project = JSON.parse(await readFile(path.join(folder, 'project.json'), 'utf8'));
    if (project.draft !== undefined && typeof project.draft !== 'boolean') {
      throw new Error(`${entry.name}：draft 必须是布尔值`);
    }
    if (project.draft === true) continue;
    for (const key of ['title', 'date']) {
      if (typeof project[key] !== 'string' || !project[key].trim()) {
        throw new Error(`${entry.name} 缺少有效的 ${key}`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(project.date) || !Number.isFinite(Date.parse(project.date)) ||
        new Date(project.date).toISOString().slice(0, 10) !== project.date) {
      throw new Error(`${entry.name}：date 必须是有效的 YYYY-MM-DD 日期`);
    }
    if (project.externalUrl !== undefined) {
      if (typeof project.externalUrl !== 'string') throw new Error(`${entry.name}：externalUrl 必须是字符串`);
      const url = new URL(project.externalUrl);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${entry.name}：外部链接必须使用不含凭据的 HTTPS 地址`);
      project.href = url.href;
    } else {
      project.publicDirectory = path.join(folder, 'public');
      if (!(await stat(path.join(project.publicDirectory, 'index.html'))).isFile()) {
        throw new Error(`${entry.name} 缺少 public/index.html`);
      }
      await assertPublicTree(project.publicDirectory);
      project.href = `./experiments/${entry.name}/`;
    }
    projects.push({ ...project, slug: entry.name });
  }
  return projects.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

const projects = await readProjects();
const catalog = `<ul class="project-list" aria-label="作品">${projects.map((project) =>
  `<li><a href="${escape(project.href)}">${escape(project.title)}</a></li>`
).join('')}</ul>`;

const template = await readFile(path.join(root, 'site/index.html'), 'utf8');
for (const marker of ['<!-- CATALOG -->']) {
  if (template.split(marker).length !== 2) throw new Error(`首页必须包含且仅包含一个占位符：${marker}`);
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'site'), output, { recursive: true });
for (const project of projects) {
  if (project.publicDirectory) {
    await cp(project.publicDirectory, path.join(output, 'experiments', project.slug), { recursive: true });
  }
}
await writeFile(path.join(output, 'index.html'), template.replace('<!-- CATALOG -->', () => catalog));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built ai-lab: ${projects.length} published experiment(s) → dist/`);
