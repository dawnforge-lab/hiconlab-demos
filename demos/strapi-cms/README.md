# Headless CMS publishing: Cowl & Brush, Ludlow

Demo 11. An interactive showcase of how Hiconlab builds a small business site on a headless CMS: a Strapi 5-style editor on the left, the client's live Next.js site on the right, and the publish path drawn between them.

## The client
**Cowl & Brush** sweeps chimneys and fits wood burners around Ludlow, south Shropshire. Rhian Pryce and her brother Tom started it in 2015; Rhian runs the website herself in the CMS that Hiconlab set up, so a seasonal notice or a new FAQ never waits for a developer.

- Fictional domain, kept on `example.co.uk` so it can never be a real registrable address: `www.cowlandbrush.example.co.uk`, CMS at `cms.cowlandbrush.example.co.uk`, media at `media.cowlandbrush.example.co.uk`. Only the footer email is a link (mailto).
- Phone 01632 960418 (Ofcom drama range). Address: Unit 3, Corve Mill Yard, Ludlow SY8 2PG (plausible, not real).
- Name check: searched "Cowl & Brush" chimney sweep Ludlow and "Cowl and Brush" chimney sweep on 31 Oct. No business of that name in that trade came up.

## Audience
Two readers at once. A small-business owner should see "I can change my own site and it goes live by itself". A developer who knows Strapi and Next.js should recognise the real wiring: dynamic-zone blocks, the SEO component and its limits, Draft & Publish, Draft Mode preview, the `website revalidate` webhook, the `/api/revalidate` route, cache tags and `revalidateTag(tag, "max")`.

## Art direction: "signal room"
The demo is three surfaces with three characters, held together by one dark stage.

| Surface | Character |
|---|---|
| Stage (the frame, the publish path) | A dark graphite control desk. One signal green carries everything that is live; amber means stale. Mono labels, real numbers, nothing decorative. |
| The CMS | Neutral and Strapi-like in layout (icon rail, content-manager list, edit view, Entry panel), with its own cobalt accent, no Strapi logo or wordmark. Called "the CMS". |
| Cowl & Brush site | Limewash and soot, brick-red buttons, an enamel-sign status label, chimney stacks drawn as a skyline divider. Warm, local, practical. |

Palette:

| Token | Hex | Use |
|---|---|---|
| Stage | `#111318` | page background |
| Stage 2 / 3 | `#181B22` / `#20242D` | publish-path panels, raised cards |
| Stage line | `#2B303B` | hairlines, idle wire |
| Stage ink / muted | `#E8EAEE` / `#9AA1AE` | text on the stage |
| Signal | `#59E3A0` | live path, passed checks, fresh cache |
| Amber | `#F4B740` | stale cache, waiting |
| CMS bg / panel / line | `#F4F5F8` / `#FFFFFF` / `#E2E4EA` | admin surfaces |
| CMS ink / ink 2 | `#1E2130` / `#555C70` | admin text |
| CMS cobalt | `#2F55D4` | admin primary (Publish, focus, active nav) |
| Status: Published / Modified / Draft | `#1E7F4F` / `#A15C00` / `#3D55A8` | entry status badges |
| Site limewash / paper | `#F2EDE4` / `#FBF8F2` | client site background, cards |
| Site soot | `#1F1B18` | text, dark bands |
| Site brick | `#9F3B26` | buttons, accent heading line |
| Site brass | `#A8823F` | rules, enamel-sign border |
| Site slate / ash | `#3C4954` / `#6B635B` | secondary bands, muted text |

Type:
- Stage and CMS: **Public Sans** (variable), a plain civic sans that suits admin UI.
- Code, payloads, timings: **Martian Mono** (variable), wide and technical.
- Client site: **Young Serif** for headings (old shop-sign warmth), **Albert Sans** (variable) for body.

Signature details:
1. **The signal wire.** Publish sends a pulse along one green line through five stations (Publish, webhook, `/api/revalidate`, `revalidateTag`, next visitors). Each station stamps its real timing as the pulse passes.
2. **The cache chip.** The site's browser bar says what the server did for each request: `Cache HIT · fresh`, `Cache HIT · stale, refreshing`, or `Draft Mode · not cached`.
3. **On the client site:** an enamel-sign status label (double brass rule) and a row of chimney stacks drawn in SVG as the divider before the footer.

Imagery: four documentary photos, one look: Shropshire cottages in soft grey late-October daylight, 35 mm, muted natural grade with light grain, no people (so no hands or faces to go wrong). Generated with `fal-ai/flux-2-pro` at 1536×1024, cropped and exported to WebP. Originals kept outside the repo.

