# Source brief: conversational product search (demo 1)

There is no source repo for this demo. It is defined by the user's description, recorded here so builders and critics work to the same idea.

## What it is
A search, not a chatbot. In the user's words: "a decision model that pulls products based on the user queries, is not chatting."

The shopper types what they need in plain English. The search works out what they meant, decides which products fit, and shows them. There are no chat bubbles, no typing indicator, no streamed prose answer and no "assistant" persona. The output is always products, plus a clear view of how the request was read and how the products were picked.

`D:\ai-shopping-assistant` (demo 2's source) is the chat assistant. It is useful here only for its search principles: synonyms, in-stock first, then popularity, and the product record shape (see `ai-shopping-assistant.md`).

## The interaction
1. **Search box with autocomplete.** As the shopper types, suggestions mix products, categories and completed needs (for example "waterproof walking boots for wide feet"). Matched text is highlighted. Full ARIA combobox behaviour.
2. **Understood as.** On submit, the query is read into a structured request and shown as a row of chips the shopper can edit or remove: category, hard requirements (waterproof, wide fit, size 9), budget ("under £120"), use (winter hillwalking), soft preferences (lightweight, green). Words it could not use are shown honestly ("Didn't use: 'proper'"), never silently dropped.
3. **Decide.** Hard requirements filter; soft preferences rank. A compact "How we picked these" view shows the narrowing, for example 212 products → 46 walking boots → 18 waterproof → 9 wide fit → 6 under £120. This is the moment that sells the service.
4. **Results.** A ranked product grid. Each card says why it fits in one line built from the matched attributes ("Waterproof membrane · wide fit · 1.1 kg a pair · £109"), plus stock. A "Nearly" section lists close misses with the reason ("£15 over budget", "No wide fit"), so the shopper can trade off.
5. **Refine by typing more.** Adding "in green" or "lighter" or "not leather" updates the chips and re-ranks the grid with a smooth reorder. Editing or removing a chip does the same. The facet filters stay in sync with the chips.
6. **No dead ends.** If nothing fits, it says which requirement to relax and offers it as one click ("Nothing waterproof under £60. Show up to £80?").

## Under the hood (in the demo)
A deterministic, rules-based reader in plain JavaScript stands in for the model: a vocabulary of categories, attributes and synonyms; price phrases ("under £120", "less than 100 quid", "between £50 and £80", "cheap"); sizes and fits; colours; uses mapped to attributes (winter hillwalking → waterproof, insulated, crampon-compatible); negations ("not leather", "no synthetic down"). Scoring is a simple weighted sum, so the same query always gives the same order. Everything runs in the browser; no network calls.

## Shop
A fictional UK consumer shop (the user chose a consumer shop so demos 1 and 2 look clearly different). The catalogue must be rich in comparable attributes so the decision story is easy to see. Vertical: outdoor and walking kit (boots, waterproof jackets, insulated jackets, rucksacks, base layers, socks), where fit, waterproofing, weight, warmth, use and price all matter.
