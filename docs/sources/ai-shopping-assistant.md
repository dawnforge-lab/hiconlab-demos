# Source brief: AI shopping assistant

Read-only study of `D:\ai-shopping-assistant` (a reference implementation of a chat assistant for a fictional B2B trade supplier, Brackwell Trade Supply). Demos 1 (conversational product search) and 2 (AI chat assistant) are based on it. The demos must use their own fictional brand, not Brackwell, but the flows, rules and data shapes below are the real ones.

## What to keep in mind
- The real widget does not stream. It shows a typing indicator, then the whole reply. The demos add realistic token streaming on top.
- The demo storefront has no autocomplete. Demo 1 adds it, based on the real search behaviour (synonyms, in-stock first, then popularity).
- The brand lives in the CSS, not in config.

## Widget anatomy (`public/widget/assistant.js`, `assistant.css`, all classes `sa-`)
```
div.sa-root
  button.sa-launcher[aria-expanded]      speech-bubble icon + "Ask the assistant"
  section.sa-panel[role=dialog][hidden]
    header.sa-header                     title, status ("Browsing as trade account"), close
    div.sa-messages[role=log][aria-live=polite]
    div.sa-suggestions                   starter chips (hidden after the first message)
    form.sa-form                         textarea "Describe the job or ask a question" + Send
    p.sa-disclaimer                      "AI assistant. Check critical specs on the product datasheet."
  div.sa-toast
```
- Panel fixed bottom-right, about 420 x 680, radius 14. Full screen under 520px. Launcher hides while open. Escape closes. Enter sends, Shift+Enter is a new line. Textarea grows to 120px.
- Message types: user bubble (brand colour, right); bot bubble (white, bordered, left, small Markdown subset: bold, italics, code, lists, relative links such as "returns policy" as the only source links); notice (small centred grey); error (amber); typing (three dots).
- Product cards (`.sa-cards > .sa-card`): name (link), price, meta "SKU · unit · In stock" or "Out of stock, N days", label "List price ex VAT" / "Your price ex VAT", quantity + "Add to basket". At most 4 per reply, only products whose SKU is mentioned in the reply, in mention order.
- Confirm card (`.sa-proposal`): yellow accent border, "Add to your basket?", one line per item ("3 x Name", line total), "Total ex VAT", Confirm / Cancel, then "Added to your basket." (green) or "Not added." (grey).
- Handover form: "How should the team contact you?" Name, Email, Phone, preferred contact (Email/Phone), consent checkbox ("...A copy of this chat will be shared with the team."), "Send to the team", note "Your details go directly to our customer service team, not to the AI assistant." Success: "Sent to customer service. Reference HO-XXXXXXXX. We'll reply by email. The team replies within 1 working hour during opening hours."
- Tool trace (`details.sa-tools`): "N searches and lookups", list of tool name + JSON input. Hidden unless "Show assistant searches" is ticked. Great for showing the "AI is doing real lookups" story.
- No per-reply follow-up chips in the real widget (the demos add them). Four starter chips: Delivery / PEX to a radiator / Consumer units / Speak to someone.
- Response shape: `{sessionId, reply, products[], basketProposal[]|null, handoverForm:{draftId}|null, toolCalls[{name,input}]}`.

## Product record
`objectID, sku, name, brand, family_id, category, subcategory, hierarchical_categories{lvl0,lvl1}, short_description, description, specs{}, certifications[], use_cases[], keywords[], unit, price (GBP ex VAT), stock_qty, in_stock, lead_time_days, visibility_groups[], related{variants,accessories,alternatives,compatible_with}, popularity, url`.
- Categories: Fixings & Fasteners, Plumbing, Electrical, Adhesives & Sealants, PPE & Workwear, Tools.
- About 12% out of stock with a 5–14 day lead time.
- Synonyms: mastic/silicone, studding/threaded rod, fuse box/consumer unit, rawlplug, t&e, zip tie, speedfit/push-fit, PTFE tape, spotlight/downlight, chemfix/chemical anchor.

Example products (ex VAT): hex bolt M10 x 50 A2 stainless box of 50 £23.76 (zinc 8.8 £9.90); chemical anchor resin 380ml polyester £8.95 (45 min cure at 20°C, not for damp holes or cracked concrete); vinylester styrene-free £14.50 (damp and cracked OK, 90 min at 20°C, 6h at 5°C); concrete screw 6.0x60 box of 50 £12.50 (5mm drill); sanitary silicone 310ml white £4.95; heavy-duty sealant gun 26:1 £12.95; push-fit elbow 15mm £3.20 (10 bar, 95°C, not for gas); pipe inserts 15mm pack of 10 £3.50 (required for PEX); PEX barrier pipe 50m 15mm £39.50; TRV 15mm £11.95; metal consumer unit 10-way £82 (trade only); RCBO Type A 30mA B curve 32A/40A £19.50 (trade only); fire-rated LED downlight IP65 6W 4000K £8.50; 18V brushless combi drill kit £139 (body only £69); S3 safety boot £44.95.

## Best conversations (`clients/brackwell/scenarios.ts`)
- concrete-need: "I need something to fix a heavy bracket into concrete" → parallel searches "chemical anchor" + "concrete screw", may ask about load or damp, never invents load ratings.
- stainless-follow-up: "I need M10 bolts about 50mm long" → then "They're going outside on a coastal site, does that change anything?" → switches to A2 stainless plus matching nuts and washers, warns not to mix with zinc, A4 marine grade can be sourced to order.
- pushfit-pex: "I'm running 15mm PEX to a radiator, which fittings do I need?" → push-fit fittings plus pipe inserts; solder fittings are copper only.
- out-of-stock: vinylester anchor out of stock with lead time, offers polyester with its limits.
- trade-consumer-unit: trade customer, "I need a 10 way consumer unit and RCBOs for a kitchen ring and a shower" → unit plus 32A and 40A RCBOs at account prices, brief qualified-electrician note.
- human-handover: "My order hasn't arrived and I want to speak to someone" → handover form.
- delivery: free over £75 ex VAT, otherwise £7.95; next working day if ordered before 2pm. Opened sealants can't be returned. Off-topic requests politely declined.

## Customer groups
guest (public products, list price), trade (+trade products, 15% off, "Your price"), contract (everything, 25% off). All prices ex VAT. "Browse as" switch resets the chat.

## Agent tools
search_products, get_product_details, search_product_specs (datasheet passages), get_related_products, search_help_content, get_live_price_and_stock, propose_add_to_basket (needs customer Confirm), offer_handover_form. Max 3 products per reply, each with name, SKU, price, unit, stock and one "why it fits" line. British English, trade-counter tone, no tables or headings.

## Storefront (`public/index.html`, `public/demo/store.*`)
Search form "Search by product, brand or SKU" (submit only). Tiles: striped placeholder thumbnail, brand, name, mono SKU, stock line, price "your price, ex VAT, unit", qty + Add. Hero "Find the right part first time." with three example prompts. Header strip: "Order by 2pm for next day", "Free delivery over £75 ex VAT".

## Original brand (do not reuse; for reference only)
Navy #1f3a52, amber #f2b705, system font stack.
