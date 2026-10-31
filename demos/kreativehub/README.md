# KreativeHub: design recreation (demo 5)

A faithful static recreation of **kreativehub.net**, the agency owner's own company site, for the Hiconlab
portfolio. It shows the site as it is built, not a redesign.

- **Brand:** KreativeHub, a UK digital marketing agency (SEO, AI search, data, ecommerce, AI workflows) for medium and enterprise brands. Real company.
- **Brand-name web check:** skipped on purpose. This is a real company recreated with the owner's permission, not a fictional brand.
- **Footer line:** “Design recreation for portfolio purposes.” on both pages.

## Reference

| Page | Live URL | Recreated as |
|---|---|---|
| Homepage | https://kreativehub.net/ | `index.html` |
| SEO service page | https://kreativehub.net/services/seo | `seo.html` |

Viewed on **31 October 2026** with Playwright (Chromium, Windows 11) at 1440×900 and 375×812, read only:
no forms submitted, nothing accepted. The live site showed no cookie banner to decline. Reference
screenshots are kept outside the repo, in the builder's scratchpad.

The two pages link both ways: the nav “Services” link, the homepage SEO card (“Open file”) and the
footer “Services” link go to `seo.html`; the logo and the SEO page breadcrumb “Home” go back. Every other
link (Work, About, Blog, Contact, the audit and apply buttons, the other service cards, the email address)
goes to `#`. There are no forms on these two pages, no third-party scripts, trackers or embeds.

## Art direction (as live)

The site is styled as a design canvas: every section sits in a dashed blue “Frame” with a label tag,
content lives in cards with a beige “file chrome” bar (`svc.seo`, `pra-01`), the hero card is “selected”
with blue resize handles, and there is a pinned yellow sticky note, rotated “APPROVED” stamps and a
canvas-style footer with a zoom control.

- **Palette:** paper `#f2efe7` with a 28px grid, paper-2 `#eae6d9` (card chrome), ink `#0a0a0b`,
  accent blue `#2b6bff`, deep blue `#1e50d6`, sticky yellow `#ffd15a`, coral `#ff6b5a`, white cards.
- **Type:** the system UI font (Segoe UI on Windows, San Francisco on Apple) for everything, bold and tightly
  tracked for headings, with outlined italic accent words; Archivo Black for the stat figures. This is what the
  live site renders, see the notes below.
- **Imagery:** the SEO page's three line illustrations (technical SEO tree, keyword cluster, digital PR
  hub), copied from the live CDN and converted to WebP at 1200 and 640 wide.
- **Motion (as live):** the pulsing dot on the eyebrows, cards lifting 2px on hover, buttons turning ink
  on hover (the arrows stay put: the live CSS slides them 4px, but an inline transform on every arrow cancels it), the FAQ accordion (one open at a time), and the full-screen mobile menu.
  There are no scroll animations on the live site, so there are none here.

The markup and the component CSS were taken from the live pages' own HTML and stylesheet
(`/_next/static/chunks/eb147cbe317524c7.css`), cleaned, kept to the rules these pages use and formatted
for reading. Page heights match the live pages to within the extra footer line (homepage 7,324px
against 7,292px live at 1440 wide; SEO page 9,944px against 9,912px).

## Files

- `index.html`, `seo.html`: the two pages.
- `assets/css/site.css`: tokens, base reset, the live component rules, then the demo's additions at the end.
- `assets/js/app.js`: FAQ accordion, mobile menu (focus trap, Escape, backdrop), and the in-place page swap
  between the two pages (the live Next.js site also navigates without a full reload; here it also lets the
  tour carry on from the homepage to the SEO page in one take). Going forward starts at the top; Back and
  Forward return to the scroll position the page was left at.
- `assets/js/tour.js`: the scripted tour.
- `assets/img/`: `logo.svg`, `favicon.svg` and the three illustrations, all the site's own.
- `assets/fonts/`: Archivo Black (OFL) and `FONTS.md`.

