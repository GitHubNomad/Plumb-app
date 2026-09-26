# Plumb

A daily posture and mobility coach. Short timed sessions for the neck, shoulders, spine and
hips, a morning check-in that picks the session, and a streak that only counts work you
actually held.

**Everything stays on the phone.** Sessions, check-ins and the daily screening answer live in
`localStorage` under `plumb-coach`. There is no account and no server-side data. Progress →
Backup downloads or copies a JSON file, and Restore reads one back after asking first.

Live at **https://plumb.isocline.ai** once deployed.

## Stack

React 19, TanStack Router/Start (SPA mode), Tailwind v4, Vite 8, zustand. It builds to a
static site in `dist/client/` and is served by Cloudflare Workers Static Assets
(`wrangler.jsonc`).

## Run it

Node 22 (`.nvmrc`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :8080 |
| `npm run build` | Static build to `dist/client/` |
| `npm run preview` | Serve the build with wrangler on :8787, the same runtime as production |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, Pixel 7 profile). Needs a build first |
| `npm run check` | Everything above, in the order CI runs it |

## Deploy from a phone

All deploys go through GitHub Actions (`.github/workflows/`), and every one runs the full test
suite first.

- **Merge to `main`**: deploys to production.
- **Open a pull request**: uploads a preview version. The link is in the run summary.
- **Redeploy**: GitHub app → Actions → Deploy → Run workflow (branch `main`).
- **Undo**: GitHub app → Actions → Rollback → Run workflow. Leave the version blank to go back
  one deploy.

One-time setup, done in the browser and never pasted anywhere else:

1. Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template,
   limited to your account and the `isocline.ai` zone.
2. GitHub repo → Settings → Secrets and variables → Actions: add `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`.
3. Optional: Settings → Environments → `production` → require a reviewer, so a deploy waits
   for a tap of approval.

The first deploy creates the `plumb.isocline.ai` DNS record automatically.

## Safety rules in the code

- A daily screening question gates every session. Answering "yes" swaps inversions and
  end-range neck work for gentler steps and shortens holds (`adaptProgram` in
  `src/lib/plumb/catalog.ts`). Change it only with a test.
- A session where every step was skipped is not logged and doesn't move the streak.
- The exercise cues are deliberately conservative. Keep them that way.

## Icons

`node scripts/make-icons.mjs` renders `public/icons/` from the plumb-bob mark.
