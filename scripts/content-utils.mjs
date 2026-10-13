import path from "node:path";

/**
 * Parse book frontmatter. Required fields are top-level YAML scalars;
 * unknown collections and nested metadata are preserved, not interpreted.
 * For complete YAML schema support use an external editor/build extension.
 */
export function parseFrontmatter(source, filename = "chapter") {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match)
    throw new Error(`${filename}: expected YAML frontmatter (--- ... ---)`);
  const data = {};
  const lines = match[1].split(/\r?\n/);
  let nestedParent = "";
  for (const [i, line] of lines.entries()) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^\s+/.test(line) || /^-\s/.test(line)) {
      if (!nestedParent)
        throw new Error(
          `${filename}:${i + 2}: unexpected indentation in frontmatter`,
        );
      continue;
    }
    const prop = line.match(/^([\w-]+):\s*(.*)$/);
    if (!prop)
      throw new Error(`${filename}:${i + 2}: malformed frontmatter property`);
    const [, key, raw] = prop;
    nestedParent = key;
    let value = raw.trim();
    if (/^"(?:\\.|[^"\\])*"$/.test(value)) {
      try {
        value = JSON.parse(value);
      } catch {
        throw new Error(
          `${filename}:${i + 2}: invalid JSON-quoted YAML scalar`,
        );
      }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/''/g, "'");
    } else {
      value = value.replace(/\s+#.*$/, "");
    }
    // Root-level sequences and objects are allowed but are not used for chapter metadata.
    if (
      value === "" ||
      value === "|" ||
      value === ">" ||
      value.startsWith("[") ||
      value.startsWith("{")
    )
      continue;
    data[key] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

export function normalizeSlug(file, locale) {
  const prefix = `src/content/${locale}/`;
  const rel = file.replaceAll("\\", "/").split(prefix)[1];
  if (!rel) throw new Error(`Cannot determine slug for ${file}`);
  return rel
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/index$/, "")
    .replaceAll(" ", "-");
}

export function plainText(source) {
  return source
    .replace(/^---\n[\s\S]*?\n---\n?/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[\*_`#~>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function safePublicPath(value) {
  return (
    !value.includes("..") && !path.isAbsolute(value) && !value.includes("\\")
  );
}
