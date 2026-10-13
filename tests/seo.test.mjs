import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBookConfig } from "../scripts/load-book-config.mjs";
import {
  buildPageSeo,
  renderSeoHead,
  replaceSeoHead,
} from "../scripts/seo.mjs";
import { entryRoutingMode } from "../scripts/routing.mjs";

const config = await loadBookConfig();
const chapters = [
  {
    locale: "fa",
    slug: "part/intro",
    title: "پیشگفتار",
    description: "شرح فصل",
    translationKey: "intro",
    order: 1,
  },
  {
    locale: "en",
    slug: "introduction",
    title: "Introduction",
    description: "Chapter summary",
    translationKey: "intro",
    order: 1,
  },
  {
    locale: "fa",
    slug: "untranslated",
    title: "فصل دوم",
    description: "شرح دوم",
    translationKey: "second",
    order: 2,
  },
];
const publishing = { base: "/my-book/", origin: "https://books.example" };

test("chapter SEO uses its own language, physical URL and translated counterparts", () => {
  const seo = buildPageSeo(config, chapters, {
    ...publishing,
    pathname: "/read/en/introduction/",
    locale: "fa",
  });
  assert.equal(seo.locale, "en");
  assert.equal(
    seo.title,
    `Introduction${config.meta.titleSeparator}${config.title.en}`,
  );
  assert.equal(seo.description, "Chapter summary");
  assert.equal(
    seo.canonical,
    "https://books.example/my-book/read/en/introduction/",
  );
  assert.deepEqual(
    seo.alternates.map((item) => item.locale),
    ["fa", "en", "x-default"],
  );
  assert.equal(
    seo.alternates[0].href,
    "https://books.example/my-book/read/fa/part/intro/",
  );
  assert.equal(
    seo.tags.find((tag) => tag.property === "og:url").content,
    seo.canonical,
  );
  assert.equal(
    seo.tags.find((tag) => tag.name === "twitter:image").content,
    "https://books.example/my-book/images/social-card.png",
  );
  assert.ok(
    seo.structuredData["@graph"].some(
      (item) => item["@type"] === "Chapter" && item.isPartOf,
    ),
  );
});

test("home and localized book pages share consistent canonicals without inventing translations", () => {
  const home = buildPageSeo(config, chapters, publishing);
  const library = buildPageSeo(config, chapters, {
    ...publishing,
    pathname: "/library/fa/",
  });
  assert.equal(home.canonical, library.canonical);
  assert.equal(home.title, config.title.fa);
  assert.ok(
    home.alternates.some(
      (item) => item.locale === "en" && item.href.endsWith("/library/en/"),
    ),
  );
  const chapter = buildPageSeo(config, chapters, {
    ...publishing,
    pathname: "/read/fa/untranslated/",
  });
  assert.ok(!chapter.alternates.some((item) => item.locale === "en"));
});

test("unavailable pages, Studio and disabled indexing never advertise indexable content", () => {
  const enabled = structuredClone(config);
  enabled.features.studio = true;
  for (const pathname of [
    "/__404__/",
    "/read/fa/missing/",
    "/library/unknown/",
    "/studio/",
  ]) {
    const seo = buildPageSeo(enabled, chapters, { ...publishing, pathname });
    assert.equal(seo.indexable, false, pathname);
    assert.equal(
      seo.tags.find((tag) => tag.name === "robots").content,
      "noindex, follow",
    );
    assert.equal(seo.structuredData, undefined);
  }
  enabled.seo.indexable = false;
  assert.equal(buildPageSeo(enabled, chapters, publishing).indexable, false);
});

test("metadata is replaced once and escaped safely for HTML and JSON-LD", () => {
  const custom = structuredClone(config);
  custom.title.fa = '</script><script>alert("book")</script>';
  const seo = buildPageSeo(custom, chapters, publishing);
  const template =
    '<html><head><title>Old title</title><meta name="description" content="Old summary" /></head></html>';
  const first = replaceSeoHead(template, seo);
  const second = replaceSeoHead(first, seo);
  assert.equal(first, second);
  assert.equal((first.match(/<title\b/g) || []).length, 1);
  assert.equal((first.match(/name="description"/g) || []).length, 1);
  assert.equal((first.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(!first.includes('<script>alert("book")</script>'));
  const json = /type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
    renderSeoHead(seo),
  )[1];
  assert.equal(JSON.parse(json)["@graph"][0].name, custom.title.fa);
});

test("hash navigation and generated physical pages both survive direct entry", () => {
  const options = {
    base: "/my-book/",
    mode: "hash",
    indexableEntryPoints: true,
  };
  assert.equal(
    entryRoutingMode(
      { pathname: "/my-book/", hash: "#/read/en/introduction/" },
      options,
    ),
    "hash",
  );
  assert.equal(
    entryRoutingMode(
      { pathname: "/my-book/read/en/introduction/", hash: "#section" },
      options,
    ),
    "browser",
  );
  assert.equal(
    entryRoutingMode({ pathname: "/my-book/library/en/" }, options),
    "browser",
  );
  assert.equal(
    entryRoutingMode(
      { pathname: "/my-book/read/en/introduction/", hash: "#/library/" },
      options,
    ),
    "hash",
  );
  assert.equal(
    entryRoutingMode(
      { pathname: "/my-book/read/en/introduction/" },
      { ...options, indexableEntryPoints: false },
    ),
    "hash",
  );
  assert.equal(
    entryRoutingMode({ pathname: "/unrelated/read/en/introduction/" }, options),
    "hash",
  );
});
