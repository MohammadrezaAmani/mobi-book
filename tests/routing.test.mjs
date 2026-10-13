import { test } from "node:test";
import assert from "node:assert/strict";
import {
  routeHref,
  contentRoute,
  legacyHashUrl,
  homeMode,
} from "../scripts/routing.mjs";
import { makeBookReferences } from "../scripts/remark-book-refs.mjs";

test("public hash URLs keep the GitHub Pages folder outside the route fragment", () => {
  assert.equal(routeHref("/read/fa/chapter/"), "/#/read/fa/chapter/");
  assert.equal(
    routeHref("/read/en/part/chapter/#section", { base: "/my-book/" }),
    "/my-book/#/read/en/part/chapter/#section",
  );
  assert.equal(
    routeHref("/studio/?from=fa%2Fchapter.mdx", { base: "/my-book/" }),
    "/my-book/#/studio/?from=fa%2Fchapter.mdx",
  );
  assert.equal(
    routeHref("/read/fa/chapter/", { base: "/my-book/", mode: "browser" }),
    "/my-book/read/fa/chapter/",
  );
});

test("book content links and anchors resolve to logical routes; assets and external links keep their URLs", () => {
  const options = { base: "/my-book/", from: "/read/en/chapter/?a=1" };
  assert.equal(
    contentRoute("/my-book/#/read/en/next/", options),
    "/read/en/next/",
  );
  assert.equal(
    contentRoute("/my-book/read/en/next/", options),
    "/read/en/next/",
  );
  assert.equal(contentRoute("../next/", options), "/read/en/next/");
  assert.equal(
    contentRoute("#heading", options),
    "/read/en/chapter/?a=1#heading",
  );
  assert.equal(contentRoute("https://example.com/chapter", options), undefined);
  assert.equal(contentRoute("//example.com/chapter", options), undefined);
  assert.equal(contentRoute("/my-book/images/cover.svg", options), undefined);
  assert.equal(contentRoute("../notes.pdf", options), undefined);
});

test("existing physical chapter URLs upgrade to hashes without losing queries or heading anchors", () => {
  assert.equal(
    legacyHashUrl(
      {
        pathname: "/my-book/read/fa/chapter/",
        search: "?a=1",
        hash: "#heading",
      },
      "/my-book/",
    ),
    "/my-book/#/read/fa/chapter/?a=1#heading",
  );
  assert.equal(
    legacyHashUrl(
      { pathname: "/my-book/studio/", hash: "#/library/" },
      "/my-book/",
    ),
    "/my-book/#/library/",
  );
  assert.equal(
    legacyHashUrl(
      { pathname: "/my-book/", hash: "#/read/fa/chapter/" },
      "/my-book/",
    ),
    undefined,
  );
  assert.equal(
    legacyHashUrl({ pathname: "/another/read/fa/chapter/" }, "/my-book/"),
    undefined,
  );
});

test("landing and studio switches independently fall back to the configured book page", () => {
  for (const studio of [false, true]) {
    for (const landingPage of [false, true]) {
      const config = {
        features: { studio, landingPage },
        pages: { home: { mode: "landing", bookMode: "reader" } },
      };
      assert.equal(homeMode(config), landingPage ? "landing" : "reader");
      config.pages.home.mode = "studio";
      assert.equal(homeMode(config), studio ? "studio" : "reader");
    }
  }
});

test("MDX references support configured languages and both routing modes", () => {
  for (const mode of ["hash", "browser"]) {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "[[chapter:intro]]" }],
        },
      ],
    };
    makeBookReferences({
      chapters: [{ id: "intro", locale: "ar", slug: "intro", title: "مقدمة" }],
      base: "/my-book/",
      mode,
    })(tree, { path: "/src/content/ar/example.mdx" });
    assert.equal(
      tree.children[0].children[0].url,
      routeHref("/read/ar/intro/", { base: "/my-book/", mode }),
    );
  }
});
