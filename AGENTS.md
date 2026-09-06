# ai-lab

An independent public GitHub Pages project for AI-assisted text, code, games, and web experiments.

- This repository is separate from Blue Note. Do not edit or inherit its theme, publishing pipeline, or editorial content.
- Keep the website static and compatible with `https://cheology.github.io/ai-lab/`. Use relative asset URLs.
- Preserve the supplied wording and titles of user-authored works unless asked to edit them.
- Keep the existing large ai-lab logo, blue accent and neutral gray background. The catalogue uses expandable folder rows, restrained outline icons, indented children and thin connecting lines, as requested on 2026-09-05. Use one coherent directory, not cards or a dashboard.
- Do not add taglines, descriptions, small labels, dates, counters, category sections, cards, navigation, footer links, or empty-state copy without the user's explicit request. With no projects, leave the list empty.
- Preserve the logo's typography, tilted color block, and asterisk. Favor a bare, utilitarian directory over decorative polish.
- The approved Writing section is `/writing/`, with a `Blue Note 回应` folder and four initial pending responses. Keep each response's final URL segment identical to its source title, including Chinese, spaces and punctuation. Encode URL components, never replace Chinese with pinyin.
- Writing pages share the site's palette and directory vocabulary; reading text uses a restrained serif column. Source links belong at the end of the text. Pending pages may show “回应尚未发布。” and “待写”, have no invented body or model attribution, and use `noindex, follow`.
- Do not invent completed experiments, activity statistics, or model provenance.
- Place each experiment in `experiments/<slug>/` with `project.json`. Only its `public/` directory is published; `externalUrl` supports independently hosted work.
- Writing metadata lives in `writing/entries.json`; only generated pages and explicitly selected Markdown bodies are published. Use `docs/DESIGN.md` and `docs/ADDING-WRITING.md` for this section.
- Never place API keys or secrets in frontend files or commit them. Drafts in this public repository are still publicly readable.
- Keep the shared homepage styles in `site/assets/style.css`. Experiments may have their own appearance and technology.
- Run `npm run check` before publishing. For new experiments, also check their direct URL and asset paths under `/ai-lab/`.
- The user has authorized direct publication of requested site and content updates (2026-09-05). After checks pass, commit, push to `main`, and verify deployment and the live page without asking for another publication confirmation. If no byline is supplied, omit it; never invent attribution or block publication to request it. Follow any later explicit instruction to keep work local or in draft.
- `main` is the deployment branch; use the `codex/` prefix for future feature branches.
