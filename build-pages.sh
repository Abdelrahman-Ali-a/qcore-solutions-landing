#!/bin/sh
# Assemble site/ (the live qcore-solutions.com) into pages-dist/ for
# Cloudflare Pages. site/ is self-contained, so this is a straight copy;
# it exists so the deploy command never points at the repo root, which
# holds wrangler.jsonc (see README).
set -e
SRC=site
OUT=pages-dist
mkdir -p "$OUT"
find "$OUT" -mindepth 1 -delete
cp -R "$SRC"/. "$OUT"/

if grep -rqE '(src|href)="\.\./\.\./' "$OUT"/index.html "$OUT"/bayan/index.html; then
  echo "error: a page links outside pages-dist/" >&2
  exit 1
fi
echo "pages-dist/ built:"
find "$OUT" -type f | sort
