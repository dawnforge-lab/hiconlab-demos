# Brief for builder and critic agents

## Context
Hiconlab is a UK agency that builds websites, ecommerce, SEO/AEO/GEO, AI workflows and AI enablement for small businesses. This repo (`D:\Hiconlab-demos`) holds its portfolio demos: interactive HTML/JS showcases, each with its own fictional UK brand, plus a 20–45 s video recorded from each one with a scripted cursor. They will be embedded on the Hiconlab portfolio as a video, with a "try it" link where interaction makes sense. They are showcases only: no live AI, no backend, no links to real websites, fictional data.

The owner cares about quality over speed. There is no deadline. A demo that looks like a template, or like "an AI made this", is a failure even if it works.

## Read first
1. `QUALITY_BAR.md`: what you are judged against.
2. `docs/BUILDING.md`: folder layout, fonts, libraries, images, tour API, checks.
3. Your source brief in `docs/sources/` if your brief names one.
4. Invoke the `frontend-design` skill (Skill tool) before you design anything, and follow it.

## Rules
- Work only inside your own `demos/<id>/` folder (and your scratchpad for originals and temporary files). Do not edit `shared/`, `tools/`, `vendor.json`, `package.json`, `demos/demos.json`, other demos, or anything outside this repo. Never modify the source projects you were pointed at: read only.
- Do not commit, push or create remotes. The lead commits after approval.
- Never put secrets or real personal data anywhere.
- Fictional brand names: before settling on one, search the web for the name plus its town and trade. If a real business of that name in that trade comes up, pick another. Note the check in your README.
- Copy: plain, friendly, human UK English, the way the business would talk to its own customers. No marketing filler.
- fal.ai: check pricing before generating, stay within your budget, report the spend. Inspect every image for artefacts before using it.
- If you are blocked on a decision that changes the outcome, say so in your report rather than guessing.

## Builder process
1. Read, then write `demos/<id>/README.md` first: brand (name, town, story in two lines), audience, art direction (palette with hex values, type pairing, signature details, imagery look), the screens/pages, and the tour story beat by beat with rough timings.
2. Build it. Keep files readable: one CSS file, a data file, an app file, a tour file is a good default.
3. Run `npm run check -- <id> --tour` and look at every screenshot in `.checks/<id>/` yourself (Read the PNGs). Fix everything the checker fails and everything that looks off. Repeat until it is clean and you would be proud to show it.
4. Run `npm run record -- <id>` (add `--headed` for WebGL if headless frames stutter), and look at a few frames from `media/<id>.mp4` (for example `ffmpeg -ss 12 -i media/<id>.mp4 -frames:v 1 frame.png` into your scratchpad) to confirm the video looks right.
5. Report back in under 300 words: what you built, brand and art direction in one line each, pages, the tour story and its length, fal spend, anything you were unsure about, and the title/summary/pages to put in `demos/demos.json`.

When a critic's findings are sent to you, fix every must-fix item, rerun the checks and the recording, and report what changed.

## Critic process
You are a separate, harsh reviewer. You did not build this. Judge it against `QUALITY_BAR.md`, as a senior designer at a top studio and as the small-business owner the demo is aimed at.
1. Run `npm run check -- <id> --tour`. Read every screenshot in `.checks/<id>/`.
2. Use the demo yourself through Playwright (write a short script in your scratchpad, run it with node from the repo root): click through the main flows at 1440px and 375px, use the keyboard, try typing your own input where there is a text box. Take extra screenshots where something looks wrong.
3. Look at `media/<id>.mp4` frames at roughly 0 s, 25%, 50%, 75% and the end, and the poster.
4. Read the copy. Check numbers add up (VAT, totals, dates).
5. Report: verdict PASS or FAIL, then a numbered list of must-fix items (each concrete: where, what is wrong, what good looks like), then a short list of nice-to-haves. Do not fix anything yourself. PASS only if you would put it in front of a paying client today.
