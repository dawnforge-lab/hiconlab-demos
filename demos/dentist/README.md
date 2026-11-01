# Fanlight Dental, Frome

Demo 7 of 14 (website, pilot). An independent dental practice website made by Hiconlab for one specific practice, with online booking that works without a backend.

## Brand
- **Name:** Fanlight Dental. **Town:** Frome, Somerset (real town). **Address:** 4 Saddlers Row, Frome BA11 1NQ (fictional street and postcode).
- **Story:** Dr Clare Ashby and Dr Rohan Mehta took over a tired surgery in a Georgian townhouse in 2019 and rebuilt it around longer appointments and prices you can read before you sit down. The name comes from the semicircular window over the front door.
- **Name check (31 Oct 2026):** web searches for "Fanlight Dental" Frome and "Fanlight Dental" UK dentist found no business of that name. The nearest results were other Frome practices (Portway, Welshmill, Grants House, Catherine Court) and an unrelated "Fairlight Dental Practice Limited". We do not use any real street that has a dental practice on it.
- **Contact details:** phone 01632 960 214 (Ofcom drama range), email hello@fanlightdental.example (reserved `.example` domain). GDC numbers are invented.

## Audience
Adults in and around Frome who want a dentist they can trust and understand, often people who moved to the town and can't get an NHS place, parents looking for children's NHS places, and people weighing up clear aligners. Many read on a phone, often in the evening.

## Art direction
Georgian townhouse, not clinic. The site should feel like the building: pale Bath stone, painted sage panelling, oak, brass, and daylight through sash windows. Calm and plain-spoken, with the prices in plain view.

- **Palette**
  - Limestone paper `#F5F0E6` (page), deeper stone `#EAE2D2` (bands), card `#FBF8F2`
  - Ink `#1F2A24` (text), muted ink `#4D5A52` (secondary text)
  - Fanlight sage `#2F5A4C` (primary, buttons, dark bands), pale sage `#DCE5DB`, mid sage `#7E9C8A` (decorative only)
  - Bath-stone ochre `#B9853A` (decorative rules and the fanlight glyph), brick `#A3472A` (small accents, links on paper)
  - Rule `#D8CEBC`
- **Type:** Newsreader (variable, optical sizes 6–72) for headings, prices and pull quotes, using its display cut at large sizes and italic for emphasis; Hanken Grotesk (variable) for body and UI. Tabular figures on all prices and times.
- **Signature details**
  1. The fanlight: a semicircle with radiating glazing bars. It is the logo mark, the arched crop on the hero and team photos, the small glyph on section labels, and the loading state in booking (the bars light up one by one).
  2. The price list is set like a printed card: Newsreader names, dotted leaders, tabular "from" prices.
  3. A hand-drawn map of the town centre in SVG (river, Market Place, Bath Street, the Cattle Market car park, the walk to the door), no external map.
- **Imagery:** editorial film photography: 35mm/85mm, soft window light, Kodak Portra 400 colour, gentle grain, sage walls and Bath stone. Team portraits chest-up against panelling. No stock clichés (no gloved hands, no giant white smiles, no tooth icons).
- **Icons:** one inline SVG set, 1.5px stroke, round caps.

## Pages
1. `index.html`: utility bar (NHS status, emergency line), header with mobile menu, hero, "straight answers" (new patients, NHS, pain), treatments with from-prices, clear aligners feature, fee card and the Fanlight Plan, team with GDC numbers, patient words, visit us (map, hours, parking, access), booking call to action, footer.
2. `treatment.html`: clear aligners: who it suits, the five steps, a drag-to-see illustration of a typical plan moving the teeth, three fixed fees with what's included, a finance calculator (0% over 12 months, 9.9% APR over 24 or 36), FAQs, booking a consultation.
3. Booking (both pages): an accessible dialog. Reason → new or existing patient → day and time → details with validation → confirmation with a reference.

