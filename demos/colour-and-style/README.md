# Colour & Style: design recreation (demo 6)

A faithful, static recreation of the current design of **thecolourandstyle.com**, the website of Anastasiia, a personal stylist and colour consultant in Leeds and a Hiconlab client. The owner has confirmed permission to show it. This is a portfolio piece showing the site as built, not a redesign.

- **Business:** Colour & Style, Leeds, West Yorkshire and online. Colour analysis, wardrobe edits, personal shopping, online capsule wardrobes and colour parties.
- **Audience:** women in Leeds and the surrounding towns who want to feel more confident in what they wear, and who book a one-to-one session.
- **Brand-name web check:** skipped on purpose. This is a real business and a real client, not a fictional brand.
- **Footer line:** "Design recreation for portfolio purposes." (instead of the fictional-brand line).

## References

| Page | Live URL | Viewed |
|---|---|---|
| Homepage | https://thecolourandstyle.com/ | 31 Oct 2026 |
| Inner page (service) | https://thecolourandstyle.com/services/colour-analysis | 31 Oct 2026 |

Viewed read-only with Playwright at 1440px and 375px (full page, desktop Services menu, mobile menu, FAQ, review carousel and card hover). Only "Reject all" was clicked on the cookie banner; no form was submitted. Reference screenshots stay in the builder's scratchpad, not in the repo.

## Art direction (as built on the live site)

The live site is a Next.js + Tailwind build with its own token set (`--cs-*`). The recreation uses the same tokens.

- **Palette:** white `#ffffff` page; cream `#faf6ec` panels; ink `#2a2622` headings; ink-2 `#544e48` body; coral `#f26b5b` (hover `#e0513f`, ink `#b4402f`, tint `#fde7e3`, wash `#fdf0ed`); teal `#3ec6c0` (wash `#eaf8f7`, tint `#ddf5f3`); mint `#6cd397`; sun `#ffd54a` (tint `#fff4c7`); blush `#f4b6c2`; star `#e8a800`.
- **Type:** Playfair Display 500 for display (h1 `clamp(42px, 5.6vw, 66px)`, tracking −0.015em, balanced wrapping), Manrope 400–600 for body (17px lead, 16px body, 14px cards, 12px uppercase eyebrows with 0.08em tracking).
- **Signature details:** the row of rounded colour swatches (coral, teal, mint, sun, blush) above headings and in the footer; the coral ampersand in the hero; one colour bar per service card; pill eyebrows; soft cream and teal panels inset from the page edge with large radii (24–48px); the floating "Excellent · 8 reviews on Google" badge over the hero photo.
- **Imagery:** the site's own photos: Anastasiia at home and with clients, plus the illustrative service images and the service-area map. Copied locally and converted to WebP.
- **Motion:** deliberately quiet, as on the live site. Colour transitions at 200ms on `cubic-bezier(.2,.7,.2,1)`, service cards lift 4px with a soft shadow on hover, the Services menu opens on hover, the review carousel scroll-snaps, the FAQ is a single-open accordion. No scroll reveals (the live site has none).

## Pages

- `index.html`: header with Services menu, hero, My Services (six cards), About my approach, How It Works, testimonials carousel, FAQ, booking form, footer.
- `colour-analysis.html`: the Colour Analysis service page: hero with price, Your Personal Palette Awaits, How It Works, outcome and £150 price card, testimonials, call to action, Where I Work with the area map, booking form, footer.

The two pages link both ways (logo, breadcrumb, Services menu, the Colour Analysis card, footer). Between them the site swaps the page content in place, as the live Next.js site does with client-side navigation; with JavaScript off they are ordinary links. Every other internal link goes to `#`. The booking form validates and shows a success state; nothing is sent.

## Tour (44 s at 1920×1080)

1. 0–1.4 s: the settled hero; poster marked here.
2. "Clients meet Anastasiia and her colours straight away": the cursor glides over the hero and rests on Explore Services.
3. "Every service explained, with a clear next step": scroll to My Services, the Colour Analysis card lifts on hover, then About my approach and How It Works.
4. "Real Google reviews build trust before booking": the review carousel steps forward twice; an FAQ answer opens.
5. Caption cleared; back to the top, Services menu, Colour Analysis: the service page swaps in.
6. "Each service has its own page, price and process": the palette cards, then the £150 price card.
7. "Booking requests arrive with the service chosen": the price card's button scrolls to the form, the visitor types Rachel Hughes, 07700 900461 (an Ofcom drama number) and rachel@example.co.uk, picks Thursday 12 November, presses Book, and the success panel (with "Colour Analysis" and "Thu 12 Nov") holds; the caption clears so the footer's recreation line shows in the end frame.

## Deviations from the live site, and why

- **Button text colour.** The live coral buttons use white text at a 2.98:1 contrast ratio, which fails WCAG AA and the demo checker. Here the text on coral fills is ink `#2a2622` (5.03:1) and the coral fill is unchanged. The live hover fill `#e0513f` would only give 3.87:1 with ink, so hover is `#b4402f` with white text (5.65:1). Both are tokens in `site.css` (`--on-coral`, `--hover-fill`).
- **Two small contrast fixes.** `muted` text is `#716a5e` instead of `#7a7266` (the live value is 4.26–4.39:1 on cream), and teal ink is `#1b716c` instead of `#1f7c77` (4.37:1 on its tint). The difference is barely visible.
- **Reviewers.** The reviews are the real Google reviews shown on the site, but reviewers appear as first name and initial with a letter avatar instead of full names and Google profile photos. Those are third parties' personal data.
- **No cookie banner, consent tool, Google Tag Manager, Cloudflare Turnstile or Google links.** The demo has no third-party scripts, so there is nothing to consent to. The empty Turnstile space above the Book button is removed, so the button sits a little higher than on the live form. "Cookie settings" in the footer is a plain `#` link.
- **Success state.** The live form posts to the server, and its success message could not be seen without submitting. The panel here reuses the site's own words ("I'll get back to you to book an appointment"), keeps the form's height so the page does not jump, and shows the chosen service and date.
- **Social links** show "IG" and "FB" as on the site and link to `#`.
- **Fonts** are the same families (Playfair Display, Manrope, both OFL) from Fontsource instead of next/font, so rendering is identical in practice. See `assets/fonts/FONTS.md`.
- **Mobile menu** uses small inline SVG icons for the burger and close buttons instead of the ☰ and ✕ glyphs, so they render the same on every platform.
- **Phone text sizes.** Below 480px, card and FAQ copy is 16px instead of the live 14–15px, to meet the 16px minimum for body copy on phones.
- **Services menu.** It opens on hover as on the live site; a click straight after hovering keeps it open (live, that click closes it again).
- **Back and Forward** restore each page's scroll position (the swap stores it in `history.state`).
- **Video size** is about 8.7 MB at the recorder's default quality, slightly over the 8 MB ideal, because of the full-width photography scrolling past.
