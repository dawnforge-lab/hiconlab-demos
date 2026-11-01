# Quality bar

Every demo must pass this before it is approved. Builders work to it; critics judge against it. Parts A–C are checked by `npm run check -- <id> --tour`. Parts D–G need a human (or a critic agent) looking at the screenshots and the running demo.

This is version 2, adjusted after the user reviewed the pilot round: tours now carry captions, and demo 1 is a search, not a chat (see F).

## A. Self-contained and safe
- [ ] Opens with no network access beyond the local static server: no CDN, no Google Fonts, no analytics, no embeds, no remote images. Libraries and fonts are vendored and pinned (`vendor.json`, `npm run vendor`).
- [ ] No links to real websites. Every `href` is relative, `#`, `mailto:`/`tel:` with fictional details, or a page inside the demo. No real phone numbers, emails or addresses for fictional brands: use Ofcom drama numbers (for example 01632 960xxx, 020 7946 0xxx, 0113 496 0xxx, 07700 900xxx) and `example.co.uk`-style addresses.
- [ ] All data is fictional. Fictional people, businesses and reviews are clearly part of a demo (the index and the demo footer say "A Hiconlab demo. All businesses, people and data are fictional."). The two real-company recreations (5 and 6) say "Design recreation for portfolio purposes" instead.
- [ ] The brand name was searched on the web together with its town, and no real business of that name in that trade came up.
- [ ] No console errors, no missing files.

## B. Works everywhere
- [ ] Responsive from 375px to 1920px. No horizontal scroll at any width. Tap targets at least 44px on touch. Text at least 16px for body copy on phones.
- [ ] Respects `prefers-reduced-motion`: no looping or large movement, scroll scenes become simple fades or static states, the 3D scenes stop auto-rotating. The demo stays fully usable.
- [ ] Keyboard usable: every interactive element is reachable and has a visible focus style. Dialogs trap focus and close on Escape.
- [ ] Accessible basics: `lang="en-GB"`, one `h1`, logical headings, labels on every form field, alt text (or `alt=""` for decoration), WCAG AA contrast, live regions for chat and streamed text. No serious or critical axe issues.
- [ ] Works when served from any static server under any sub-path (all URLs relative).

## C. Tour and recording
- [ ] `?tour=1` plays a scripted story with the shared tour engine; the demo works normally without it, and a real click or key press during `?tour=1` hands control to the viewer.
- [ ] The story is 20–45 seconds, has a clear beginning (settled first frame), middle (the one or two moments that sell the service) and end (a resolved state held for at least 1.5 seconds).
- [ ] Poster frame marked with `t.poster()` on the most telling moment, not the first frame. It must read as a thumbnail: a website's poster is a full, designed screen (usually the hero), not a modal or form over a dimmed page.
- [ ] The tour is deterministic: in tour mode the demo pins its own "today" (a sensible weekday and time), slots, references and random choices, so every recording matches. The live clock is fine outside tour mode. Avoid showing a year where it would date the video.
- [ ] Captions (agreed by the user after the pilots): 3–5 per tour with `t.caption()`, so a viewer with the sound off knows what they are watching and why it matters. Each one is a short plain-English line (about 4–9 words, under 60 characters, sentence case, no full stop), says what the business or customer gets rather than naming UI ("Customers describe the job in their own words", not "The search box has autocomplete"), stays up long enough to read twice (2.5 s or more), and never covers the action: use `{ place: 'top' }` when the action is at the bottom. The first caption appears after the calm first frame, the last one is cleared or still readable in the held final state, and no caption is in the poster (the engine hides it).
- [ ] The tour finishes with `done` in `npm run check -- <id> --tour`.
- [ ] Hover styles are written as `:hover, .is-tour-hover` so they show in the recording.
- [ ] Nothing in the recording moves faster than a person could follow. Typing looks human. The cursor never jumps.