| File | Prompt (abridged) |
|---|---|
| `hero` | lit cast-iron wood burner in a limewashed stone inglenook, slate hearth, log basket, leather armchair edge, grey October window light mixing with firelight |
| `sweeping` | sweep's brush, rods and soot bag on a dust sheet before a sealed Victorian cast-iron fireplace |
| `stoves` | newly fitted matt black stove on a slate hearth in a red-brick recess, tool bag and spirit level on a dust sheet |
| `cowls` | old terracotta chimney pots, one with a new stainless bird-guard cowl, slate roofs and a church tower behind |

fal spend: 5 images at about $0.047 each (1.57 MP × $0.03/MP), about **$0.24**. One sweeping image was replaced because the vacuum carried a fake brand name.

## How it maps to the real setup
Read from Hiconlab's own site (`D:\Hiconlab`, Next.js 16 + Strapi 5), see `docs/sources/hiconlab-strapi.md`.
- **Home page** is a single type with Draft & Publish: `title` (≤90), `hero` (`shared.hero`), `sections` (dynamic zone of the 12 real blocks), `seo` (`shared.seo`). The client's hero uses a photo where Hiconlab's own uses a code-drawn figure.
- Field limits are the real ones (hero heading 120, status label 80, FAQ question 200, CTA heading 90, link labels 40 and so on). Three option lists are this client's own rather than Hiconlab's: the feature-point icons, `cta.form` (no `site-review`) and `portfolio-grid.kind` (job types). SEO: `metaTitle` ≤60 and required, `metaDescription` 50–160 and required, `canonicalUrl` must start `https://`, `noIndex`, `ogImage`, `structuredData` (JSON-LD is generated in code).
- **Save** keeps a draft (Strapi 5 keeps draft and published versions) and fires `entry.update`; **Publish** validates everything and fires `entry.publish`.
- **Preview** opens `/api/draft?url=/&secret=••••••&status=draft`, which turns on Next.js Draft Mode, redirects to `/` and shows the "Preview · showing drafts" bar. Draft Mode skips the cache. Saving while the preview is open refreshes it (the real site listens for `strapiUpdate`).
- **Webhook** `website revalidate` posts the event to `https://www.cowlandbrush.example.co.uk/api/revalidate` with `Authorization: Bearer ••••••`.
- **Route** checks the secret in constant time (else 401), validates the payload with zod (else 400) and maps it to tags: `[model]`, plus `model:slug` when the entry has a slug, plus `sitemap` for routable types on publish, unpublish or delete. The home page is a single type with no slug and no URL of its own in that list, so it maps to `home-page` alone; the panel shows what a Page with a slug would add (`page:<slug>`, `sitemap`).
- **revalidateTag(tag, "max")** marks the tag stale. Next.js serves the next request from the stale copy while it refetches in the background, and every request after that gets the fresh page. The demo shows that honestly: the first visit after publishing is a stale hit that starts the refresh, the second is fresh.
- Timings are typical for this setup (Railway, Strapi 5, Next.js 16), labelled as such, and the animation is slowed down so a person can follow it.

## Screens
One page (`index.html`) with three regions, plus the client site as its own page (`site.html`, shown in the right-hand pane and openable on its own).
1. **CMS edit view** for Home page: hero fields, the dynamic zone (reorder by dragging the handle or with the keyboard, expand to edit, add from the block picker, duplicate, delete), the SEO component with counters and a search-result preview, and the Entry panel (Save, Publish, Preview, Draft/Published tabs, status badge, history).
2. **Live site** in a browser frame with tabs (visitor tab, preview tab), reload, and the cache chip.
3. **Publish path** strip: five stations, payload, the tag mapping and the route code on demand.
At 375px the three regions become tabs: Editor, Website, Publish path.

## Tour (about 38 s, recorded at 1536×864)
| Time | Beat |
|---|---|
| 0–1.5 s | Calm first frame: CMS on Home page (Published), the live site, the publish path idle |
| 1.5 s | Caption: "Rhian edits her own page in plain fields" |
| 2–5 s | Replaces the hero status label with "Now booking November sweeps"; the counter ticks |
| 6–9 s | Drags the FAQ block above "How a sweep goes" |
| 9 s | Caption: "See how the page will look in Google" |
| 10–14 s | Adds "Now booking November." to the meta description (158 / 50–160); the search preview follows; Save → Modified, `entry.update` noted |
| 15 s | Caption: "Check the draft on the real site first" |
| 15–19 s | Open preview: `/api/draft?…&secret=••••••&status=draft`, then `/` in Draft Mode with the preview bar |
| 19 s | Caption (top): "Publish, and the live site updates itself" |
| 19–27 s | Publish → pulse through webhook, route checks, tag `home-page`, `revalidateTag`; webhook closes with `200 {"revalidated":["home-page"]}` |
| 27 s | Caption: "Visitors see the change seconds later, no rebuild" |
| 27–34 s | Visitor tab, reload: stale hit starts the refresh; reload again: fresh page with the new label (poster) |
| 34–38 s | Held final state |
