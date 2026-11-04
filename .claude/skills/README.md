# Claude skills for this site

Project-level skills that Claude Code loads automatically when working in this repo
(locally or in cloud sessions). Copied unchanged from their upstream repos on 2026-11-04 (impeccable added the same day).

| Skill | Source | License |
|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) @ ca45fc4 | Apache-2.0 (`frontend-design/LICENSE.txt`) |
| `web-quality-audit`, `performance`, `core-web-vitals`, `accessibility`, `seo`, `best-practices` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) @ afa8da9 | MIT (`LICENSE-web-quality-skills`) |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) @ 5af4319 (v4.8.0, `plugin/skills/impeccable`) | Apache-2.0 (`impeccable/LICENSE`) |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) @ 1a2c79d | MIT |

Note: `web-design-guidelines` fetches its current rule list from
`raw.githubusercontent.com/vercel-labs/web-interface-guidelines` each time it runs.

`impeccable` runs a small engine binary on first use: its launcher downloads it from the
pbakaus/impeccable GitHub releases into `~/.impeccable/`, verified against
`impeccable/scripts/engine-checksums.txt`. Without it, the skill falls back to reading the files directly.

To update a skill, copy the folder again from its upstream repo.
