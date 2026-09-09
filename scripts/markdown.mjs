import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { writingMath } from './math.mjs';

// A fresh parser per article keeps reference numbering and definitions isolated.
export function renderWriting(markdown, { toc = false } = {}) {
  const parser = new Marked(markedFootnote({
    description: '注释', headingClass: '', backRefLabel: '返回正文',
  }), writingMath());
  const headings = [];
  const headingIds = new Set();
  let inAppendix = false;
  if (toc) parser.use({ renderer: { heading({ tokens, depth, text }) {
    const content = this.parser.parseInline(tokens);
    if (depth === 2 && text === '延伸阅读') inAppendix = true;
    if (depth !== 2 || inAppendix) return `<h${depth}>${content}</h${depth}>\n`;
    const base = `section-${text.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'heading'}`;
    let id = base;
    for (let suffix = 2; headingIds.has(id); suffix++) id = `${base}-${suffix}`;
    headingIds.add(id);
    // Reuse escaped rendered text, without nested links or formatting in the TOC.
    headings.push({ id, label: content.replace(/<[^>]*>/g, '') });
    return `<h2 id="${id}" tabindex="-1">${content}</h2>\n`;
  } } });
  const checked = new Set();
  parser.use({ walkTokens(token) {
    if (token.type === 'heading' && token.depth === 1) throw new Error('正文不要重复 H1；标题由元数据生成');
    if (token.type === 'text' && /\[\^[^\]\n]+\]/.test(token.raw)) throw new Error('正文包含未定义的注释');
    if (token.type !== 'footnotes' || checked.has(token)) return;
    checked.add(token);
    const labels = new Set();
    for (const note of token.rawItems) {
      if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(note.label)) throw new Error('注释 ID 必须使用小写英文语义名称');
      if (labels.has(note.label)) throw new Error(`注释定义重复：${note.label}`);
      labels.add(note.label);
      if (!note.refs.length) throw new Error(`注释未被引用：${note.label}`);
      if (!note.content.some(item => item.type !== 'space')) throw new Error(`注释为空：${note.label}`);
      parser.walkTokens(note.content, item => {
        if (item.type === 'footnoteRef') throw new Error('注释内不能嵌套注号');
      });
    }
  } });
  let html = parser.parse(markdown, { async: false });
  const references = new Map();
  const occurrences = new Map();
  html = html.replace(/<a id="(footnote-ref-[^"]+)"([^>]*data-footnote-ref[^>]*)>(\d+)<\/a>/g,
    (_, id, attributes, number) => {
      const occurrence = (occurrences.get(number) ?? 0) + 1;
      occurrences.set(number, occurrence);
      references.set(id, `返回正文注号 ${number}（第 ${occurrence} 处）`);
      return `<a id="${id}"${attributes} role="doc-noteref" aria-label="注释 ${number}">${number}</a>`;
    });
  html = html.replace(/href="#([^"]+)" data-footnote-backref aria-label="[^"]*"/g,
    (_, id) => `href="#${id}" data-footnote-backref aria-label="${references.get(id)}"`);
  html = html.replace(/<li id="(footnote-[^"]+)">/g, '<li id="$1" tabindex="-1">');

  // The pinned extension appends its section last. Keep optional further reading
  // after those notes, while authors continue to use ordinary Markdown headings.
  const notesAt = html.indexOf('<section class="footnotes" data-footnotes>');
  const notes = notesAt < 0 ? '' : html.slice(notesAt);
  const prose = notesAt < 0 ? html : html.slice(0, notesAt);
  const appendix = prose.split('<h2>延伸阅读</h2>\n');
  if (appendix.length > 2) throw new Error('延伸阅读只能出现一次');
  const body = appendix.length === 2
    ? `${appendix[0]}${notes}<section class="further-reading" aria-labelledby="further-reading-label">\n<h2 id="further-reading-label">延伸阅读</h2>\n${appendix[1]}</section>\n`
    : prose + notes;
  const contents = headings.length < 2 ? '' : `<details class="reading-toc"><summary>目录</summary><nav aria-label="文章目录"><ol>${headings.map(({ id, label }) => `<li><a href="#${encodeURIComponent(id)}">${label}</a></li>`).join('')}</ol></nav></details>\n`;
  return contents + body;
}
