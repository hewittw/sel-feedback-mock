# Design Log · Story Time Check-in

What we chose, why, what we rejected, and what was reported broken. Newest at the bottom.

---

## 2026-10-28 · The mock
- **Goal:** a clickable mock of one direction for the study. A parent and child read a story question, discuss
  it, give feedback at a check-in, and see how the next question adapts to that feedback.
- **Flow:** home (one big "Start interaction" + a feedback-type picker) → Question 1 → Talk it over (prompts + timer)
  → Check-in (feedback box, sample answer typed in) → Question 2 (originally planned above, adapted below, with the
  rule applied and how the feedback was read) → Done.
- **Feedback types (5):** none (question unchanged), good (same theme, one step deeper), bad · tangential (back to
  the story's core feeling), bad · too hard (shorter, concrete choices), bad · too personal (ask about Bob, not the child).
- **Style:** Lucid · Patient · Inked, the system picked for the telemetry site: Paper ground with grain, white
  cards, Newsreader + IBM Plex, vermilion only on the primary action. Menu above each card (Home, type, progress,
  Restart); Back / Next below it.
- **Security:** Next.js 16.4.0 carries critical advisories (RCE in image optimisation and `use cache`), so we pinned 16.4.3 (0 vulnerabilities).

## 2026-10-28 · Reported: "none of the pages beside the home screen load"
- **Root cause.** Every step after home lived only in client-side React state. The server sent only the home
  screen, so if the JS bundle hadn't loaded yet, was blocked, or failed in that browser, "Start interaction" did
  nothing and no other page could load. Reproduced in Chromium, WebKit and Firefox with JavaScript off: home
  renders, Start does nothing. The first fix (step in the URL via `history.pushState`) still needed JS for every step.
- **Fix.** One server-rendered route driven by the URL (`?mode=&step=&fb=`). Steps are joined by `<Link>`s and GET
  `<Form>`s, which work as plain links and forms without JS and as client-side navigation with it. Client code is
  only enhancement: the typing sample answer (only after an in-app click; on a page load the answer is already in
  the box) and the timer. The picker became a native radio group (selection via `:has`, with the radio itself as the fallback).
- **Rejected:** keeping client state and adding a "loading…" fallback (still breaks without JS); 25 static
  `/[mode]/[step]` pages (the typed feedback still has to travel to step 4, and it would break the `?mode=` links already shared).
- **Process adopted from the Design, Build, Ship repos:** AGENTS.md, a `verify-ui` skill, `scripts/matrix.mjs`
  (11 sizes, touch on phones), a new `scripts/flow.mjs` (the whole session × 3 engines × desktop / iPhone touch /
  reduced motion / JS off, refresh/Back/Forward, all 30 step URLs), a contact sheet, chrome-devtools denied,
  `vercel.json` pins the framework, deploy from a clean worktree. Vercel SSO protection stays on for per-deploy URLs, so only the main URL is shared.
- **Test-harness note:** Playwright's Firefox `reload()` with JS off adds a history entry (2 → 3) that a real reload
  doesn't, so `flow.mjs` refreshes after checking Back/Forward.

## 2026-10-28 · Review of the live site: two cuts, one addition
- **Cut: the strikethrough** on the originally planned question. It stays muted (Pencil on Paper) above the new
  question, which carries the ink edge; the strike made it hard to read.
- **Cut, for now: the "Talk it over" card** (discussion prompts + timer). The session is 4 steps: Question 1 →
  Check-in → Question 2 → Done. The question card now says "Read it out loud, then talk it over together" and its
  button is "Done talking →". The card is in git history (commit 55085b3) if it comes back.
- **Added: a pending hairline** on buttons (`useLinkStatus` for links, `useFormStatus` for the GET forms), shown only
  if a step takes over 150ms to arrive. Measured live: most clicks 90–210ms, one 804ms outlier, long enough to look broken.
- **Caught by looking at the contact sheet (not by the numbers):** the pending bar's `overflow: hidden` let flex buttons
  shrink below their label, so "Try another feedback type →" was cut off on phones. Removed it. Two blind spots in
  `matrix.mjs` were fixed with it: it now flags text clipped inside its own box, and it measures overflow against the
  real screen width (with mobile emulation a too-wide page zooms out, so `innerWidth` grew to fit and hid a 49px
  overflow on the Done buttons and a 17px one on the menu at 320). On phones the nav row now wraps and the menu buttons are tighter.
