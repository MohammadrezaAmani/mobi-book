export function normalizeBase(base = "/") {
  const path = base.replace(/^\/+|\/+$/g, "");
  return path ? `/${path}/` : "/";
}

/** Real generated HTML pages keep their pathname for search engines and refresh. */
export function entryRoutingMode(
  location,
  { base = "/", mode = "hash", indexableEntryPoints = true } = {},
) {
  if (mode === "browser") return "browser";
  const prefix = normalizeBase(base);
  const physical =
    location.pathname.startsWith(prefix) &&
    /^\/(?:read|library|studio)(?:\/|$)/.test(
      `/${location.pathname.slice(prefix.length)}`,
    );
  return indexableEntryPoints && physical && !location.hash?.startsWith("#/")
    ? "browser"
    : "hash";
}

/** Public URLs include the deployment folder; React Router paths do not. */
export function routeHref(path, { base = "/", mode = "hash" } = {}) {
  const logical = path.startsWith("/") ? path : `/${path}`;
  const prefix = normalizeBase(base);
  return mode === "hash" ? `${prefix}#${logical}` : prefix + logical.slice(1);
}

export function homeMode(config) {
  const mode = config.pages.home.mode;
  if (
    (mode === "landing" && !config.features.landingPage) ||
    (mode === "studio" && !config.features.studio)
  ) {
    return config.pages.home.bookMode;
  }
  return mode;
}

/** Interpret book links while leaving asset links and external URLs untouched. */
export function contentRoute(href, { base = "/", from = "/" } = {}) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return undefined;
  const prefix = normalizeBase(base);
  let path = href;
  if (path.startsWith(`${prefix}#/`)) path = path.slice(prefix.length + 1);
  else if (path.startsWith("#/")) path = path.slice(1);
  else if (path.startsWith(prefix)) path = `/${path.slice(prefix.length)}`;
  else if (!path.startsWith("/")) {
    const resolved = new URL(path, `https://book.invalid${from}`);
    path = resolved.pathname + resolved.search + resolved.hash;
  }
  if (/\.[a-z\d]+(?:[?#]|$)/i.test(path)) return undefined;
  return /^\/(?:read|library|studio)(?:\/|[?#]|$)/.test(path) ||
    /^\/(?:[?#]|$)/.test(path)
    ? path
    : undefined;
}

/** Upgrade existing physical deep links before HashRouter reads the location. */
export function legacyHashUrl(
  { pathname, search = "", hash = "" },
  base = "/",
) {
  const prefix = normalizeBase(base);
  if (!pathname.startsWith(prefix)) return undefined;
  const path = `/${pathname.slice(prefix.length)}`;
  if (!/^\/(?:read|library|studio)(?:\/|$)/.test(path)) return undefined;
  return hash.startsWith("#/")
    ? prefix + hash
    : routeHref(path + search + hash, { base: prefix });
}
