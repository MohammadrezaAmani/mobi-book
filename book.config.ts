import visualEditorMessages from "./config/visual-editor.json" with { type: "json" };
import appearance from "./config/appearance.json" with { type: "json" };
import messages from "./config/messages.json" with { type: "json" };
import pages from "./config/pages.json" with { type: "json" };
import studio from "./config/studio.json" with { type: "json" };
import styles from "./config/styles.json" with { type: "json" };
import seo from "./config/seo.json" with { type: "json" };

export type StyleRule = {
  selector?: string;
  atRule?: string;
  params?: string;
  properties?: Record<string, string>;
  rules?: StyleRule[];
};
export type ThemeConfig = {
  id: string;
  label: Record<string, string>;
  icon: string;
  swatch: string;
  iconColor: string;
  diagramTheme: "default" | "dark" | "neutral" | "forest";
  tokens: Record<string, string>;
};
export type FontConfig = {
  id: string;
  label: Record<string, string>;
  families: Record<string, string>;
};

/** Public configuration. This file is safe to edit in every fork. */
export const bookConfig = {
  id: "the-art-of-thinking",
  brand: "Mobi", // Visible header wordmark; choose a short name for your own book.
  wordmark: "book" as "book" | "brand", // Use the book title in the published reader.
  title: { fa: "هنرِ اندیشیدن", en: "The Art of Thinking" },
  subtitle: {
    fa: "سفری از پرسش تا کشف",
    en: "A journey from curiosity to discovery",
  },
  description: {
    fa: "دربارهٔ ایده‌ها، منطق، خلاقیت و چیزهایی که جهان‌بینی ما را می‌سازند.",
    en: "A field guide to ideas, reasoning, creativity, and the things that shape our world.",
  },
  author: { fa: "نویسندهٔ کتاب", en: "Book Author" },
  edition: "1.0",
  year: "2026",
  cover: "images/cover-art.svg",
  repository: "https://github.com/MohammadrezaAmani/mobi-book",
  defaultLocale: "fa",
  locales: ["fa", "en"],
  languages: {
    fa: {
      label: "فارسی",
      shortLabel: "FA",
      direction: "rtl",
      uiFont: "'Vazirmatn Variable','Inter Variable',sans-serif",
      readingSpeed: 210,
    },
    en: {
      label: "English",
      shortLabel: "EN",
      direction: "ltr",
      uiFont: "'Inter Variable','Vazirmatn Variable',sans-serif",
      readingSpeed: 210,
    },
  } as Record<
    string,
    {
      label: string;
      shortLabel: string;
      direction: "rtl" | "ltr";
      uiFont: string;
      readingSpeed: number;
    }
  >,
  siteUrl: "https://mohammadrezaamani.github.io", // Site origin; VITE_SITE_URL overrides it at build time.
  seo,
  license: "CC BY 4.0",
  favicon: "favicon.svg",
  brandLogo: "", // Optional image URL; the book icon is used when empty.
  brandSuffix: ".",
  brandIcon: "book",
  chapterNumberDigits: 2,
  persistence: { namespace: "mobi", assetsDatabase: "mobi-studio-assets" },
  appearance: {
    ...appearance,
    themes: appearance.themes as ThemeConfig[],
    fonts: appearance.fonts as FontConfig[],
    styles: styles as StyleRule[],
  },
  messages: messages as Record<string, typeof messages.fa>,
  pages,
  studio: {
    ...studio,
    visualEditorMessages: visualEditorMessages as Record<
      string,
      Record<string, string>
    >,
  },
  navigation: [
    { target: "home", label: { fa: "خانه", en: "Home" }, icon: "book" },
    {
      target: "library",
      label: { fa: "فصل‌ها", en: "Chapters" },
      icon: "menu",
    },
    {
      target: "studio",
      label: { fa: "استودیو", en: "Studio" },
      icon: "feather",
    },
  ],
  features: {
    search: true,
    settings: true,
    languageSwitch: true,
    repositoryLink: true,
    writeButton: true,
    bottomNavigation: true,
    studio: false, // Enable the browser authoring tools when needed.
    landingPage: false, // Enable the Mobi introduction/marketing page.
  },
  routing: {
    mode: "hash" as "hash" | "browser",
    indexableEntryPoints: true,
  },
  search: {
    maxResults: 12,
    snippetBefore: 75,
    snippetAfter: 145,
    maxIndexedCharacters: 25000,
  },
  shortcuts: {
    searchKey: "k",
    searchLabel: "⌘ K",
    quickSearchKey: "/",
    escapeLabel: "ESC",
  },
  timing: { copied: 1700, toast: 3500, searchFocus: 60 },
  typography: {
    latin: "'Inter Variable',sans-serif",
    serif: "Georgia,serif",
    mono: "'SFMono-Regular',Consolas,monospace",
    diagram: "Inter, Vazirmatn, sans-serif",
  },
  content: {
    defaultCategory: { fa: "فصل", en: "Chapter" },
    defaultCallout: "note",
    callouts: [
      { id: "note", icon: "info", label: { fa: "یادداشت", en: "Note" } },
      { id: "tip", icon: "bulb", label: { fa: "نکته", en: "Tip" } },
      { id: "warning", icon: "warning", label: { fa: "هشدار", en: "Warning" } },
    ],
  },
  meta: {
    titleSeparator: " | ",
    librarySummary: { fa: "مرور فصل‌های کتاب", en: "Browse the book chapters" },
    studioSummary: {
      fa: "ویرایشگر Markdown و MDX در مرورگر",
      en: "Browser-only Markdown and MDX editor",
    },
  },
};
