# Story Time Check-in · Mock Interaction

A mock parent–child story session. The family discusses one story question, rates it with a face (😞 😐 😊), the parent elaborates in a sentence, and then sees the originally planned next question next to the one adapted from their feedback.

Five feedback types can be picked on the home page (or linked with `?mode=`): `none`, `positive`, `tangential`, `too-hard`, `too-personal`.

Every step is its own server-rendered URL (`/?mode=tangential&step=4&r=bad`), so steps load on their own, survive refresh and Back, and work without JavaScript.

Built with Next.js; the visual style is the Lucid · Patient · Inked design system (warm paper, ink, vermilion primary action).

```bash
npm install
npm run dev

# checks (Playwright, no project dependency)
npm run build && npx next start -p 3456
node scripts/flow.mjs http://localhost:3456
```

See `AGENTS.md` for how it works, checks and deploys, and `DESIGN_LOG.md` for decisions.
