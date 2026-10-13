import { useBookPreferences } from "@/hooks/use-book-preferences";
import { formatText, t } from "@/lib/i18n";
import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header, BottomNav } from "@/components/layout/Header";
import { SearchModal } from "@/components/layout/SearchModal";
import { SettingsModal } from "@/components/layout/SettingsModal";
import {
  config,
  getChapter,
  getChapters,
  language,
  localized,
  homeMode,
} from "@/lib/book";
import { Landing } from "@/components/book/Landing";
import { Library } from "@/components/book/Library";
import { Reader } from "@/components/book/Reader";
const Studio = lazy(() =>
  import("@/components/studio/Studio").then((module) => ({
    default: module.Studio,
  })),
);

export default function App() {
  const { prefs } = useBookPreferences();
  const [search, setSearch] = useState(false),
    [settings, setSettings] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        config.features.search &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === config.shortcuts.searchKey
      ) {
        event.preventDefault();
        setSearch((v) => !v);
      }
      if (event.key === "Escape") setSearch(false);
      if (
        config.features.search &&
        event.key === config.shortcuts.quickSearchKey &&
        target &&
        !["INPUT", "TEXTAREA"].includes(target.tagName) &&
        !target.isContentEditable
      ) {
        event.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const match = /^\/read\/([^/]+)\/(.+?)\/?$/.exec(loc.pathname);
    const locale =
      match && config.locales.includes(match[1]) ? match[1] : prefs.locale;
    const chapter = match ? getChapter(locale, match[2]) : undefined;
    const title =
      chapter?.title ||
      (config.features.studio && loc.pathname.startsWith("/studio")
        ? formatText(config.studio.name, { brand: config.brand })
        : loc.pathname.startsWith("/library")
          ? t(locale).library
          : "");
    document.title = title
      ? title + config.meta.titleSeparator + localized(config.title, locale)
      : localized(config.title, locale);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        chapter?.description ||
          (config.features.studio && loc.pathname.startsWith("/studio")
            ? localized(config.meta.studioSummary, locale)
            : loc.pathname.startsWith("/library")
              ? localized(config.meta.librarySummary, locale)
              : localized(config.description, locale)),
      );
  }, [loc.pathname, prefs.locale]);
  const studioElement = (
    <Suspense
      fallback={
        <div className="page-loader">
          {formatText(t(prefs.locale).appLoadingMobiStudio, {
            brand: config.brand,
          })}
        </div>
      }
    >
      <Studio />
    </Suspense>
  );
  const first = getChapters(prefs.locale)[0];
  const mode = homeMode(config);
  const homeElement =
    mode === "library" ? (
      <Library />
    ) : mode === "studio" ? (
      studioElement
    ) : mode === "reader" ? (
      first ? (
        <Reader chapter={first} onSettings={() => setSettings(true)} />
      ) : (
        <Library />
      )
    ) : (
      <Landing />
    );

  return (
    <div className="app-shell">
      <Header
        onSearch={() => setSearch(true)}
        onSettings={() => setSettings(true)}
      />
      <Routes>
        <Route path="/" element={homeElement} />
        <Route path="/library/*" element={<Library />} />
        <Route
          path="/read/:locale/:slug/*"
          element={<Reader onSettings={() => setSettings(true)} />}
        />
        {config.features.studio && (
          <Route path="/studio/*" element={studioElement} />
        )}
        <Route path="*" element={<Library />} />
      </Routes>
      <BottomNav />
      {config.features.search && (
        <SearchModal open={search} onOpenChange={setSearch} />
      )}
      {config.features.settings && (
        <SettingsModal open={settings} onOpenChange={setSettings} />
      )}
    </div>
  );
}
