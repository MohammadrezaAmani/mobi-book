import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import path from "node:path";
import { readFileSync } from "node:fs";
import { makeBookReferences } from "./scripts/remark-book-refs.mjs";
import { bookConfig } from "./book.config";
import { configCss, validateConfig } from "./scripts/config-utils.mjs";
import { buildPageSeo, replaceSeoHead } from "./scripts/seo.mjs";

validateConfig(bookConfig);

const base = process.env.VITE_BASE_PATH || "/";
const chapters = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "src/generated/manifest.json"),
    "utf8",
  ),
);
const mdxPlugin = mdx({
  remarkPlugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkMath,
    [makeBookReferences, { chapters, base, mode: bookConfig.routing.mode }],
  ],
  rehypePlugins: [rehypeKatex, rehypeSlug],
});

export default defineConfig({
  base,
  plugins: [
    {
      name: "book-configuration",
      transformIndexHtml(html) {
        const locale = bookConfig.defaultLocale;
        const escape = (value: string) =>
          value.replace(
            /[&<>"']/g,
            (character) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[character]!,
          );
        const theme = bookConfig.appearance.themes.find(
          (item) => item.id === bookConfig.appearance.defaults.theme,
        )!;
        const document = html
          .replace("__BOOK_LOCALE__", escape(locale))
          .replace("__BOOK_DIRECTION__", bookConfig.languages[locale].direction)
          .replace(
            "__BOOK_TITLE__",
            escape(bookConfig.title[locale as keyof typeof bookConfig.title]),
          )
          .replace(
            "__BOOK_DESCRIPTION__",
            escape(
              bookConfig.description[
                locale as keyof typeof bookConfig.description
              ],
            ),
          )
          .replace("__BOOK_THEME_COLOR__", escape(theme.tokens.bg))
          .replace(
            "__BOOK_FAVICON__",
            escape(
              /^https?:/.test(bookConfig.favicon)
                ? bookConfig.favicon
                : base + bookConfig.favicon.replace(/^\//, ""),
            ),
          )
          .replace(
            "<html ",
            `<html data-theme="${escape(bookConfig.appearance.defaults.theme)}" data-font="${escape(bookConfig.appearance.defaults.font)}" `,
          )
          .replace(
            "</head>",
            `<style id="book-configuration">${configCss(bookConfig, base)}</style></head>`,
          );
        return replaceSeoHead(
          document,
          buildPageSeo(bookConfig, chapters, {
            base,
            origin: process.env.VITE_SITE_URL || bookConfig.siteUrl,
          }),
        );
      },
    },
    {
      enforce: "pre",
      ...mdxPlugin,
      transform(code, id) {
        // Vite has already loaded ?raw imports as string-exporting JavaScript.
        // MDX's filter strips query parameters, so skip these before compilation.
        if (/[?&]raw(?:[=&]|$)/.test(id)) return;
        return mdxPlugin.transform(code, id);
      },
    },
    react({ include: /\.(jsx|js|tsx|ts|mdx)$/ }),
    tailwindcss(),
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  build: { target: "es2022", cssCodeSplit: true, sourcemap: false },
});
