import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseFrontmatter,
  normalizeSlug,
  plainText,
  safePublicPath,
} from "./content-utils.mjs";
import { loadBookConfig } from "./load-book-config.mjs";
import { validateConfig } from "./config-utils.mjs";

const config = validateConfig(await loadBookConfig());

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "src/content");
const outputRoot = path.join(root, "src/generated");
const results = [];
const searchable = [];
const errors = [];
const references = [];
const imageLinks = [];

async function walk(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(md|mdx)$/i.test(entry.name)) {
      try {
        const file = path.relative(root, full).split(path.sep).join("/");
        const locale = file.split("/")[2];
        if (!config.locales.includes(locale)) continue;
        const source = await readFile(full, "utf8");
        const { data, body } = parseFrontmatter(source, file);
        const required = ["id", "title", "description", "order"];
        for (const key of required)
          if (!data[key])
            throw new Error(`missing frontmatter property ${key}`);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(data.id))
          throw new Error("id must be lowercase kebab-case");
        const order = Number(data.order);
        if (!Number.isFinite(order)) throw new Error("order must be numeric");
        const slug = normalizeSlug(file, locale);
        if (!safePublicPath(slug)) throw new Error("unsafe slug");
        const textWithoutCode = body.replace(/```[\s\S]*?```/g, "");
        for (const ref of textWithoutCode.matchAll(
          /\[\[chapter:([a-z0-9-]+)\]\]/g,
        ))
          references.push({ file, locale, id: ref[1] });
        for (const ref of textWithoutCode.matchAll(
          /<BookRef\s+to=["']([a-z0-9-]+)["']/g,
        ))
          references.push({ file, locale, id: ref[1] });
        for (const img of textWithoutCode.matchAll(
          /!\[[^\]]*\]\((images\/[^)]+)\)/g,
        ))
          imageLinks.push({ file, path: img[1] });
        for (const img of textWithoutCode.matchAll(
          /<Figure[^>]+src=["'](images\/[^"']+)["']/g,
        ))
          imageLinks.push({ file, path: img[1] });
        const headings = Array.from(body.matchAll(/^#{2,4}\s+(.+)$/gm), (m) =>
          m[1].replace(/\s*\{#.*?\}\s*$/, "").trim(),
        );
        const entry = {
          id: data.id,
          locale,
          title: data.title,
          description: data.description,
          slug,
          file: file.replace("src/content/", ""),
          order,
          category: data.category || config.content.defaultCategory[locale],
          duration: Math.max(
            1,
            Math.ceil(
              plainText(body).split(/\s+/).length /
                config.languages[locale].readingSpeed,
            ),
          ),
          headings,
          translationKey: data.translationKey || data.id,
          format: file.endsWith(".mdx") ? "mdx" : "md",
        };
        results.push(entry);
        searchable.push({
          id: `${locale}/${slug}`,
          locale,
          slug,
          title: data.title,
          description: data.description,
          body: plainText(body).slice(0, config.search.maxIndexedCharacters),
        });
      } catch (error) {
        errors.push(`${path.relative(root, full)}: ${error.message}`);
      }
    }
  }
}
await walk(contentRoot);
const paths = new Set();
const ids = new Set();
for (const entry of results) {
  const url = `${entry.locale}/${entry.slug}`;
  if (paths.has(url)) errors.push(`Duplicate route ${url}`);
  if (ids.has(`${entry.locale}/${entry.id}`))
    errors.push(`Duplicate chapter id ${entry.locale}/${entry.id}`);
  paths.add(url);
  ids.add(`${entry.locale}/${entry.id}`);
}
for (const reference of references) {
  if (!ids.has(`${reference.locale}/${reference.id}`))
    errors.push(
      `${reference.file}: broken chapter reference [[chapter:${reference.id}]]`,
    );
}
for (const img of imageLinks) {
  if (
    !safePublicPath(img.path) ||
    !existsSync(path.join(root, "public", img.path))
  )
    errors.push(`${img.file}: missing or unsafe local image ${img.path}`);
}
if (errors.length) {
  console.error(
    "\nBook validation failed:\n" + errors.map((e) => "  - " + e).join("\n"),
  );
  process.exit(1);
}
results.sort(
  (a, b) =>
    a.locale.localeCompare(b.locale) ||
    a.order - b.order ||
    a.slug.localeCompare(b.slug),
);
await mkdir(outputRoot, { recursive: true });
await writeFile(
  path.join(outputRoot, "manifest.json"),
  JSON.stringify(results, null, 2) + "\n",
);
await writeFile(
  path.join(outputRoot, "search-index.json"),
  JSON.stringify(searchable, null, 2) + "\n",
);
console.log(
  `Validated ${results.length} chapters, ${new Set(results.map((x) => x.locale)).size} locales.`,
);
