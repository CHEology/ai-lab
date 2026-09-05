# ai-lab

An independent public GitHub Pages project for AI-assisted text, code, games, and web experiments.

- This repository is separate from Blue Note. Do not edit or inherit its theme, publishing pipeline, or editorial content.
- Keep the website static and compatible with `https://cheology.github.io/ai-lab/`. Use relative asset URLs.
- Preserve the supplied wording and titles of user-authored works unless asked to edit them.
- Do not invent completed experiments, activity statistics, or model provenance. Empty categories should stay honest.
- Place each experiment in `experiments/<slug>/` with `project.json`. Only its `public/` directory is published; `externalUrl` supports independently hosted work.
- Never place API keys or secrets in frontend files or commit them. Drafts in this public repository are still publicly readable.
- Keep the shared homepage styles in `site/assets/style.css`. Experiments may have their own appearance and technology.
- Run `npm run check` before publishing. For new experiments, also check their direct URL and asset paths under `/ai-lab/`.
- `main` is the deployment branch; use the `codex/` prefix for future feature branches.
