export type RoutingMode = "hash" | "browser";
export function entryRoutingMode(
  location: { pathname: string; hash?: string },
  options?: {
    base?: string;
    mode?: RoutingMode;
    indexableEntryPoints?: boolean;
  },
): RoutingMode;
export function normalizeBase(base?: string): string;
export function routeHref(
  path: string,
  options?: { base?: string; mode?: RoutingMode },
): string;
export function homeMode(config: {
  features: { studio: boolean; landingPage: boolean };
  pages: { home: { mode: string; bookMode: string } };
}): string;
export function contentRoute(
  href: string,
  options?: { base?: string; from?: string },
): string | undefined;
export function legacyHashUrl(
  location: { pathname: string; search?: string; hash?: string },
  base?: string,
): string | undefined;
