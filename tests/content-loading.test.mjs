import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

test("Vite preserves raw Markdown and MDX while compiling normal MDX imports", async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    logLevel: "error",
  });
  try {
    const chapters = JSON.parse(
      await readFile(
        new URL("../src/generated/manifest.json", import.meta.url),
        "utf8",
      ),
    );
    for (const chapter of chapters) {
      const modulePath = `/src/content/${chapter.file}`;
      const source = await readFile(
        new URL(`../src/content/${chapter.file}`, import.meta.url),
        "utf8",
      );
      const raw = await server.ssrLoadModule(`${modulePath}?raw`);
      assert.equal(
        raw.default,
        source,
        `${chapter.file}?raw must export the original text`,
      );
      if (chapter.format === "mdx") {
        const compiled = await server.ssrLoadModule(modulePath);
        assert.equal(
          typeof compiled.default,
          "function",
          `${chapter.file} must export a component`,
        );
      }
    }
  } finally {
    await server.close();
  }
});
