import type { bookConfig, StyleRule } from "../book.config";
export function configCss(
  config: typeof bookConfig,
  base?: string,
  locale?: string,
): string;
export function validateConfig(config: typeof bookConfig): typeof bookConfig;
export function renderStyleRules(rules: StyleRule[]): string;
