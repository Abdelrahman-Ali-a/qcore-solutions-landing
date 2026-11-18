#!/bin/sh
# Assemble site/ (the live qcore-solutions.com) into pages-dist/ for
# Cloudflare Pages: copy site/, then pre-render the English and Arabic
# pages. Deploy pages-dist/ from outside the repo root, which holds
# wrangler.jsonc (see README).
set -e
SRC=site
OUT=pages-dist
mkdir -p "$OUT"
find "$OUT" -mindepth 1 -delete
cp -R "$SRC"/. "$OUT"/

# One static page per language: /, /ar/, /bayan/, /bayan/en/ (+ sitemap.xml).
# Needs `npm install` once for linkedom.
node scripts/prerender.mjs "$SRC" "$OUT"

if grep -rq '__WEB3FORMS_KEY__' "$OUT"; then
  echo "error: the contact form has no Web3Forms access key." >&2
  echo "       Replace __WEB3FORMS_KEY__ in site/index.html (see README)." >&2
  exit 1
fi

# ALLOW_TODO=1 builds anyway, for a preview deploy (wrangler --branch preview).
if [ -z "$ALLOW_TODO" ] && grep -rlq 'data-todo' "$SRC" --include='*.html'; then
  echo "error: placeholder content is still on these pages (marked data-todo):" >&2
  grep -rl 'data-todo' "$SRC" --include='*.html' >&2
  echo "       Fill it in or remove it before deploying." >&2
  exit 1
fi

if grep -rqE '(src|href)="\.\./' "$OUT"/index.html "$OUT"/ar/index.html "$OUT"/bayan/index.html "$OUT"/bayan/en/index.html; then
  echo "error: a page links outside pages-dist/" >&2
  exit 1
fi
echo "pages-dist/ built:"
find "$OUT" -type f | sort
