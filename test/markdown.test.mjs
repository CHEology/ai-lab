import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderWriting } from '../scripts/markdown.mjs';

test('notes follow reading order, return to each occurrence, and precede further reading', () => {
  const html = renderWriting('开头。[^scene]\n\n另一个依据。[^book] 再次引用。[^scene]\n\n[^book]: [书籍](https://example.org/book)。\n\n[^scene]: 场景说明。\n\n## 延伸阅读\n\n另一种解释。');
  assert.match(html, /id="footnote-ref-scene"[^>]*aria-label="注释 1">1<\/a>/);
  assert.match(html, /id="footnote-ref-book"[^>]*>2<\/a>/);
  assert.match(html, /id="footnote-ref-scene-2"[^>]*>1<\/a>/);
  assert.match(html, /href="#footnote-ref-scene-2"[^>]*aria-label="返回正文注号 1（第 2 处）"/);
  assert(html.indexOf('id="footnote-scene"') < html.indexOf('id="footnote-book"'));
  assert(html.indexOf('class="footnotes"') < html.indexOf('class="further-reading"'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target));
  assert(!html.includes('<script'));
});

test('missing, duplicate, empty, unused, nested notes and extra H1s fail before publication', () => {
  for (const [source, error] of [
    ['正文。[^missing]', /未定义/],
    ['正文。[^same]\n\n[^same]: 一。\n\n[^same]: 二。', /重复/],
    ['正文。[^empty]\n\n[^empty]:\n', /为空/],
    ['正文。\n\n[^unused]: 未用。', /未被引用/],
    ['正文。[^1]\n\n[^1]: 数字。', /语义名称/],
    ['正文。[^one]\n\n[^one]: 嵌套[^two]\n\n[^two]: 二。', /嵌套/],
    ['# 重复标题\n\n正文。', /H1/],
  ]) assert.throws(() => renderWriting(source), error);
});

test('literal syntax in code remains literal and article note state never leaks', () => {
  const html = renderWriting('`[^literal]`\n\n```md\n[^example]: 示例。\n```\n\n正文。[^real]\n\n[^real]: 已核对。');
  assert(html.includes('<code>[^literal]</code>'));
  assert(html.includes('[^example]: 示例。'));
  assert(html.includes('aria-label="注释 1"'));
  const next = renderWriting('另一篇。[^next]\n\n[^next]: 独立。');
  assert(next.includes('aria-label="注释 1"'));
  assert(!next.includes('footnote-real'));
  assert(!renderWriting('不需要注释的短文。').includes('footnotes'));
});
