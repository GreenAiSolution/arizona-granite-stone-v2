# Arizona Granite & Stone LLC — website, version 2 "The Slab Yard"

Built by GreenAI Solutions (greenaidigital.com) for Carlos Marrufo, Waddell AZ.
Static HTML/CSS/JS. No build step, no dependencies, no accounts needed to host it.
Version 1 (bone paper, terracotta) lives in `../arizona-granite-stone`; this is the dark, stone-forward alternative.

- Local: `python3 -m http.server 8252` → http://127.0.0.1:8252/

## Where things live

| What | Where |
|------|-------|
| Page content | `index.html` (one page, anchored sections) |
| Styles (dark by design) | `styles.css` |
| Cut line, slab yard, edge picker, thickness drawing, form, lightbox | `main.js` |
| Phone / email / reviews | `CONFIG` block at the top of `main.js` |
| Fonts | `assets/fonts/` — Fraunces (SIL OFL, licence included), self-hosted |
| Photos (resized + webp) | `assets/img/` — shared set from `tools/build_images.py`, V2 extras from `tools/build_v2.py`, both from `assets/orig/` (gitignored) |
| Screenshots + checks | `shots/` (gitignored) — `node tools/shoot.mjs` then `python3 tools/slice.py` |

## Facts on the page (all from the client's own site)

Carlos Marrufo · AZ ROC 332009 · (623) 498-9056 · arizonagraniteandstone@gmail.com ·
8539 N 143rd Ave, Waddell, AZ 85355 · the shop, by appointment · 7:00 am – 5:00 pm (days unknown) ·
Instagram @arizonagraniteandstonellc · Facebook page 105264658191851.

The book-match band is one of their marble photos mirrored, and says so on the page. The granite grain
behind the page is generated, not a photo.

## Switches

- `<meta name="robots" content="noindex">` in `index.html` is PREVIEW ONLY. Delete at go-live.
- Reviews section is hidden until `CONFIG.reviews` in `main.js` has entries. Real reviews only.
- Quote form posts to FormSubmit (`https://formsubmit.co/ajax/arizonagraniteandstone@gmail.com`).
  First submission triggers a one-time activation email to the client. Nothing delivers until clicked.
