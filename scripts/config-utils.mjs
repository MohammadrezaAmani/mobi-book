export function renderStyleRules(rules) {
  return rules
    .map((rule) => {
      const selector =
        rule.selector ||
        `@${rule.atRule}${rule.params ? " " + rule.params : ""}`;
      const body = rule.rules
        ? renderStyleRules(rule.rules)
        : Object.entries(rule.properties || {})
            .map(([name, value]) => `${name}:${value};`)
            .join("");
      return `${selector}{${body}}`;
    })
    .join("\n");
}

export function configCss(config, base = "/", locale = config.defaultLocale) {
  const theme = config.appearance.themes.find(
    (item) => item.id === config.appearance.defaults.theme,
  );
  const font = config.appearance.fonts.find(
    (item) => item.id === config.appearance.defaults.font,
  );
  const defaults = config.appearance.defaults;
  const tokens = {
    ...config.appearance.tokens,
    ...theme.tokens,
    ...Object.fromEntries(
      Object.entries(config.appearance.layout).map(([name, value]) => [
        name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
        value,
      ]),
    ),
    "font-ui": config.languages[locale].uiFont,
    "font-latin": config.typography.latin,
    "font-serif": config.typography.serif,
    "font-mono": config.typography.mono,
    "font-fa": font.families.fa || font.families[config.defaultLocale],
    "font-en": font.families.en || font.families[config.defaultLocale],
    "font-reader": font.families[locale],
    "reader-font-size": `${defaults.fontSize}px`,
    "reader-line-height": defaults.lineHeight,
    "reader-max-width": `${defaults.contentWidth}px`,
  };
  const rules = Object.entries(tokens)
    .map(([name, value]) => `--${name}:${value};`)
    .join("");
  return `:root{${rules}}\n${renderStyleRules(config.appearance.styles)}\n${config.appearance.customCss}`.replaceAll(
    "__BASE_URL__",
    base,
  );
}

export function validateConfig(config) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  check(
    config.locales.length > 0 && config.locales.includes(config.defaultLocale),
    "defaultLocale must be enabled in locales",
  );
  check(
    new Set(config.locales).size === config.locales.length,
    "locales must be unique",
  );
  for (const locale of config.locales) {
    check(
      /^[a-z][a-z0-9-]*$/i.test(locale),
      `Invalid locale identifier: ${locale}`,
    );
    check(
      config.languages[locale] &&
        ["rtl", "ltr"].includes(config.languages[locale].direction),
      `Missing language/direction: ${locale}`,
    );
    for (const field of ["title", "subtitle", "description", "author"])
      check(
        typeof config[field][locale] === "string",
        `Missing ${field}.${locale}`,
      );
    for (const key of Object.keys(config.messages[config.defaultLocale] || {}))
      check(
        typeof config.messages[locale]?.[key] === "string",
        `Missing messages.${locale}.${key}`,
      );
    for (const font of config.appearance.fonts)
      check(
        typeof font.families[locale] === "string",
        `Missing font ${font.id} for ${locale}`,
      );
    check(
      config.languages[locale]?.readingSpeed > 0,
      `Invalid readingSpeed for ${locale}`,
    );
  }
  const { defaults, ranges, themes, fonts } = config.appearance;
  check(
    themes.some((theme) => theme.id === defaults.theme),
    "Default theme is not defined",
  );
  check(
    fonts.some((font) => font.id === defaults.font),
    "Default font is not defined",
  );
  check(
    new Set(themes.map((x) => x.id)).size === themes.length,
    "Theme IDs must be unique",
  );
  check(
    new Set(fonts.map((x) => x.id)).size === fonts.length,
    "Font IDs must be unique",
  );
  for (const theme of themes) {
    for (const token of [
      "bg",
      "surface",
      "surface-soft",
      "surface-raised",
      "ink",
      "muted",
      "faint",
      "border",
      "accent",
      "accent-hover",
      "accent-soft",
      "paper",
      "reader-ink",
      "cream",
    ])
      check(
        typeof theme.tokens[token] === "string",
        `Missing theme ${theme.id} token: ${token}`,
      );
    check(
      ["default", "dark", "neutral", "forest"].includes(theme.diagramTheme),
      `Invalid diagramTheme: ${theme.id}`,
    );
  }
  for (const [name, range] of Object.entries(ranges))
    check(
      range.min <= defaults[name] &&
        defaults[name] <= range.max &&
        range.min < range.max &&
        range.step > 0,
      `Invalid ${name} range/default`,
    );
  for (const section of config.pages.home.sections)
    check(
      ["hero", "featured", "reading", "studio", "features", "cta"].includes(
        section,
      ),
      `Unknown landing section: ${section}`,
    );
  check(
    ["landing", "library", "reader", "studio"].includes(config.pages.home.mode),
    "Unknown home mode",
  );
  check(
    ["library", "reader"].includes(config.pages.home.bookMode),
    "bookMode must be library or reader",
  );
  check(
    ["hash", "browser"].includes(config.routing.mode),
    "Unknown routing mode",
  );
  check(
    typeof config.features.studio === "boolean" &&
      typeof config.features.landingPage === "boolean",
    "Studio and landingPage switches must be boolean",
  );
  check(
    config.studio.enabledViews.includes(config.studio.defaultView),
    "Studio defaultView must be enabled",
  );
  check(config.studio.maxImageBytes > 0, "maxImageBytes must be positive");
  check(config.search.maxResults > 0, "maxResults must be positive");
  for (const locale of config.locales)
    for (const key of Object.keys(
      config.studio.visualEditorMessages[config.defaultLocale] || {},
    ))
      check(
        typeof config.studio.visualEditorMessages[locale]?.[key] === "string",
        `Missing visual editor translation ${locale}.${key}`,
      );
  check(
    config.pages.reader.headingLevels.length > 0 &&
      config.pages.reader.headingLevels.every(
        (level) => Number.isInteger(level) && level >= 1 && level <= 6,
      ),
    "headingLevels must contain heading numbers from 1 to 6",
  );
  check(
    config.content.callouts.some(
      (item) => item.id === config.content.defaultCallout,
    ),
    "Default callout is not defined",
  );
  const visit = (value, trail) => {
    if (!value || typeof value !== "object") return;
    if (!Array.isArray(value) && Object.hasOwn(value, config.defaultLocale)) {
      for (const locale of config.locales)
        check(
          Object.hasOwn(value, locale),
          `Missing translation ${trail}.${locale}`,
        );
    }
    for (const [key, child] of Object.entries(value))
      visit(child, `${trail}.${key}`);
  };
  visit(config.pages, "pages");
  visit(config.navigation, "navigation");
  visit(config.appearance.themes, "themes");
  visit(config.appearance.fonts, "fonts");
  visit(config.studio.starterSources, "starterSources");
  visit(config.studio.newChapterSources, "newChapterSources");
  visit(config.studio.snippets, "snippets");
  visit(config.content, "content");
  visit(config.meta, "meta");
  if (errors.length)
    throw new Error(
      `Invalid book configuration:\n${errors.map((message) => `  - ${message}`).join("\n")}`,
    );
  return config;
}
