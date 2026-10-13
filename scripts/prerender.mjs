/** Generate complete static pages that remain indexable before and after React starts. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { escapeHtml } from "./content-utils.mjs";
import { loadBookConfig } from "./load-book-config.mjs";
import { configCss } from "./config-utils.mjs";
import { homeMode, normalizeBase } from "./routing.mjs";
import { buildPageSeo, replaceSeoHead } from "./seo.mjs";

const config = await loadBookConfig();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const chapters = JSON.parse(
  await readFile(path.join(root, "src/generated/manifest.json"), "utf8"),
);
const template = await readFile(path.join(dist, "index.html"), "utf8");
const base = normalizeBase(process.env.VITE_BASE_PATH || "/");
const origin = process.env.VITE_SITE_URL || config.siteUrl;
const routes = [
  { pathname: "/", locale: config.defaultLocale, home: true },
  { pathname: "/library/", locale: config.defaultLocale },
  ...config.locales.map((locale) => ({
    pathname: `/library/${locale}/`,
    locale,
  })),
  ...chapters.map((chapter) => ({
    pathname: `/read/${chapter.locale}/${chapter.slug}/`,
    locale: chapter.locale,
    chapter,
  })),
  ...(config.features.studio
    ? [{ pathname: "/studio/", locale: config.defaultLocale, studio: true }]
    : []),
];
const pages = [];
const server = await createServer({
  server: { middlewareMode: true, ws: false },
  logLevel: "error",
});
try {
  const { BookPreferencesProvider } = await server.ssrLoadModule(
    "/src/hooks/use-book-preferences.tsx",
  );
  const content = await server.ssrLoadModule(
    "/src/components/book/Content.tsx",
  );
  const { Header } = await server.ssrLoadModule(
    "/src/components/layout/Header.tsx",
  );
  const { Library } = await server.ssrLoadModule(
    "/src/components/book/Library.tsx",
  );
  const { Landing } = await server.ssrLoadModule(
    "/src/components/book/Landing.tsx",
  );
  function render(element, item) {
    return renderToStaticMarkup(
      createElement(
        MemoryRouter,
        {
          basename: base === "/" ? "/" : base.slice(0, -1),
          initialEntries: [base + item.pathname.slice(1)],
        },
        createElement(
          BookPreferencesProvider,
          { initialLocale: item.locale },
          element,
        ),
      ),
    );
  }
  async function chapterBody(chapter, item) {
    const source = await readFile(
      path.join(root, "src/content", chapter.file),
      "utf8",
    );
    const element =
      chapter.format === "mdx"
        ? createElement(
            (await server.ssrLoadModule(`/src/content/${chapter.file}`))
              .default,
            { components: content.contentComponents },
          )
        : createElement(content.MarkdownContent, {
            text: source,
            locale: chapter.locale,
          });
    const markup = render(element, item).replace(
      /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/,
      "",
    );
    const related = chapters.filter(
      (ch) => ch.locale === chapter.locale && ch.slug !== chapter.slug,
    );
    const translations = chapters.filter(
      (ch) =>
        ch.translationKey === chapter.translationKey &&
        ch.locale !== chapter.locale,
    );
    return `<main class="reader-page reader-no-sidebar reader-no-toc"><div class="reader-grid"><div class="reader-main"><div class="reader-article-shell"><header class="reader-article-head"><h1>${escapeHtml(chapter.title)}</h1><p class="article-deck">${escapeHtml(chapter.description)}</p></header><article class="prose-book prose-${escapeHtml(chapter.locale)}" dir="${config.languages[chapter.locale].direction}">${markup}</article><nav aria-label="${escapeHtml(config.messages[chapter.locale].chapters)}">${related.map((ch) => `<p><a href="${escapeHtml(base + `read/${ch.locale}/${ch.slug}/`)}">${escapeHtml(ch.title)}</a></p>`).join("")}${translations.map((ch) => `<p><a hreflang="${escapeHtml(ch.locale)}" href="${escapeHtml(base + `read/${ch.locale}/${ch.slug}/`)}">${escapeHtml(config.languages[ch.locale].label)}</a></p>`).join("")}</nav></div></div></div></main>`;
  }
  for (const item of routes) {
    const mode = item.home ? homeMode(config) : "library";
    const first = chapters.find((ch) => ch.locale === item.locale);
    let body;
    if (item.chapter || (item.home && mode === "reader" && first))
      body = await chapterBody(item.chapter || first, item);
    else if (item.studio || (item.home && mode === "studio"))
      body = `<main class="section-wrap"><h1>${escapeHtml(config.studio.name.replace("{brand}", config.brand))}</h1><p>${escapeHtml(config.meta.studioSummary[item.locale])}</p></main>`;
    else
      body = render(
        createElement(item.home && mode === "landing" ? Landing : Library),
        item,
      );
    const languages = config.locales
      .map(
        (locale) =>
          `<a hreflang="${escapeHtml(locale)}" href="${escapeHtml(base + (locale === config.defaultLocale && homeMode(config) === "library" ? "" : `library/${locale}/`))}">${escapeHtml(config.languages[locale].label)}</a>`,
      )
      .join(" · ");
    body = `<div class="app-shell">${render(createElement(Header, { onSearch() {}, onSettings() {} }), item)}${body}<nav class="section-wrap" aria-label="${escapeHtml(config.messages[item.locale].headerSwitchLanguage)}">${languages}</nav></div>`;
    const seo = buildPageSeo(config, chapters, { ...item, base, origin });
    pages.push(seo);
    const html = replaceSeoHead(template, seo)
      .replace(
        /<html[^>]*>/,
        `<html lang="${escapeHtml(item.locale)}" dir="${config.languages[item.locale].direction}" data-theme="${escapeHtml(config.appearance.defaults.theme)}" data-font="${escapeHtml(config.appearance.defaults.font)}">`,
      )
      .replace(
        /<style id="book-configuration">[\s\S]*?<\/style>/,
        `<style id="book-configuration">${configCss(config, base, item.locale)}</style>`,
      )
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    const directory = path.join(dist, item.pathname.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), html);
  }
} finally {
  await server.close();
}
const errorSeo = buildPageSeo(config, chapters, {
  pathname: "/__404__/",
  base,
  origin,
});
await writeFile(
  path.join(dist, "404.html"),
  replaceSeoHead(template, errorSeo).replace(
    '<div id="root"></div>',
    `<div id="root"><main class="not-found"><h1>${escapeHtml(config.messages[config.defaultLocale].notFoundCode)}</h1><p>${escapeHtml(config.messages[config.defaultLocale].readerChapterNotFound)}</p><a href="${escapeHtml(base)}">${escapeHtml(config.messages[config.defaultLocale].home)}</a></main></div>`,
  ),
);
if (origin) {
  const unique = new Map(
    pages
      .filter((page) => page.indexable && page.canonical)
      .map((page) => [page.canonical, page]),
  );
  const urls = [...unique.values()].map(
    (page) =>
      `<url><loc>${escapeHtml(page.canonical)}</loc>${page.alternates.map((alternate) => `<xhtml:link rel="alternate" hreflang="${escapeHtml(alternate.locale)}" href="${escapeHtml(alternate.href)}" />`).join("")}</url>`,
  );
  await writeFile(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("\n")}</urlset>\n`,
  );
  await writeFile(
    path.join(dist, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${new URL(base + "sitemap.xml", origin).href}\n`,
  );
}
console.log(
  `Prerendered ${routes.length} complete static pages with localized SEO metadata.`,
);
