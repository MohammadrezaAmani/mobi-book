import type { bookConfig } from "../book.config";
export type SeoChapter = {
  locale: string;
  slug: string;
  title: string;
  description: string;
  translationKey: string;
  order: number;
};
export type PageSeo = {
  title: string;
  description: string;
  locale: string;
  canonical?: string;
  tags: { name?: string; property?: string; content: string }[];
  alternates: { locale: string; href: string }[];
  structuredData?: Record<string, unknown>;
  indexable: boolean;
};
export const seoStart: string;
export const seoEnd: string;
export function canonicalPath(
  config: typeof bookConfig,
  pathname: string,
  locale: string,
): string;
export function buildPageSeo(
  config: typeof bookConfig,
  chapters: SeoChapter[],
  options?: {
    pathname?: string;
    locale?: string;
    base?: string;
    origin?: string;
  },
): PageSeo;
export function renderSeoHead(seo: PageSeo): string;
export function replaceSeoHead(html: string, seo: PageSeo): string;
