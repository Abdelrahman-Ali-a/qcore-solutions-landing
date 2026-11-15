# Qcore Solutions — landing page

Static site (no build step): plain HTML/CSS/JS implementing the
`Qcore Landing v2` design from Claude Design.

```
site/              ← the live site (landing + bayan/), deployed by build-pages.sh
index.html         ← earlier design, not deployed
css/style.css
js/main.js
img/               ← logo + favicons, generated from the source artwork in the repo root
build.sh           ← assembles dist/ for the older Worker setup
build-pages.sh     ← assembles pages-dist/ from site/ (the live site)
_headers           ← security + cache headers
wrangler.jsonc     ← Cloudflare Workers config (no routes; the domain is on Pages)
design-source/     ← original .dc.html design bundle + chat transcripts (reference only)
```

## Deploy

The public site is `site/`, served by the Cloudflare Pages project
**qcore-solutions** (free plan) at https://qcore-solutions.pages.dev, with
`qcore-solutions.com` and `www.` attached as custom domains. It holds the
landing page and the Bayan product page (`site/bayan/`).

`site/` was imported on 2026-11-14 by mirroring the live deployment, which
had been published from outside this repo. Edit it here and deploy from here
so the repo and the live site stay the same.

```sh
npm install        # once: the build uses linkedom to pre-render pages
sh build-pages.sh
# then, from a folder with no wrangler.jsonc above it:
npx wrangler pages deploy <path-to>/pages-dist --project-name qcore-solutions --branch main
```

`build-pages.sh` copies `site/` into `pages-dist/`, including `_headers`, then
runs `scripts/prerender.mjs`, which writes one static page per language:

| URL | Language | Source |
|---|---|---|
| `/` | English | `site/index.html` |
| `/ar/` | Arabic | `site/index.html` (`data-ar` text) |
| `/bayan/` | Arabic | `site/bayan/index.html` (`data-ar` text) |
| `/bayan/en/` | English | `site/bayan/index.html` |

Each gets its own canonical URL and `hreflang` links, and the sitemap is
generated with them. Edit text in `site/` only: English in the element, Arabic
in `data-ar` / `data-ar-<attr>`. Opened straight from `site/`, the pages still
switch language in the browser, as before.

On the built pages `lang.js` only remembers the visitor's choice. It sends
`?lang=` links, a saved choice, or an Arabic-language browser from `/` to
`/ar/`.

### Contact form

The form in the contact section posts to [Web3Forms](https://web3forms.com),
which emails each message to the address the access key was created with.
The key is in `site/index.html` (`name="access_key"`). It is public by
design; it only lets the form send to that address. `build-pages.sh` refuses
to build while the `__WEB3FORMS_KEY__` placeholder is still there.

Notes on `site/`:

- `_headers` sets a Content-Security-Policy. The Bayan page's two inline
  `<style>` blocks are allowed by SHA-256 hash, so if you edit either one,
  recompute its hash (`printf '%s' '<css>' | openssl dgst -sha256 -binary | base64`)
  and update `_headers`, or the page stays hidden. Any new inline script or
  third-party origin also needs a CSP entry.
- When `style.css` changes, bump `?v=` in `index.html`, `bayan/index.html`
  and `404.html`.
- `404.html` uses root-relative links because Pages serves it at any path.
- Social previews: `assets/og-image.png` and `bayan/og-image.png` (1200×630).
- The CSP already allows Web3Forms and Cloudflare Web Analytics.

The root `index.html`/`css/`/`js/` and `variants/` are earlier designs, kept
for reference; they are not deployed.

**Run the Pages deploy outside this folder.** Wrangler walks up to
`wrangler.jsonc`, a Worker config, and acts on it instead: run here, it once
created a stray Worker that served the old `dist/` site.

The older Worker setup (`./build.sh && npx wrangler deploy`, publishing
`dist/`) no longer claims any domain; `wrangler.jsonc` declares no routes.

First-time setup on a new machine needs `npx wrangler login`.

## Notes on what's implemented

- **Theme** — light/dark tokens matching the design, defaults to the
  visitor's OS setting, toggle in the header persists via `localStorage`.
- **Module explorer** (`#modules`) — click-driven in `js/main.js`; the
  module list, blurb, chips and the mock ERPNext screen (nav, columns,
  rows) all come from the same `MODULES`/`SCREENS` data as the prototype.
  All screen data is structural placeholder content (ids, names, statuses)
  — no invented revenue or performance figures, matching the "no AI slop"
  direction from the design chat.
- **Contact form** (`#contact`) — no backend. Submitting builds a `mailto:`
  link (prefilled subject/body from the fields) and opens the visitor's email
  client. The destination address is deliberately not shown as visible text on
  the page, but note it is still present in the HTML/JS source and therefore
  harvestable — hiding it properly requires a real endpoint. Swap one in by
  replacing the `submit` handler in `js/main.js`; that would also fix the case
  where a visitor on webmail has no mail client configured and the button
  appears to do nothing.
- **"Selected work" images** — the prototype left these as empty
  drop-in slots. Real stock photos couldn't be fetched from the sandboxed
  build session (outbound access to unsplash.com was blocked there), so
  each card ships a small on-brand SVG illustration instead, with an
  "Add your project photo" tag. Swap each `<svg>…</svg>` in `index.html`
  for an `<img>` whenever you have real project photos or screenshots.
- **Fonts** — Archivo + IBM Plex Mono via Google Fonts (`<link>` tags in
  `<head>`), matching the typeface direction chosen in the design chat.

`design-source/` carries the original Claude Design handoff (the
`.dc.html` prototype, its chat transcripts, and its own README) for
reference — it isn't used by the deployed site.