## Tour (about 42 s at 1920×1080)
In tour mode the clock is pinned to Tuesday 10 November, 09:20 (so the late opening shows and the video never dates), slots are deterministic and the reference is fixed (FD-1011-K7Q2).
1. 0–2 s: settled hero, no entrance animation.
2. 2–8 s: scroll to treatments, rest on the clear aligners row.
3. 8–12 s: the aligners feature: the photo of an aligner in its case and the facts beside it; the cursor rests on “How it works and what it costs”.
4. 12–17 s: the fee card (prices on the wall), then the Fanlight Plan.
5. 17–20 s: back to the top; the hero card advertises the next free check-up (Tue 10 Nov, 10:30); click “Book it”.
6. 20–32 s: new patient, that same day and time, details, confirm, the booked state.
7. 32–38 s: Done; the hero card now reads “You’re booked in · Tue 10 Nov, 10:30” (poster), held for about 2.5 s.

## Image prompts (fal-ai/flux-2-pro unless noted)
Shared look: "Kodak Portra 400 colour, gentle film grain, soft window light, sage-green panelling, Georgian townhouse in Somerset. No text, no logos."
- `reception`: waiting room, sash window, sage panelling, oak bench with linen cushions, fiddle-leaf fig, brass lamp, limestone floor, nobody in frame (book spines then cleaned with fal-ai/nano-banana-2/edit).
- `surgery`: pale grey dental chair, seamless white solid-surface worktop with an integrated sink, closed sage cabinets, nothing left out, coved vinyl floor (regenerated in round two so it reads as clinically credible).
- `door`: sage panelled front door with a semicircular fanlight, Bath stone, bay tree in terracotta (repainted with fal-ai/nano-banana-2/edit in round two).
- `clare`, `rohan`, `jan`, `delroy`: chest-up portraits, 85mm f/2.2, sage panelling or limestone behind, closed-mouth or gentle smiles.
- `patient`: woman in a mustard cardigan on an oak bench by the window, chatting, bare bench.
- `consult`: woman in an oatmeal jumper mid-conversation in the consultation room, closed-mouth smile.
- `aligners` (round three, replaces the drawn teeth on the homepage aligners feature, 1536×1024, seed 5023): "Editorial still life photograph: a small open pale sage-green aligner case on a worn oak windowsill, holding a clear transparent dental aligner tray, with a tall Georgian sash window and pale Bath stone reveal beside it, soft overcast daylight, a sprig of rosemary in a small glass and a brass window catch slightly out of focus. 50mm at f/2.8, Kodak Portra 400 colour, gentle film grain, quiet and calm, Georgian townhouse in Somerset. No text, no logos, no people."
- Rohan’s portrait was lightly retouched with fal-ai/nano-banana-2/edit to remove skin specks.

## fal spend
Round one: 13 images on fal-ai/flux-2-pro ($0.03 per processed megapixel, 1.3–1.7 MP each) and one fal-ai/nano-banana-2/edit ($0.08, 2K) to blank the book spines. Round two: 4 flux-2-pro images (two surgery and two consultation options) and two nano-banana-2 edits (door repaint, Rohan retouch). Rejected along the way: the first Rohan portrait, the first patient photo (magazines with fake mastheads), the oak-worktop surgery, the wide-smile aligner patient. Estimated total: about $1.40 of the $5 budget. Round three (owner review: the drawn teeth on the homepage looked odd): 4 flux-2-pro options at 1536×1024 (1.57 MP, about $0.05 each): an aligner beside an open case on an oak sill, a closed case and aligner on an oak table, a hand holding an aligner by the window, and the chosen open case on the sill. About $0.19 of a $1.50 allowance, so about $1.60 in all. Originals are in the builder's scratchpad, not in the repo.

## Notes
- Lazy images switch to eager loading after the page settles, so full-page screenshots and fast scrolling never show empty frames.
- The town map has a wide version and a portrait version for phones.
- Booking supports children: “Booking for a child under 18?” switches the details to the child’s name and date of birth plus a parent or guardian, and the fee to NHS (free).
