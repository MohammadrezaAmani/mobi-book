/** Fail deployment if the generated GitHub Pages artifact has missing routes/assets. */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadBookConfig } from "./load-book-config.mjs";

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
  ...(config.features.studio ? ["studio/index.html"] : []),
  ...manifest.map((ch) => `read/${ch.locale}/${ch.slug}/index.html`),
];
const failures = [];
for (const route of checks) {
  try {
    const content = await readFile(path.join(out, route), "utf8");
    if (!content.includes('<div id="root">'))
      failures.push(`${route}: missing React mount point`);
    if (!content.includes("<title>")) failures.push(`${route}: missing title`);
    if (route.startsWith("read/")) {
      const locale = route.split("/")[1];
      if (!content.includes(`lang="${locale}"`))
        failures.push(`${route}: wrong locale metadata`);
      if (!content.includes(`dir="${config.languages[locale].direction}"`))
        failures.push(`${route}: wrong direction metadata`);
    }
  } catch {
    failures.push(`${route}: missing static route`);
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