## Tour (about 37 s at 1920×1080)

1. 0–3 s: the settled hero; the cursor drifts in; poster. Caption: “KreativeHub’s own website, recreated as it’s built”. Hover on “Get Your Free Audit”.
2. 4–11 s: scroll to “How we win.”; the SEO card and the AI Workflows card lift. Caption: “Five services, each with a clear next step”.
3. 11–15 s: scroll to “Proof, not pitches.”; hover the tilted booking-platform case. Caption: “Results from real client work, shown up front”.
4. 15–22 s: scroll to the FAQ; open “Do you guarantee rankings?”. Caption: “Straight answers before anyone books a call”.
5. 22–27 s: the FAQ caption clears; click “Services” in the sticky nav and the SEO page swaps in. Caption, over the SEO hero only: “Every service gets its own page in the same style”.
6. 27–37 s: no caption. Scroll to “What our SEO covers.” and hover Technical SEO, then to the technical SEO illustration, held to the end.

Nothing is random, so every take matches.

## Deviations and live-site notes

Places where the recreation differs from the live site, and why:

1. **Markdown asterisks removed.** The live copy shows raw asterisks, for example “Senior-led \*SEO\* that
   compounds”, “\*analytics agency\*”, “\*AI automation agency\*” and the frame label
   “technical-\*seo\*”. They are a content bug (Markdown emphasis that is never rendered), so they are left out.
2. **Mobile overflow fixed.** At 375px the live homepage is 466px wide, because the capabilities list
   (“Search & AI Visibility” rows) cannot shrink; phones zoom the whole page out, and the live mobile
   menu runs off the right edge with its close button and buttons out of view. Here the list shrinks
   (titles wrap) and the menu panel fits the screen.
3. **Contrast nudged to WCAG AA.** Live muted grey `#0a0a0b8c` (4.4:1 on white) is `#0a0a0b99` here
   (about 5:1). Frame labels use the site's own deep blue `#1e50d6` instead of `#2b6bff` (3.9:1 on paper).
   Open slots in the dark “apply” card use `#3d76ff` instead of `#2b6bff` (4.4:1 on ink). The avatar
   initials and “APPROVED” stamps are decoration, so their labels are drawn by CSS.
4. **Small additions for access:** a skip link, a visible focus outline, 44px touch areas behind the
   burger, the menu close button and the footer zoom buttons (same look), and reduced motion stops the
   pulsing dot. The footer zoom control does nothing, as on the live site.
5. **Proof-card blurbs completed.** The live homepage cuts each case summary at a fixed length, mid-word
   (“…by describing the job, not t”, “…Over a year we restructured its”). Here the plumbing card ends with the
   full first sentence from its live case page (“…describing the job, not the part number.”), and the
   booking-platform card keeps only its complete first sentence. The fashion card was already a full sentence.
6. **Footer:** adds the line “Design recreation for portfolio purposes.” The email address is shown but not linked.

Notes for the owner, not changed here because the recreation shows the site as built:

- **The brand fonts are not loading on the live site.** The design specifies Archivo, Archivo Black,
  Newsreader italic and IBM Plex Mono, but `--display`, `--editorial` and `--mono` are defined on `:root`
  from next/font variables that only exist on `<body>`, so they resolve to nothing and the whole site falls
  back to the system font. Only the stat figures reach Archivo Black. The same bug hides the yellow
  highlighter under the “ink-line” words (it also paints behind the body background). The recreation keeps the
  system font so it matches what visitors see today; `assets/fonts/FONTS.md` explains how to switch if the
  live site is fixed.
- Flex gaps put a visible double space before the last word of each FAQ question and inside the
  capability titles (“How long until we see&nbsp;&nbsp;results?”). Kept as live.
- Body copy in the cards is 13–15px on phones, under the 16px the quality bar asks of new builds. Kept as live.
