import type { ComponentType } from "react";
import manifest from "@/generated/manifest.json";
import { bookConfig } from "../../book.config";
import { routeHref } from "../../scripts/routing.mjs";
export { homeMode } from "../../scripts/routing.mjs";

export type Locale = string;
export type Chapter = {
  id: string;
  locale: Locale;
  title: string;
  description: string;
  order: number;
  category: string;
  slug: string;
  file: string;
  duration: number;
  headings: string[];
  translationKey: string;
  format: "md" | "mdx";
};
export const chapters = manifest as Chapter[];
export const config = bookConfig;
export const base = import.meta.env.BASE_URL;
export const assetUrl = (path: string) =>
  /^(https?:|data:|blob:)/i.test(path) ? path : base + path.replace(/^\//, "");
export const getChapters = (locale: Locale) =>
  chapters.filter((c) => c.locale === locale).sort((a, b) => a.order - b.order);
export const getChapter = (locale: Locale, slug: string) =>
  chapters.find((c) => c.locale === locale && c.slug === slug);
export const readPath = (chapter: Chapter) =>
  `/read/${chapter.locale}/${chapter.slug}/`;
export const publicHref = (path: string) =>
  routeHref(path, { base, mode: config.routing.mode });
export function localized<T>(obj: Record<Locale, T>, locale: Locale): T {
  return obj[locale] ?? obj[config.defaultLocale];
}
export const language = (locale: Locale) =>
  config.languages[locale] || config.languages[config.defaultLocale];
export const isRtl = (locale: Locale) => language(locale).direction === "rtl";
export const nextLocale = (locale: Locale) =>
  config.locales[(config.locales.indexOf(locale) + 1) % config.locales.length];
export const storageKey = (key: string) =>
  `${config.persistence.namespace}:${key}`;
export const chapterNumber = (value: number) =>
  String(value).padStart(config.chapterNumberDigits, "0");
export function targetPath(target: string, locale: Locale): string {
  if (target === "home") return "/";
  if (target === "library") return "/library/";
  if (target === "studio")
    return config.features.studio ? "/studio/" : "/library/";
  if (target === "repository") return config.repository;
  if (target === "first-chapter") {
    const first = getChapters(locale)[0];
    return first ? readPath(first) : "/library/";
  }
  return target;
}
export const getTranslation = (chapter: Chapter, locale: Locale) =>
  chapters.find(
    (x) => x.translationKey === chapter.translationKey && x.locale === locale,
  );

const rawFiles = import.meta.glob<string>("../content/**/*.{md,mdx}", {
  query: "?raw",
  import: "default",
});
const mdxFiles = import.meta.glob<{
  default: ComponentType<{ components?: Record<string, unknown> }>;
}>("../content/**/*.mdx");

export async function loadRaw(chapter: Chapter): Promise<string> {
  const loader = rawFiles[`../content/${chapter.file}`];
  if (!loader) throw new Error(`Content file missing: ${chapter.file}`);
  return loader();
}
export async function loadCompiled(chapter: Chapter) {
  if (chapter.format !== "mdx") return undefined;
  const loader = mdxFiles[`../content/${chapter.file}`];
  if (!loader) throw new Error(`MDX module missing: ${chapter.file}`);
  return (await loader()).default;
}
export function removeFrontmatter(source: string) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}
export function resolveReferences(text: string, locale: Locale) {
  return text.replace(/\[\[chapter:([a-z0-9-]+)\]\]/g, (all, id: string) => {
    const chapter = chapters.find((c) => c.locale === locale && c.id === id);
    return chapter
      ? `[${chapter.title}](${publicHref(readPath(chapter))})`
      : all;
  });
}
