import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { storageGet, storageSet } from "@/lib/utils";
import { config, language, storageKey, type Locale } from "@/lib/book";

export type Preferences = {
  locale: Locale;
  theme: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  contentWidth: number;
  focus: boolean;
  accentColor: string | null;
  paperColor: string | null;
};
const defaults: Preferences = {
  locale: config.defaultLocale,
  ...config.appearance.defaults,
};
export function normalizePreferences(value: Partial<Preferences>): Preferences {
  const result = { ...defaults, ...value };
  if (!config.locales.includes(result.locale)) result.locale = defaults.locale;
  if (!config.appearance.themes.some((theme) => theme.id === result.theme))
    result.theme = defaults.theme;
  if (!config.appearance.fonts.some((font) => font.id === result.font))
    result.font = defaults.font;
  for (const key of ["fontSize", "lineHeight", "contentWidth"] as const) {
    const { min, max } = config.appearance.ranges[key];
    result[key] =
      typeof result[key] === "number" && Number.isFinite(result[key])
        ? Math.min(max, Math.max(min, result[key]))
        : defaults[key];
  }
  result.focus =
    typeof result.focus === "boolean" ? result.focus : defaults.focus;
  for (const key of ["accentColor", "paperColor"] as const)
    result[key] =
      typeof result[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(result[key])
        ? result[key]
        : defaults[key];
  return result;
}
type ContextValue = {
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
  bookmarked: string[];
  toggleBookmark: (id: string) => void;
};
const Context = createContext<ContextValue | null>(null);

export function BookPreferencesProvider({ children }: PropsWithChildren) {
  const [prefs, setPrefs] = useState<Preferences>(() =>
    normalizePreferences(storageGet(storageKey("prefs"), {})),
  );
  const prefsRef = useRef(prefs);
  const [bookmarked, setBookmarked] = useState<string[]>(() => {
    const saved = storageGet<unknown>(storageKey("bookmarks"), []);
    return Array.isArray(saved)
      ? saved.filter((item): item is string => typeof item === "string")
      : [];
  });
  const update = useCallback((patch: Partial<Preferences>) => {
    const next = normalizePreferences({ ...prefsRef.current, ...patch });
    prefsRef.current = next;
    // Persist before a link or reload can unload the current document.
    storageSet(storageKey("prefs"), next);
    setPrefs(next);
  }, []);
  const toggleBookmark = (id: string) =>
    setBookmarked((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  useEffect(
    () => storageSet(storageKey("bookmarks"), bookmarked),
    [bookmarked],
  );
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.locale;
    root.dir = language(prefs.locale).direction;
    root.dataset.theme = prefs.theme;
    root.dataset.font = prefs.font;
    const theme = config.appearance.themes.find(
      (item) => item.id === prefs.theme,
    )!;
    const font = config.appearance.fonts.find(
      (item) => item.id === prefs.font,
    )!;
    const families = font.families as Record<string, string>;
    const tokens: Record<string, string> = {
      ...config.appearance.tokens,
      ...theme.tokens,
      "font-ui": language(prefs.locale).uiFont,
      "font-fa": families.fa || families[prefs.locale],
      "font-en": families.en || families[prefs.locale],
      "font-reader": families[prefs.locale],
      "reader-font-size": `${prefs.fontSize}px`,
      "reader-line-height": String(prefs.lineHeight),
      "reader-max-width": `${prefs.contentWidth}px`,
    };
    if (prefs.accentColor) tokens.accent = prefs.accentColor;
    if (prefs.paperColor) tokens.paper = prefs.paperColor;
    for (const [name, value] of Object.entries(tokens))
      root.style.setProperty(`--${name}`, value);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", tokens.bg);
    return () => {
      for (const name of Object.keys(tokens))
        root.style.removeProperty(`--${name}`);
    };
  }, [prefs]);
  return (
    <Context.Provider value={{ prefs, update, bookmarked, toggleBookmark }}>
      {children}
    </Context.Provider>
  );
}
export function useBookPreferences() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useBookPreferences must be used inside provider");
  return ctx;
}
