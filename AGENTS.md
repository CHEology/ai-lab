# ai-lab

An independent public GitHub Pages project for AI-assisted text, code, games, and web experiments.

- This repository is separate from Blue Note. Do not edit or inherit its theme, publishing pipeline, or editorial content.
- Keep the website static and compatible with `https://cheology.github.io/ai-lab/`. Use relative asset URLs.
- Preserve the supplied wording and titles of user-authored works unless asked to edit them.
- Keep the homepage to the existing large ai-lab logo and one plain list of project-title links, using the blue accent in `site/assets/style.css` and a neutral gray background.
- Do not add taglines, descriptions, small labels, dates, counters, category sections, cards, navigation, footer links, or empty-state copy without the user's explicit request. With no projects, leave the list empty.
- Preserve the logo's typography, tilted color block, and asterisk. Favor a bare, utilitarian directory over decorative polish.
- Do not invent completed experiments, activity statistics, or model provenance.
- Place each experiment in `experiments/<slug>/` with `project.json`. Only its `public/` directory is published; `externalUrl` supports independently hosted work.
- Never place API keys or secrets in frontend files or commit them. Drafts in this public repository are still publicly readable.
- Keep the shared homepage styles in `site/assets/style.css`. Experiments may have their own appearance and technology.
- Run `npm run check` before publishing. For new experiments, also check their direct URL and asset paths under `/ai-lab/`.
- `main` is the deployment branch; use the `codex/` prefix for future feature branches.