## D. Design: distinctive, not generic
Use the frontend-design skill. The test: could this pass as the real product or site of a well-funded UK business, designed by a good studio?
- [ ] A clear, specific art direction suited to the brand and its customers, written down in the demo's README (palette, type pairing, one or two signature details). Not "dark mode with a purple gradient", not a default Tailwind look, not interchangeable with any other demo in this set.
- [ ] Typography is deliberate: a considered pairing, a real type scale, good line lengths (45–75 characters), proper UK punctuation (curly quotes, en dashes in ranges).
- [ ] Layout has rhythm and hierarchy; not a stack of identical centred cards. Generous but intentional spacing.
- [ ] Imagery fits the brand and looks real (fal-generated photos art-directed to one consistent look, or carefully made illustration). No obvious AI artefacts: check hands, teeth, text in images, warped objects. No stock-photo clichés.
- [ ] Icons from one consistent set (inline SVG), never emoji used as icons.
- [ ] Micro-interactions feel finished: hover, focus, pressed, loading, empty and success states exist where a real product would have them.

## E. Believable content
- [ ] Plain, friendly, human UK English. No lorem ipsum, no "Lorem", no "Acme", no "John Doe". No marketing filler ("unlock", "elevate", "seamless", "cutting-edge", "in today's fast-paced world").
- [ ] Data is internally consistent: totals add up, VAT is 20%, dates and times line up, UK formats (£1,234.50, 31 Oct 2026, 09:30, postcodes, number plates).
- [ ] Copy reads like the business wrote it for its own customers.

## F. Kind-specific
- **SaaS (3, 4):** a dashboard plus one or two complete flows with real state changes (items move, totals update, statuses change). Modern, clean and calm, the way a well-made SaaS product looks today: neutral surfaces, one restrained accent, quiet type, generous white space, few competing panels, badges and colours. No themed or decorative concept (the user rejected "signwritten van" and "workshop floor" looks as cluttered and too AI-designed). A clear primary action per screen. Works at 375px as a usable mobile layout, not just a squeezed desktop.
- **Conversational search (1):** a search, not a chat: no bubbles, typing indicator, streamed prose or assistant persona. A plain-English query is read into editable "understood as" chips, the narrowing from the whole catalogue to the matches is shown, and the grid ranks products with a one-line reason each, plus close misses with what they miss. Typing more or editing a chip re-ranks smoothly. Any query you type gets a sensible reading or an honest one, never a dead end. See `docs/sources/conversational-search.md`.
- **AI chat assistant (2):** the scripted replies stream token by token at a believable pace with a typing indicator first. Answers contain specific, correct-looking detail. Product cards, follow-up chips and confirmations behave. Typing your own question gets a sensible scripted reply (matched by keywords) or an honest fallback, never a dead end.
- **Websites (7–10, 14):** homepage plus one inner page, linked both ways. Real navigation (with a mobile menu), a working booking or enquiry flow with a success state (no real submission), local-business details in the footer.
- **Recreations (5, 6):** match the current live design faithfully (layout, type, colour, imagery) from screenshots taken for reference; local copies of any assets; no live links.
- **CMS (11):** tells Hiconlab's real setup accurately (see `docs/sources/hiconlab-strapi.md`): dynamic-zone blocks, SEO fields, Draft & Publish, webhook → revalidate route → cache tags → live site.
- **3D (12, 13):** at least three scroll-driven moments (for example rotate, exploded view, colour or variant change). Holds 60 fps on a normal laptop, loads under 5 MB of 3D assets, shows a styled loading state, and has a static fallback if WebGL is unavailable.

## G. Video
- [ ] 1920×1080 H.264 MP4 at 30 fps, 20–45 s, ideally under 8 MB, no audio (music only if explicitly agreed), plus a poster in JPG and WebP.
- [ ] Sharp text, smooth motion, no dropped frames in scroll or 3D scenes, no browser chrome, no scrollbars.
