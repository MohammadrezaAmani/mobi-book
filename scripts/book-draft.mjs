import messages from "../config/messages.json" with { type: "json" };
import studioOptions from "../config/studio.json" with { type: "json" };
const defaultMessages = messages.en || Object.values(messages)[0];
const formatMessage = (text, values) =>
  text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));

/**
 * Portable Markdown/MDX document serialization. No browser APIs or dependencies.
 * Unknown YAML fields, comments, nested metadata and content are never discarded.
 */
export function safeFilename(
  input,
  preferredExt = studioOptions.defaultExtension,
) {
  const ext = /\.mdx?$/i.exec(input)?.[0]?.toLowerCase() || preferredExt;
  const stem = input
    .replace(/\.mdx?$/i, "")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .toLowerCase();
  return `${stem || studioOptions.fallbackFilenameStem}${ext}`;
}

function parseYamlScalar(raw) {
  const s = (raw || "").trim();
  if (/^"(?:\\.|[^"\\])*"$/.test(s)) {
    try {
      return JSON.parse(s);
    } catch {
      return s.slice(1, -1);
    }
  }
  if (s.startsWith("'") && s.endsWith("'"))
    return s.slice(1, -1).replace(/''/g, "'");
  return s.replace(/\s+#.*$/, "");
}

function getScalar(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? parseYamlScalar(match[1]) : "";
}

export function fromSource(
  source,
  filename,
  locale = studioOptions.importDefaultLocale,
  uid,
) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatterRaw = match ? match[1] : "";
  const resultFilename = safeFilename(filename);
  return {
    uid:
      uid ||
      `${locale}-${resultFilename}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    id:
      getScalar(frontmatterRaw, "id") || resultFilename.replace(/\.mdx?$/, ""),
    title:
      getScalar(frontmatterRaw, "title") || filename.replace(/\.mdx?$/i, ""),
    description: getScalar(frontmatterRaw, "description") || "",
    order:
      Number(getScalar(frontmatterRaw, "order")) ||
      studioOptions.importDefaultOrder,
    filename: resultFilename,
    locale,
    body: match ? source.slice(match[0].length) : source,
    frontmatterRaw,
  };
}

function yamlValue(value) {
  return JSON.stringify(String(value));
}

export function toSource(d, copy = defaultMessages) {
  const lines = d.frontmatterRaw?.trimEnd()
    ? d.frontmatterRaw.split(/\r?\n/)
    : [];
  const replaceOrAdd = (key, value) => {
    const index = lines.findIndex((line) => new RegExp(`^${key}:`).test(line));
    if (index >= 0) lines[index] = `${key}: ${value}`;
    else lines.push(`${key}: ${value}`);
  };
  const id = String(d.id).trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(copy.invalidChapterId);
  if (!String(d.title).trim()) throw new Error(copy.emptyChapterTitle);
  if (!Number.isFinite(Number(d.order)))
    throw new Error(copy.invalidChapterOrder);
  replaceOrAdd("id", id);
  replaceOrAdd("title", yamlValue(d.title));
  replaceOrAdd("description", yamlValue(d.description || ""));
  replaceOrAdd("order", Number(d.order));
  // Existing translationKey / category / author / custom metadata remain unchanged.
  if (!lines.some((line) => /^translationKey:/.test(line)))
    replaceOrAdd("translationKey", id);
  return `---\n${lines.join("\n")}\n---\n${d.body.startsWith("\n") ? "" : "\n"}${d.body.replace(/\s*$/, "\n")}`;
}

export function draftPath(d) {
  return `src/content/${d.locale}/${safeFilename(d.filename)}`;
}

export function collectDraftErrors(drafts, copy = defaultMessages) {
  const issues = [],
    destinations = new Set(),
    ids = new Set();
  for (const d of drafts) {
    const target = draftPath(d),
      id = `${d.locale}:${d.id}`;
    if (destinations.has(target))
      issues.push(formatMessage(copy.duplicateOutputFile, { file: target }));
    if (ids.has(id))
      issues.push(formatMessage(copy.duplicateChapterId, { id }));
    destinations.add(target);
    ids.add(id);
    try {
      toSource(d, copy);
    } catch (error) {
      issues.push(`${target}: ${error.message}`);
    }
  }
  return issues;
}
