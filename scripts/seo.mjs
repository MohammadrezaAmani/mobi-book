import { escapeHtml } from "./content-utils.mjs";
import { normalizeBase, homeMode } from "./routing.mjs";

export const seoStart = "<!-- book-seo:start -->";
export const seoEnd = "<!-- book-seo:end -->";
const localized = (value, locale, config) =>
  value[locale] ?? value[config.defaultLocale];
const chapterPath = (chapter) => `/read/${chapter.locale}/${chapter.slug}/`;

export function canonicalPath(config, pathname, locale) {
  if (pathname === "/" || pathname.startsWith("/library")) {
    if (locale === config.defaultLocale)
      return pathname === "/" || homeMode(config) === "library"
        ? "/"
        : "/library/";
    return `/library/${locale}/`;
  }
  return pathname.endsWith("/") ? pathname : pathname + "/";
}

export function buildPageSeo(
  config,
  chapters,
  {
    pathname = "/",
    locale = config.defaultLocale,
    base = "/",
    origin = config.siteUrl,
  } = {},
) {
  pathname = pathname.split(/[?#]/)[0];
  const chapter = chapters.find(
    (ch) => chapterPath(ch) === pathname.replace(/\/?$/, "/"),
  );
  const localeMatch = /^\/library\/([^/]+)\/?$/.exec(pathname);
  locale = chapter?.locale || localeMatch?.[1] || locale;
  if (!config.locales.includes(locale)) locale = config.defaultLocale;
  const bookTitle = localized(config.title, locale, config);
  const studio =
    config.features.studio &&
    (/^\/studio(?:\/|$)/.test(pathname) ||
      (pathname === "/" && homeMode(config) === "studio"));
  const known = Boolean(
    chapter ||
    pathname === "/" ||
    /^\/library\/?$/.test(pathname) ||
    (localeMatch && config.locales.includes(localeMatch[1])) ||
    studio,
  );
  const indexable = config.seo.indexable && known && !studio;
  const title = chapter
    ? `${chapter.title}${config.meta.titleSeparator}${bookTitle}`
    : studio
      ? config.studio.name.replace("{brand}", config.brand) +
        config.meta.titleSeparator +
        bookTitle
      : bookTitle;
  const description =
    chapter?.description ||
    (studio
      ? localized(config.meta.studioSummary, locale, config)
      : localized(config.description, locale, config));
  const prefix = normalizeBase(base);
  const site = origin ? new URL(origin).origin : "";
  const absolute = (path) =>
    site ? new URL(prefix + path.replace(/^\//, ""), site).href : undefined;
  const canonical = known
    ? absolute(canonicalPath(config, pathname, locale))
    : undefined;
  const image = config.seo.socialImage
    ? /^https?:\/\//.test(config.seo.socialImage)
      ? config.seo.socialImage
      : absolute(config.seo.socialImage)
    : undefined;
  const tags = [
    { name: "description", content: description },
    { name: "author", content: localized(config.author, locale, config) },
    {
      name: "robots",
      content: indexable ? config.seo.robots : "noindex, follow",
    },
    { property: "og:type", content: chapter ? "article" : "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: bookTitle },
    {
      property: "og:locale",
      content: config.seo.openGraphLocales[locale] || locale.replace("-", "_"),
    },
    {
      name: "twitter:card",
      content: image ? config.seo.twitterCard : "summary",
    },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (canonical) tags.push({ property: "og:url", content: canonical });
  if (image)
    tags.push(
      { property: "og:image", content: image },
      { property: "og:image:alt", content: bookTitle },
      {
        property: "og:image:width",
        content: String(config.seo.socialImageWidth),
      },
      {
        property: "og:image:height",
        content: String(config.seo.socialImageHeight),
      },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: bookTitle },
    );
  if (config.seo.twitterSite)
    tags.push({ name: "twitter:site", content: config.seo.twitterSite });
  if (config.seo.googleSiteVerification)
    tags.push({
      name: "google-site-verification",
      content: config.seo.googleSiteVerification,
    });
  const translations = chapter
    ? chapters.filter((ch) => ch.translationKey === chapter.translationKey)
    : [];
  const alternates =
    canonical && indexable
      ? chapter
        ? translations.map((ch) => ({
            locale: ch.locale,
            href: absolute(chapterPath(ch)),
          }))
        : config.locales.map((lang) => ({
            locale: lang,
            href: absolute(canonicalPath(config, pathname, lang)),
          }))
      : [];
  const defaultAlternate = alternates.find(
    (item) => item.locale === config.defaultLocale,
  );
  if (defaultAlternate)
    alternates.push({ locale: "x-default", href: defaultAlternate.href });
  for (const item of alternates.filter(
    (item) => ![locale, "x-default"].includes(item.locale),
  ))
    tags.push({
      property: "og:locale:alternate",
      content: config.seo.openGraphLocales[item.locale] || item.locale,
    });

  let structuredData;
  if (canonical && indexable && config.seo.structuredData) {
    const homeUrl = absolute(canonicalPath(config, "/library/", locale));
    const bookId = homeUrl + "#book";
    const book = {
      "@type": "Book",
      "@id": bookId,
      name: bookTitle,
      description: localized(config.description, locale, config),
      author: {
        "@type": "Person",
        name: localized(config.author, locale, config),
      },
      inLanguage: locale,
      bookEdition: config.edition,
      url: homeUrl,
      image: absolute(config.cover),
      isAccessibleForFree: true,
      hasPart: chapters
        .filter((ch) => ch.locale === locale)
        .map((ch) => ({
          "@type": "Chapter",
          "@id": absolute(chapterPath(ch)) + "#chapter",
          name: ch.title,
          url: absolute(chapterPath(ch)),
          position: ch.order,
        })),
    };
    const entity = chapter
      ? {
          "@type": "Chapter",
          "@id": canonical + "#chapter",
          name: chapter.title,
          description,
          inLanguage: locale,
          position: chapter.order,
          url: canonical,
          isPartOf: { "@id": bookId },
          author: book.author,
          isAccessibleForFree: true,
        }
      : { "@id": bookId };
    const breadcrumbs = [
      { "@type": "ListItem", position: 1, name: bookTitle, item: homeUrl },
    ];
    if (chapter)
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: chapter.title,
        item: canonical,
      });
    structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        book,
        {
          "@type": "WebPage",
          "@id": canonical + "#webpage",
          url: canonical,
          name: title,
          description,
          inLanguage: locale,
          mainEntity: entity,
          breadcrumb: { "@id": canonical + "#breadcrumbs" },
        },
        ...(chapter ? [entity] : []),
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumbs",
          itemListElement: breadcrumbs,
        },
      ],
    };
  }
  return {
    title,
    description,
    locale,
    canonical,
    tags,
    alternates,
    structuredData,
    indexable,
  };
}

export function renderSeoHead(seo) {
  const mark = 'data-book-seo="true"';
  return [
    `<title ${mark}>${escapeHtml(seo.title)}</title>`,
    ...seo.tags.map(
      (tag) =>
        `<meta ${mark} ${tag.name ? `name="${escapeHtml(tag.name)}"` : `property="${escapeHtml(tag.property)}"`} content="${escapeHtml(tag.content)}" />`,
    ),
    ...(seo.canonical
      ? [`<link ${mark} rel="canonical" href="${escapeHtml(seo.canonical)}" />`]
      : []),
    ...seo.alternates.map(
      (item) =>
        `<link ${mark} rel="alternate" hreflang="${escapeHtml(item.locale)}" href="${escapeHtml(item.href)}" />`,
    ),
    ...(seo.structuredData
      ? [
          `<script ${mark} type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}</script>`,
        ]
      : []),
  ].join("\n");
}

export function replaceSeoHead(html, seo) {
  const block = `${seoStart}\n${renderSeoHead(seo)}\n${seoEnd}`;
  if (html.includes(seoStart))
    return html.replace(new RegExp(`${seoStart}[\\s\\S]*?${seoEnd}`), block);
  return html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, "")
    .replace("</head>", block + "\n</head>");
}
