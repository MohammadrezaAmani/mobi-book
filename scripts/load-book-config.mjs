import { readFile } from "node:fs/promises";
import ts from "typescript";

/** Load the same public TS configuration in Node 22 builds and browser tooling. */
export async function loadBookConfig() {
  const url = new URL("../book.config.ts", import.meta.url);
  const source = await readFile(url, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const code = compiled.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (_, before, file, after) => before + new URL(file, url).href + after,
  );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
    )
  ).bookConfig;
}
