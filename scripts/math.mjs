import katex from 'katex';

// Compile TeX to native MathML. No browser scripts, remote fonts or CDN assets.
export function writingMath() {
  const render = (text, displayMode) => katex.renderToString(text, {
    displayMode, output: 'mathml', throwOnError: true, strict: 'error',
    trust: false, maxExpand: 1000, maxSize: 20,
  });
  return { extensions: [
    {
      name: 'writingMathBlock', level: 'block',
      start: source => source.match(/^\$\$[ \t]*$/m)?.index,
      tokenizer(source) {
        const match = /^\$\$[ \t]*\n([\s\S]+?)\n\$\$(?:[ \t]*\n|[ \t]*$)/.exec(source);
        if (match) return { type: 'writingMathBlock', raw: match[0], text: match[1] };
      },
      renderer: token => `<div class="math-display" tabindex="0" role="region" aria-label="独立公式">${render(token.text, true)}</div>\n`,
    },
    {
      name: 'writingMathInline', level: 'inline',
      start: source => source.indexOf('$'),
      tokenizer(source) {
        // Delimiters hug the expression. Escaped dollars and code remain literal.
        const match = /^\$(?![\s$])((?:\\[^\n]|[^\\$\n])+?)(?<!\s)\$(?![\d$])/.exec(source);
        if (match) return { type: 'writingMathInline', raw: match[0], text: match[1] };
      },
      renderer: token => render(token.text, false),
    },
  ] };
}
