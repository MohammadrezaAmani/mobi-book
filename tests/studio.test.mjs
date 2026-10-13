import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fromSource,
  toSource,
  safeFilename,
  collectDraftErrors,
  draftPath,
} from "../scripts/book-draft.mjs";

test("preserves arbitrary frontmatter fields, nested metadata and comments across edits", () => {
  const text =
    '---\nid: real-chapter\ntitle: "فصل اول"\ndescription: old\norder: 1\n# Keep me\ntags:\n  - alpha\n  - beta\ncustom:\n  color: blue\ntranslationKey: shared-id\n---\n\n# Heading\n\n<Custom x={1} />\n';
  const draft = fromSource(text, "hello.mdx", "fa");
  draft.title = "عنوان تازه";
  draft.description = "A: B";
  draft.body += "\nMore text.\n";
  const out = toSource(draft);
  assert.match(out, /title: "عنوان تازه"/);
  assert.match(out, /description: "A: B"/);
  assert.match(out, /# Keep me\ntags:\n  - alpha\n  - beta/);
  assert.match(out, /custom:\n  color: blue/);
  assert.match(out, /translationKey: shared-id/);
  assert.match(out, /<Custom x=\{1\} \/>/);
});
test("retains raw source formatting when no body change is made", () => {
  const source =
    '---\nid: intro\ntitle: "Hello"\ndescription: ""\norder: 1\ntranslationKey: intro\n---\n\n# Hello\n';
  const doc = fromSource(source, "intro.md", "en");
  assert.equal(doc.filename, "intro.md");
  assert.equal(toSource(doc), source);
});
test("rejects duplicate destinations, duplicate ids, malformed chapter identity", () => {
  const a = fromSource("# hello", "03-chapter.md", "fa");
  a.id = "chap";
  a.title = "Hello";
  const b = fromSource("# bye", "03-chapter.md", "fa");
  b.id = "chap";
  b.title = "Bye";
  assert.equal(collectDraftErrors([a, b]).length, 2);
  b.filename = "other.mdx";
  b.id = "ok";
  assert.equal(collectDraftErrors([a, b]).length, 0);
  a.id = "../../bad";
  assert.match(collectDraftErrors([a])[0], /Chapter id/);
});
test("prevents output path traversal via filenames", () => {
  assert.equal(safeFilename("../../foo/../../bar.md"), "foo-bar.md");
  const d = fromSource("# A", "../../evil.mdx");
  assert.equal(draftPath(d), "src/content/fa/evil.mdx");
});
