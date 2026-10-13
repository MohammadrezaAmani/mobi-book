import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { loadBookConfig } from "../scripts/load-book-config.mjs";
import { configCss, validateConfig } from "../scripts/config-utils.mjs";

test("configuration rejects invalid defaults, missing translations and incompatible features", async () => {
  const baseline = await loadBookConfig();
  assert.doesNotThrow(() => validateConfig(baseline));
  for (const [change, expected] of [
    [
      (config) => {
        config.appearance.defaults.theme = "missing";
      },
      /Default theme/,
    ],
    [
      (config) => {
        delete config.messages.en.home;
      },
      /messages.en.home/,
    ],
    [
      (config) => {
        config.pages.home.bookMode = "landing";
      },
      /bookMode/,
    ],
    [
      (config) => {
        config.appearance.ranges.fontSize.min = 30;
      },
      /Invalid fontSize/,
    ],
    [
      (config) => {
        config.pages.reader.headingLevels = [];
      },
      /headingLevels/,
    ],
  ]) {
    const config = structuredClone(baseline);
    change(config);
    assert.throws(() => validateConfig(config), expected);
  }
});

test("appearance generates complete CSS with configurable tokens, dimensions, media rules and font URLs", async () => {
  const config = structuredClone(await loadBookConfig());
  config.appearance.defaults.theme = "dark";
  config.appearance.defaults.fontSize = 24;
  config.appearance.layout.headerHeight = "96px";
  config.appearance.styles.push({
    atRule: "font-face",
    properties: {
      "font-family": "Example",
      src: "url(__BASE_URL__fonts/example.woff2)",
    },
  });
  const css = configCss(config, "/my-book/");
  assert.match(css, /--bg:#171e1c;/);
  assert.match(css, /--header-height:96px;/);
  assert.match(css, /--reader-font-size:24px;/);
  assert.match(css, /@media[^{}]*\{/);
  assert.match(css, /url\(\/my-book\/fonts\/example.woff2\)/);
  const defined = new Set(
    Array.from(css.matchAll(/--([a-zA-Z0-9-]+):/g), (match) => match[1]),
  );
  for (const match of css.matchAll(/var\(--([a-zA-Z0-9-]+)/g))
    assert.ok(defined.has(match[1]), `Undefined CSS token: ${match[1]}`);
});

test("configuration controls rendered copy, home sections, navigation, settings and initial page", async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    logLevel: "error",
  });
  try {
    const { bookConfig: config } =
      await server.ssrLoadModule("/book.config.ts");
    config.defaultLocale = "en";
    const { BookPreferencesProvider } = await server.ssrLoadModule(
      "/src/hooks/use-book-preferences.tsx",
    );
    const { Landing } = await server.ssrLoadModule(
      "/src/components/book/Landing.tsx",
    );
    const { Header } = await server.ssrLoadModule(
      "/src/components/layout/Header.tsx",
    );
    const { default: App } = await server.ssrLoadModule("/src/App.tsx");
    const render = (Component) =>
      renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(
            BookPreferencesProvider,
            null,
            createElement(Component, { onSearch() {}, onSettings() {} }),
          ),
        ),
      );
    config.defaultLocale = "en";
    config.brand = "Config Test Brand";
    config.wordmark = "brand";
    config.pages.home.sections = ["cta", "hero"];
    config.pages.home.hero.title.en = [{ text: "Configured headline" }];
    config.pages.home.cta.title.en = "Configured CTA";
    const landing = render(Landing);
    assert.ok(
      landing.indexOf("Configured CTA") <
        landing.indexOf("Configured headline"),
    );
    assert.equal((landing.match(/data-home-section=/g) || []).length, 2);
    assert.ok(!landing.includes('data-home-section="reading"'));
    config.navigation = [
      {
        target: "library",
        label: { fa: "فهرست", en: "Configured navigation" },
        icon: "book",
      },
    ];
    config.features.search = false;
    config.features.studio = false;
    const header = render(Header);
    assert.match(header, /Configured navigation/);
    assert.match(header, /Config Test Brand/);
    assert.ok(!header.includes("nav-search"));
    assert.ok(!header.includes('href="/studio/"'));
    config.pages.home.mode = "landing";
    config.features.landingPage = false;
    const bookHome = render(App);
    assert.match(bookHome, /class="library-page"/);
    assert.ok(!bookHome.includes("data-home-section"));
    assert.ok(!bookHome.includes('href="/studio/"'));
    config.features.landingPage = true;
    assert.match(render(App), /data-home-section="hero"/);
    config.pages.home.mode = "studio";
    assert.match(render(App), /class="library-page"/);
    config.pages.home.mode = "library";
    assert.match(render(App), /class="library-page"/);
    config.pages.home.mode = "reader";
    config.pages.reader.sidebar = false;
    config.pages.reader.toc = false;
    config.pages.reader.print = false;
    config.pages.reader.bookmarks = false;
    const reader = render(App);
    assert.match(reader, /reader-no-sidebar/);
    assert.match(reader, /reader-no-toc/);
    assert.ok(!reader.includes('class="reader-sidebar"'));
    assert.ok(!reader.includes('class="reader-toc"'));
    assert.ok(!reader.includes('title="Print or save PDF"'));
  } finally {
    await server.close();
  }
});
