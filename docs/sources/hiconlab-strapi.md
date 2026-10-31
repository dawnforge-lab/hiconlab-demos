# Source brief: Hiconlab's Strapi setup

Read-only study of `D:\Hiconlab` (Next.js 16 frontend, Strapi 5 backend on Railway). Demo 11 (headless CMS) must tell this setup accurately. Never modify `D:\Hiconlab`.

## Page builder
- `page` collection type, `draftAndPublish: true`: `title` (≤90), `slug` (uid), `hero` (`shared.hero`), `sections` (dynamic zone), `seo` (`shared.seo`).
- `home-page` single type has the fullest zone (12 blocks). Best one to show.
- Blocks (most share optional `label` ≤60 and `anchorId`; `width` full|half on some):
  - cta: heading (≤90), text (≤240), form none|site-review|enquiry, primaryLink, secondaryLink
  - faq: heading, items 1–20 (question ≤200, answer ≤1200; feeds FAQPage structured data)
  - feature-points: heading, points 1–6 (icon enum, title, description)
  - included-items: heading, intro, items 2–12 (number, title, description)
  - key-facts: facts 2–6 (label, value, note)
  - latest-articles: heading, limit 1–12 (default 3), category
  - notes: heading, notes 1–6 (text ≤400)
  - portfolio-grid: heading, intro, kind all|demo|client, limit, projects
  - process: heading, intro, steps 2–6 (rev, when, title, text, current)
  - rich-text: heading, body (Strapi blocks rich text)
  - services-grid: heading, intro, services
  - targets: heading, rows 1–8 (label, value)
- `shared.hero`: statusLabel, heading (the page's only h1), headingAccent, lead, facts ≤4, links, figure.
- Frontend `BlockRenderer.tsx` switches on `__component` (for example `blocks.faq`).

## SEO component (`shared.seo`)
metaTitle (≤60, required), metaDescription (50–160, required), canonicalUrl (https), noIndex (default false), ogImage, structuredData (JSON; JSON-LD is actually generated in code). OG image falls back to the entry cover, then the site default, then a generated `/og` image.

## Publish → webhook → revalidation (the story to tell)
1. Editor clicks Publish in Strapi (Draft & Publish; Strapi 5 keeps draft and published versions).
2. Strapi fires the `website revalidate` webhook (set up in the admin) to `https://<site>/api/revalidate` with `Authorization: Bearer <secret>`. Events: entry create/update/delete/publish/unpublish, media create/update/delete.
3. The Next.js route checks the secret (constant-time compare, else 401), validates the payload with zod, and maps it to cache tags: `[model, "model:slug"]`, plus `sitemap` for routable models on publish/unpublish/delete; media events revalidate everything (`strapi`).
4. It calls `revalidateTag(tag, "max")` and returns `{ revalidated: [...tags], now }`.
5. Every query is `"use cache"` + `cacheLife("max")` + `cacheTag(...)` (Next 16 Cache Components), so pages are served from cache until a tag is revalidated. The next visitor gets the fresh page (stale-while-revalidate).
- Example tags: `strapi`, `global`, `home-page`, `page:<slug>`, `service`, `article:<slug>`, `sitemap`.
- Draft preview: Strapi's preview button opens `/api/draft?url=…&secret=…&status=draft`, which turns on Next.js Draft Mode and shows a preview banner.
- On publish, a document-service middleware writes a 301 redirect automatically if the slug changed.

## Media and fetching
- Media on Cloudflare R2 (`media.<site>/uploads/...`), image breakpoints 1920/1200/750/500.
- `strapiFetch` is the only function that calls Strapi (bearer API token, 10 s timeout; errors throw so a broken CMS is never cached as an empty page).
- Strapi at `cms.<domain>`, both apps on Railway.

## For the demo
Use a fictional client site, not hiconlab.com. Show plausible but fictional secrets as masked (`Bearer ••••••`). No real URLs.
