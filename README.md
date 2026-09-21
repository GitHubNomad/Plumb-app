# Grok App

React web app workspace (TanStack Start + Tailwind) shared so other developers can collaborate on GitHub.

**Repo:** [github.com/GitHubNomad/grok-app](https://github.com/GitHubNomad/grok-app)

## Stack

- React 19
- TanStack Start / Router / Query
- Tailwind CSS v4
- Vite 8
- TypeScript (strict)
- Optional Postgres (Kysely) and Better Auth — off unless you wire them in

## Getting started

Requires **Node.js 22+**.

```bash
git clone https://github.com/GitHubNomad/grok-app.git
cd grok-app
npm install
npm run dev
```

Then open the URL Vite prints (default port **8080**).

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 8080 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run format` | Prettier |

## Project layout

```
src/            App source (routes, components, lib)
server/         Server middleware
scripts/        Dev, migrate, and build helpers
migrations/     SQL migrations (auth schema lives here)
public/         Static assets
```

App UI lives under `src/routes/` once those files are added. Shared helpers are in `src/lib/`.

## Collaborating

This repo is **private**. To add a teammate:

1. Open [github.com/GitHubNomad/grok-app/settings/access](https://github.com/GitHubNomad/grok-app/settings/access)
2. **Invite a collaborator** and grant **Write** (or **Triage** if they only need issues)
3. They clone the repo and work on a feature branch
4. Open a pull request into `main` — see [CONTRIBUTING.md](CONTRIBUTING.md)

Do not commit secrets. Copy `.env.example` if one is added later; never commit a real `.env`.

## License

[MIT](LICENSE)
