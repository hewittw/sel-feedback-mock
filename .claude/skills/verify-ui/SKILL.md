---
name: verify-ui
description: Check the mock interaction in real browsers and report what's broken, with screenshots as evidence. Use after changing any step, style, copy or interaction, before saying UI work is done or deploying, or when asked to check, test, screenshot or review the site.
---

# Verify UI in real browsers

1. Build and serve production, not dev: `npm run build && npx next start -p 3456`.
2. **Flow first.** `node scripts/flow.mjs http://localhost:3456` runs the whole session in Chromium, WebKit and
   Firefox × desktop / iPhone touch / reduced motion / JavaScript off, then refresh, Back, Forward, and all 25
   URLs (5 types × home + 4 steps). Anything but "All checks passed" is a bug. (The site once loaded only its home screen whenever client JS
   didn't run. This check exists so that never ships again.)
3. **Every size.** For each screen (home, then `step=1`…`4`):
   `node scripts/matrix.mjs "http://localhost:3456/?mode=tangential&step=N" screenshots/sN` (home is `s0`, no step).
   That is phones 320/375/390/430 (touch), 844×390 landscape, iPad 768/1024, 1280/1440/1920/2560. It prints overflow,
   console errors, broken images and text under 10px per size.
4. **Look.** `python3 scripts/contact.py screenshots/s screenshots/contact-phones.jpg 320-small-phone 390-iphone 844x390-phone-landscape`
   (and a large-size sheet) and actually view it. Check the feedback types too: `none` must say the question stays the same.
5. Tab through each step: a focus ring must be visible on every control; check hover and pressed.
6. Report **evidence, not claims**: what's broken, with screenshot paths. Don't rate your own work generously.
   Judgment calls (copy, style fit) go to the user, not decided here.
7. After deploying, run step 2 again against https://feedback-mock.vercel.app.
