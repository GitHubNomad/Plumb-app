# Plumb

A daily alignment coach. Short mobility sessions, a timer, a check-in, and a streak — no gym required.

**Repo:** [github.com/GitHubNomad/Plumb-app](https://github.com/GitHubNomad/Plumb-app)

## What it does

- **Today** — recommended session, weekly strip, streak
- **Library** — six guided sessions (4–11 minutes)
- **Session player** — holds, reps, pause, skip, complete
- **Coach** — tight / stacked / easy check-in plus a hotspot, then a pointed session
- **Progress** — streak, time, recent sessions (saved on this device)

Plumb is mobility coaching, not medical advice.

## Stack

React 19, TanStack Start / Router, Tailwind CSS v4, Zustand, Vite 8, TypeScript.

Progress lives in `localStorage` (`plumb-coach`). No account required.

## Getting started

Requires **Node.js 22+**.

```bash
git clone https://github.com/GitHubNomad/Plumb-app.git
cd Plumb-app
npm install
npm run dev
```

Then open the URL Vite prints (default port **8080**).

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

## Collaborating

1. Open [Collaborators](https://github.com/GitHubNomad/Plumb-app/settings/access)
2. Invite with **Write**
3. Branch from `main`, open a pull request — see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
