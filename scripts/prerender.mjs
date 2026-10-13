/**
 * GitHub Pages does not provide SPA rewrites. Generate a real index.html for
 * each route, including minimal semantic HTML for search engines and no-JS clients.
 * React replaces this static fallback on startup. Asset URLs are Vite-base aware.
 */
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml, parseFrontmatter } from "./content-utils.mjs";
import { loadBookConfig } from "./load-book-config.mjs";
import { configCss } from "./config-utils.mjs";
import { homeMode, routeHref } from "./routing.mjs";

const config = await loadBookConfig();
const defaultLocale = config.defaultLocale;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const chapters = JSON.parse(
  await readFile(path.join(root, "src/generated/manifest.json"), "utf8"),
);
const template = await readFile(path.join(dist, "index.html"), "utf8");
const rawBase = process.env.VITE_BASE_PATH || "/";
const trimmedBase = rawBase.replace(/^\/+|\/+$/g, "");
const base = trimmedBase ? `/${trimmedBase}/` : "/";
const site = (process.env.VITE_SITE_URL || config.siteUrl).replace(/\/$/, "");
const routes = [
  {
    path: "library",
    title: config.messages[defaultLocale].library,
    summary: config.meta.librarySummary[defaultLocale],
  },
];
if (config.features.studio)
  routes.push({
    path: "studio",
    title: config.studio.name.replace("{brand}", config.brand),
    summary: config.meta.studioSummary[defaultLocale],
  });
for (const ch of chapters)
  routes.push({
    path: `read/${ch.locale}/${ch.slug}`,
    title: ch.title,
    summary: ch.description,
    chapter: ch,
  });

function richTitle(parts) {
  return parts
    .map((part) =>
      part.break
        ? "<br/>"
        : part.emphasis
          ? `<em>${escapeHtml(part.text || "")}</em>`
          : escapeHtml(part.text || ""),
    )
    .join("");
}
async function chapterHtml(chapter) {
  const body = await readFile(
    path.join(root, "src/content", chapter.file),
    "utf8",
  );
  const raw = parseFrontmatter(body).body;
  // Author content is escaped in the no-JavaScript fallback, never executed.
  return raw
    .split("\n")
    .filter(Boolean)
    .filter((s) => !/^\s*(<|!\[|\$\$|```|---)/.test(s))
    .slice(0, 100)
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)/.exec(line);
      if (match)
        return `<h${match[1].length}>${escapeHtml(match[2])}</h${match[1].length}>`;
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

const home = config.pages.home;
const mode = homeMode(config);
const defaultChapters = chapters.filter((ch) => ch.locale === defaultLocale);
let homeContent = "";
if (mode === "reader" && defaultChapters[0])
  homeContent = await chapterHtml(defaultChapters[0]);
else if (mode === "library")
  homeContent = `<h1>${config.pages.library.useBookTitle ? escapeHtml(config.title[defaultLocale]) : richTitle(config.pages.library.title[defaultLocale])}</h1><p>${escapeHtml(config.description[defaultLocale])}</p>${defaultChapters.map((ch) => `<p><a href="${escapeHtml(routeHref(`/read/${ch.locale}/${ch.slug}/`, { base, mode: config.routing.mode }))}">${escapeHtml(ch.title)}</a></p>`).join("")}`;
else if (mode === "studio")
  homeContent = `<h1>${escapeHtml(config.studio.name.replace("{brand}", config.brand))}</h1><p>${escapeHtml(config.meta.studioSummary[defaultLocale])}</p>`;
else
  homeContent = home.sections
    .filter((name) => name !== "studio" || config.features.studio)
    .map((name) => {
      const section = home[name];
      const title =
        name === "featured"
          ? config.title[defaultLocale]
          : section.title[defaultLocale];
      const heading = Array.isArray(title)
        ? richTitle(title)
        : escapeHtml(title);
      const description =
        name === "featured"
          ? config.description[defaultLocale]
          : section.description?.[defaultLocale];
      const level = name === "hero" ? 1 : 2;
      return `<section><h${level}>${heading}</h${level}>${description ? `<p>${escapeHtml(description)}</p>` : ""}</section>`;
    })
    .join("");
await writeFile(
  path.join(dist, "index.html"),
  template.replace(
    '<div id="root"></div>',
    `<div id="root"><main class="prerender-fallback">${homeContent}</main></div>`,
  ),
);

for (const item of routes) {
  const dir = path.join(dist, item.path);
  await mkdir(dir, { recursive: true });
  const locale = item.chapter?.locale || defaultLocale;
  const dirAttr = config.languages[locale].direction;
  const pageUrl = `${site}${base}${item.path}/`;
  const semantic = item.chapter
    ? await chapterHtml(item.chapter)
    : `<p>${escapeHtml(item.summary)}</p>`;
  let html = template
    .replace(
      /<html[^>]*>/,
      `<html lang="${locale}" dir="${dirAttr}" data-theme="${escapeHtml(config.appearance.defaults.theme)}" data-font="${escapeHtml(config.appearance.defaults.font)}">`,
    )
    .replace(
      /<style id="book-configuration">[\s\S]*?<\/style>/,
      `<style id="book-configuration">${configCss(config, base, locale)}</style>`,
    )
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(item.title + config.meta.titleSeparator + config.title[locale])}</title>`,
    )
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(item.summary)}" />`,
    )
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main class="prerender-fallback" dir="${dirAttr}"><article><h1>${escapeHtml(item.title)}</h1>${semantic}</article></main></div>`,
    );
  if (site)
    html = html.replace(
      "</head>",
      `<link rel="canonical" href="${escapeHtml(pageUrl)}" /></head>`,
    );
  await writeFile(path.join(dir, "index.html"), html);
}
await copyFile(path.join(dist, "index.html"), path.join(dist, "404.html"));
if (site) {
  const urls = [
    base,
    ...routes.filter((r) => r.chapter).map((r) => `${base}${r.path}/`),
  ];
  await writeFile(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${escapeHtml(site + u)}</loc></url>`).join("")}</urlset>`,
  );
  await writeFile(
    path.join(dist, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${site}${base}sitemap.xml\n`,
  );
}
console.log(`Prerendered ${routes.length} deep-linkable static routes.`);
