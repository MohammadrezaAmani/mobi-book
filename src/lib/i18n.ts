import { config, localized, type Locale } from "./book";

export function t(locale: Locale) {
  return config.messages[locale] || config.messages[config.defaultLocale];
}

/** Literal placeholders only; translated strings never execute HTML or JavaScript. */
export function formatText(
  text: string,
  values: Record<string, string | number> = {},
) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    String(values[key] ?? match),
  );
}

export function copy(
  text: Record<string, string>,
  locale: Locale,
  values: Record<string, string | number> = {},
) {
  return formatText(localized(text, locale), {
    brand: config.brand,
    id: config.id,
    year: config.year,
    title: localized(config.title, locale),
    ...values,
  });
}
