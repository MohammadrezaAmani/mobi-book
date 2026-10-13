/** Fail deployment if the generated GitHub Pages artifact has missing routes/assets. */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadBookConfig } from "./load-book-config.mjs";
import { buildPageSeo } from "./seo.mjs";

const config = await loadBookConfig();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const manifest = JSON.parse(
  await readFile(path.join(root, "src/generated/manifest.json"), "utf8"),
);
const basePath =
  `/${(process.env.VITE_BASE_PATH || "/").replace(/^\/+|\/+$/g, "")}/`.replace(
    /^\/\//,
    "/",
  );
const checks = [
  "index.html",
  "404.html",
  "library/index.html",
  ...config.locales.map((locale) => `library/${locale}/index.html`),
  ...(config.features.studio ? ["studio/index.html"] : []),
  ...manifest.map((ch) => `read/${ch.locale}/${ch.slug}/index.html`),
];
const failures = [];
for (const route of checks) {
  try {
    const content = await readFile(path.join(out, route), "utf8");
    if (!content.includes('<div id="root">'))
      failures.push(`${route}: missing React mount point`);
    if ((content.match(/<title\b[^>]*>/g) || []).length !== 1)
      failures.push(`${route}: expected one title`);
    const pathname =
      route === "404.html"
        ? "/__404__/"
        : "/" + route.replace(/index\.html$/, "").replace(/^\//, "");
    const seo = buildPageSeo(config, manifest, {
      pathname,
      base: basePath,
      origin: process.env.VITE_SITE_URL || config.siteUrl,
    });
    const canonicals = [
      ...content.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/g),
    ];
    if (
      seo.canonical &&
      (canonicals.length !== 1 || canonicals[0][1] !== seo.canonical)
    )
      failures.push(`${route}: canonical URL missing or incorrect`);
    if (!seo.canonical && canonicals.length)
      failures.push(`${route}: unexpected canonical`);
    if (
      !content.includes(
        `content="${seo.indexable ? config.seo.robots : "noindex, follow"}"`,
      )
    )
      failures.push(`${route}: wrong indexing directives`);
    for (const name of [
      "description",
      "author",
      "robots",
      "twitter:title",
      "twitter:description",
    ])
      if (
        (content.match(new RegExp(`<meta[^>]*name="${name}"`, "g")) || [])
          .length !== 1
      )
        failures.push(`${route}: missing or duplicate ${name}`);
    for (const name of ["og:title", "og:description", "og:locale"])
      if (
        (content.match(new RegExp(`<meta[^>]*property="${name}"`, "g")) || [])
          .length !== 1
      )
        failures.push(`${route}: missing or duplicate ${name}`);
    if (seo.structuredData) {
      try {
        const blocks = [
          ...content.matchAll(
            /type="application\/ld\+json">([\s\S]*?)<\/script>/g,
          ),
        ];
        if (blocks.length !== 1) throw new Error("expected one JSON-LD block");
        const data = JSON.parse(blocks[0][1]);
        if (
          !data["@graph"]?.some(
            (item) => item["@type"] === "WebPage" && item.url === seo.canonical,
          )
        )
          throw new Error("WebPage does not match canonical");
      } catch (error) {
        failures.push(`${route}: invalid structured data (${error.message})`);
      }
    }
    if (route.startsWith("read/")) {
      const locale = route.split("/")[1];
      if (!content.includes(`lang="${locale}"`))
        failures.push(`${route}: wrong locale metadata`);
      if (!content.includes(`dir="${config.languages[locale].direction}"`))
        failures.push(`${route}: wrong direction metadata`);
      if ((content.match(/<h1\b/g) || []).length !== 1)
        failures.push(`${route}: expected one chapter heading`);
      if (!content.includes('class="prose-book'))
        failures.push(`${route}: missing prerendered chapter body`);
      if (new RegExp(`<a[^>]*href="${basePath}#/`).test(content))
        failures.push(
          `${route}: static chapter links must not use hash routes`,
        );
    }
  } catch {
    failures.push(`${route}: missing static route`);
  }
}
const origin = process.env.VITE_SITE_URL || config.siteUrl;
if (origin) {
  try {
    const sitemap = await readFile(path.join(out, "sitemap.xml"), "utf8");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    if (locations.length !== new Set(locations).size)
      failures.push("sitemap.xml: duplicate URLs");
    if (config.seo.indexable && !locations.length)
      failures.push("sitemap.xml: no indexable URLs");
    for (const location of locations) {
      const url = new URL(location);
      if (
        url.hash ||
        url.search ||
        url.origin !== new URL(origin).origin ||
        !url.pathname.startsWith(basePath)
      )
        failures.push(`sitemap.xml: invalid canonical URL ${location}`);
      await stat(
        path.join(out, url.pathname.slice(basePath.length), "index.html"),
      );
    }
    const robots = await readFile(path.join(out, "robots.txt"), "utf8");
    if (
      !robots.includes(
        `Sitemap: ${new URL(basePath + "sitemap.xml", origin).href}`,
      )
    )
      failures.push("robots.txt: wrong sitemap URL");
  } catch (error) {
    failures.push(`SEO discovery files: ${error.message}`);
  }
}
if (config.seo.socialImage && !/^https?:\/\//.test(config.seo.socialImage)) {
  try {
    await stat(path.join(out, config.seo.socialImage.replace(/^\//, "")));
  } catch {
    failures.push("Missing social sharing image");
  }
}
const home = await readFile(path.join(out, "index.html"), "utf8");
for (const href of home.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css))"/g)) {
  const request = href[1];
  if (!request.startsWith(basePath)) {
    failures.push(`Asset outside base path ${basePath}: ${request}`);
    continue;
  }
  const file = path.join(out, request.slice(basePath.length));
  try {
    const s = await stat(file);
    if (!s.isFile()) failures.push(`Asset not a file: ${request}`);
  } catch {
    failures.push(`Missing asset: ${request}`);
  }
}
if (failures.length) {
  console.error(
    "Static site verification failed:\n" +
      failures.map((x) => "  - " + x).join("\n"),
  );
  process.exit(1);
}
console.log(
  `Verified ${checks.length} HTML entry points and all local top-level assets (base: ${basePath}).`,
);
