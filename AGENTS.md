# Story Time Check-in · Mock Interaction

A mock parent–child story session for one direction of the study: read a question, discuss it together, give
feedback at a check-in, then see the originally planned next question beside the one adapted from the feedback.
Repo: github.com/hewittw/sel-feedback-mock · Live: https://feedback-mock.vercel.app (Vercel project `feedback-mock`, team hew2).

## How it works (don't break this)
- **One server-rendered route, `/`, driven by the URL:** `?mode=<id>&step=<1–5>&fb=<feedback text>`. No `step` = home.
  Every step is real HTML from the server, joined by `<Link>`s and GET `<Form>`s (`next/form`), so every step
  loads on its own and survives refresh, Back and shared links, **with or without JavaScript**.
- Never move a step's content into client-only state again. Client code is enhancement only:
  `src/app/interactive.tsx` (the typing sample answer and the discussion timer).
- Content (story, questions, the 5 feedback types) lives in `src/app/scenarios.ts`. Adding a type = adding one object there.

## Hard rules
- Next.js App Router (16.4.x) + plain CSS in `src/app/globals.css`. Read `node_modules/next/dist/docs/` before using an API.
- Static mock: no database, accounts, storage or external APIs. Nothing is saved.
- Style is **Lucid · Patient · Inked** (from the telemetry site): Paper `#F6F2EA` ground, white cards, Ink text,
  Newsreader / IBM Plex Sans / IBM Plex Mono, 3px corners. **Vermilion only on the primary action.**
- Every control has visible hover, focus-visible (2px ink ring), pressed and disabled states.
- Copy is shown to lab members: frame it as the design, never as feedback from a person, and no internal labels.
- Browser checks are Playwright only. Never chrome-devtools MCP or Claude in Chrome (denied in `.claude/settings.json`).

## Before saying anything works
1. `npm run build && npx next start -p 3456`
2. `node scripts/flow.mjs http://localhost:3456`: the whole session in Chromium, WebKit and Firefox × desktop,
   iPhone touch, reduced motion and **JS off**, plus refresh/Back/Forward and all 30 step URLs. It must say "All checks passed".
3. The `verify-ui` skill: `scripts/matrix.mjs` on each step at 11 sizes, then `scripts/contact.py` for a contact sheet. Look at it.
4. Deploy (below), then run `flow.mjs` again against the live URL.

## Deploy
- Commit, `git push`, then deploy from a clean worktree of HEAD so nothing uncommitted ships:
  `git worktree add --detach /tmp/fm-deploy HEAD && cp -R .vercel /tmp/fm-deploy/ && (cd /tmp/fm-deploy && vercel deploy --prod --yes) && git worktree remove --force /tmp/fm-deploy`
- GitHub → Vercel auto-deploy is not connected (needs a GitHub Login Connection in Vercel account settings).
- Vercel SSO protection is off so every deployment URL opens without a Vercel login.

## Keep a trail
- Commit after each meaningful step; the message names the change and the reason.
- Append decisions to `DESIGN_LOG.md` (what we chose, why, what we rejected, where the user pushed back).
