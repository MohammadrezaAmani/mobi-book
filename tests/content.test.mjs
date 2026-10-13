import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseFrontmatter,
  normalizeSlug,
  plainText,
  escapeHtml,
  safePublicPath,
} from "../scripts/content-utils.mjs";

test("parses Persian metadata and retains body without destructive transforms", () => {
  const src =
    '---\nid: chapter-one\ntitle: "قدرت اندیشه"\norder: 3\n---\n# سلام\n\nمتن اصلی\n';
  const { data, body } = parseFrontmatter(src);
  assert.equal(data.title, "قدرت اندیشه");
  assert.equal(data.order, "3");
  assert.equal(body, "# سلام\n\nمتن اصلی\n");
});
test("rejects malformed frontmatter", () => {
  assert.throws(() => parseFrontmatter("# No yaml"), "frontmatter");
  assert.throws(
    () => parseFrontmatter("---\n* wrong\n---\n"),
    "unsupported frontmatter",
  );
});
test("supports nested paths and index chapters", () => {
  assert.equal(
    normalizeSlug("src/content/fa/section/index.mdx", "fa"),
    "section",
  );
  assert.equal(
    normalizeSlug("src/content/en/03-reasoning.md", "en"),
    "03-reasoning",
  );
});
test("escapes HTML when prerendering untrusted content", () => {
  assert.equal(escapeHtml('<script>"&'), "&lt;script&gt;&quot;&amp;");
  assert.equal(safePublicPath("../foo"), false);
  assert.equal(safePublicPath("foo/bar"), true);
});
test("search source excludes fenced code blocks", () => {
  const source = "# Heading\n```js\nsecret()\n```\nHello **world**.";
  assert.equal(plainText(source).includes("secret()"), false);
  assert.match(plainText(source), /Hello world/);
});
test("generated manifest is ordered and references real content files", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../src/generated/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(manifest.length >= 10);
  for (const ch of manifest) {
    assert.ok(["fa", "en"].includes(ch.locale));
    assert.match(ch.id, /^[a-z0-9-]+$/);
    const file = new URL(`../src/content/${ch.file}`, import.meta.url);
    assert.ok((await readFile(file, "utf8")).includes(`id: ${ch.id}`));
  }
});
test("tolerates nested custom YAML while parsing top-level book fields", () => {
  const sample =
    '---\nid: sample\ntitle: "ریاضی و \"عقل\""\norder: 1\ntags:\n  - advanced\n  - practice\ncustom:\n  cover: cover.webp\n---\n# Book';
  // Proper JSON-quoted scalar is used by the Studio serializer.
  const valid = sample.replace(
    'title: "ریاضی و "عقل""',
    'title: "ریاضی و \\"عقل\\""',
  );
  const result = parseFrontmatter(valid);
  assert.equal(result.data.id, "sample");
  assert.equal(result.data.title, 'ریاضی و "عقل"');
  assert.match(result.body, /^# Book/);
});
