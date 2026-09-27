# Contributing

Thanks for helping with this project. Short loop: branch, change, PR.

## Setup

```bash
git clone https://github.com/GitHubNomad/Plumb-app.git
cd Plumb-app
npm install
```

Requires **Node.js 22+**.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run build` | Production build |
| `npm run test:e2e` | End-to-end tests (after a build) |
| `npm run check` | Everything CI runs |

## Workflow

1. Create a branch from `main`: `git checkout -b your-name/short-description`
2. Make a focused change (one concern per PR).
3. Run `npm run check` before you push.
4. Open a pull request against `main` and fill in the template.
5. Wait for review; do not push directly to `main`.

## Pull requests

- Describe **what** changed and **why**.
- Link any related issue.
- Keep diffs small when you can. Large refactors should be their own PR.
- Do not commit `.env`, secrets, `node_modules`, or local build output.

## Issues

Use GitHub Issues for bugs and feature ideas. Include:

- What you expected
- What happened
- Steps to reproduce
- Browser / Node version if relevant
