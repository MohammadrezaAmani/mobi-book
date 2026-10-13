import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBookReferences } from "../scripts/remark-book-refs.mjs";
const chapters = [
  { id: "preface", locale: "fa", slug: "01-preface", title: "مقدمه" },
  { id: "preface", locale: "en", slug: "01-preface", title: "Preface" },
];
test("MDX reference plugin resolves locale and nested Github Pages base", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Read [[chapter:preface]] today." }],
      },
    ],
  };
  makeBookReferences({ chapters, base: "/my-book/" })(tree, {
    path: "/home/src/content/fa/intro.mdx",
  });
  const links = tree.children[0].children;
  assert.deepEqual(
    links.map((x) => x.type),
    ["text", "link", "text"],
  );
  assert.equal(links[1].url, "/my-book/#/read/fa/01-preface/");
  assert.equal(links[1].children[0].value, "مقدمه");
});
test("plugin leaves fenced code, external links and unknown references intact", () => {
  const tree = {
    type: "root",
    children: [
      { type: "code", value: "[[chapter:preface]]" },
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "https://example.com",
            children: [{ type: "text", value: "[[chapter:preface]]" }],
          },
          { type: "text", value: " [[chapter:no-such]]" },
        ],
      },
    ],
  };
  makeBookReferences({ chapters, base: "/" })(tree, {
    path: "/home/src/content/en/file.mdx",
  });
  assert.equal(tree.children[0].value, "[[chapter:preface]]");
  assert.equal(
    tree.children[1].children[0].children[0].value,
    "[[chapter:preface]]",
  );
  assert.equal(tree.children[1].children[1].value, " ");
  assert.equal(tree.children[1].children[2].value, "[[chapter:no-such]]");
});
