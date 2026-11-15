// Pre-render the English and Arabic pages into pages-dist/.
//
// site/ keeps one HTML file per page, in English, with the Arabic carried in
// data-ar (text) and data-ar-<attr> (attributes). lang.js swaps them in the
// browser, which search engines don't index. This script does the same swap
// at build time and writes one static file per language:
//
//   /            English home      (source: site/index.html)
//   /ar/         Arabic home
//   /bayan/      Arabic Bayan      (source: site/bayan/index.html)
//   /bayan/en/   English Bayan
//
// Each output gets root-relative asset links, its own canonical URL,
// hreflang alternates, and a language switch that links to the other page.
//
// Usage: node scripts/prerender.mjs <site-dir> <out-dir>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { parseHTML } from "linkedom";

const [, , SITE, OUT] = process.argv;
if (!SITE || !OUT) {
  console.error("usage: node scripts/prerender.mjs <site-dir> <out-dir>");
  process.exit(1);
}
const ORIGIN = "https://qcore-solutions.com";

// path -> { lang, source file, source directory URL, alternate path }
const PAGES = [
  { path: "/", lang: "en", src: "index.html", base: "/", alt: "/ar/", xdefault: "/", autoLang: true },
  { path: "/ar/", lang: "ar", src: "index.html", base: "/", alt: "/", xdefault: "/" },
  { path: "/bayan/", lang: "ar", src: "bayan/index.html", base: "/bayan/", alt: "/bayan/en/", xdefault: "/bayan/" },
  { path: "/bayan/en/", lang: "en", src: "bayan/index.html", base: "/bayan/", alt: "/bayan/", xdefault: "/bayan/" },
];

// Which output page a link to a source page should go to, per language.
const ROUTES = {
  "/": { en: "/", ar: "/ar/" },
  "/bayan/": { en: "/bayan/en/", ar: "/bayan/" },
};

const LOCALE = { en: "en_US", ar: "ar_EG" };

function isRelative(url) {
  return url && !/^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(url);
}

// Resolve a link from the source page and send page links to the right language.
function rewriteUrl(url, page) {
  if (!url) return url;
  let resolved = url;
  if (isRelative(url)) resolved = new URL(url, ORIGIN + page.base).pathname + (url.match(/[?#].*$/) || [""])[0];
  if (!resolved.startsWith("/") || resolved.startsWith("//")) return url;
  const m = resolved.match(/^([^?#]*)(.*)$/);
  const route = ROUTES[m[1]];
  if (route) return route[page.lang] + m[2];
  return resolved;
}

function render(page) {
  const html = readFileSync(join(SITE, page.src), "utf8");
  const { document } = parseHTML(html);
  const root = document.documentElement;
  const ar = page.lang === "ar";

  // 1. Swap text and attributes, then drop the translation attributes.
  for (const el of document.querySelectorAll("[data-ar]")) {
    if (ar) el.textContent = el.getAttribute("data-ar");
    el.removeAttribute("data-ar");
  }
  for (const el of document.querySelectorAll("*")) {
    for (const { name, value } of [...el.attributes]) {
      if (!name.startsWith("data-ar-")) continue;
      if (ar) el.setAttribute(name.slice(8), value);
      el.removeAttribute(name);
    }
  }

  // 2. Document language, title.
  const titleAr = root.getAttribute("data-title-ar");
  if (ar && titleAr) document.title = titleAr;
  for (const a of ["data-title-ar", "data-title-en", "data-default-lang"]) root.removeAttribute(a);
  root.setAttribute("lang", page.lang);
  root.setAttribute("dir", ar ? "rtl" : "ltr");
  root.setAttribute("data-lang-fixed", "");
  root.setAttribute("data-lang-ready", "true");
  if (page.autoLang) root.setAttribute("data-auto-lang", "");

  // 3. Links: root-relative, and page links go to the same language.
  for (const el of document.querySelectorAll("[href], [src]")) {
    for (const attr of ["href", "src"]) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, rewriteUrl(el.getAttribute(attr), page));
    }
  }

  // 4. The pre-render makes the hide-until-translated guard unnecessary.
  for (const style of document.querySelectorAll("style")) {
    if (/data-lang-ready|visibility/.test(style.textContent)) {
      const parent = style.parentElement;
      style.remove();
      if (parent && parent.tagName === "NOSCRIPT" && !parent.innerHTML.trim()) parent.remove();
    }
  }

  // 5. Canonical, hreflang, social tags.
  const head = document.head;
  const url = ORIGIN + page.path;
  let canonical = head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
  const pair = page.lang === "en" ? { en: page.path, ar: page.alt } : { en: page.alt, ar: page.path };
  let after = canonical;
  for (const [hreflang, path] of [["en", pair.en], ["ar", pair.ar], ["x-default", page.xdefault]]) {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    link.setAttribute("href", ORIGIN + path);
    after.after(link);
    after = link;
  }
  const meta = (prop, value) => {
    const el = head.querySelector(`meta[property="${prop}"]`);
    if (el) el.setAttribute("content", value);
  };
  const description = (head.querySelector('meta[name="description"]') || {}).getAttribute?.("content") || "";
  meta("og:url", url);
  meta("og:title", document.title);
  if (description) meta("og:description", description);
  if (ar) meta("og:image:alt", document.title);
  meta("og:locale", LOCALE[page.lang]);
  meta("og:locale:alternate", LOCALE[page.lang === "en" ? "ar" : "en"]);

  // 6. The language switch becomes a link to the other page.
  for (const btn of document.querySelectorAll("[data-lang-toggle]")) {
    const a = document.createElement("a");
    a.className = btn.className;
    a.setAttribute("href", page.alt);
    a.setAttribute("data-lang-toggle", "");
    a.setAttribute("hreflang", ar ? "en" : "ar");
    a.setAttribute("lang", ar ? "en" : "ar");
    a.setAttribute("aria-label", ar ? "View this page in English" : "اعرض الصفحة بالعربية");
    a.textContent = ar ? "English" : "عربي";
    btn.replaceWith(a);
  }

  const out = join(OUT, page.path, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, "<!doctype html>\n" + root.outerHTML + "\n");
  return out;
}

for (const page of PAGES) console.log("rendered " + page.path + " -> " + render(page));

// Sitemap with language alternates.
const today = new Date().toISOString().slice(0, 10);
const entries = PAGES.map((p) => {
  const pair = p.lang === "en" ? { en: p.path, ar: p.alt } : { en: p.alt, ar: p.path };
  return `  <url>
    <loc>${ORIGIN}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${pair.en}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${ORIGIN}${pair.ar}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${p.xdefault}"/>
  </url>`;
});
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`
);
console.log("wrote sitemap.xml");
