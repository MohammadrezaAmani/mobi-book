import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  PenLine,
  SlidersHorizontal,
  Globe2,
  Github,
  Menu,
} from "lucide-react";
import { Brand } from "./Brand";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { t } from "@/lib/i18n";
import {
  config,
  getChapter,
  getTranslation,
  language,
  localized,
  nextLocale,
  readPath,
  targetPath,
} from "@/lib/book";
import { Button } from "@/components/ui/button";
import { ConfigIcon } from "@/components/ui/config-content";
import { useEffect, useState } from "react";

export function Header({
  onSearch,
  onSettings,
}: {
  onSearch: () => void;
  onSettings: () => void;
}) {
  const { prefs, update } = useBookPreferences(),
    tr = t(prefs.locale),
    location = useLocation();
  const [menu, setMenu] = useState(false),
    navigate = useNavigate();
  useEffect(() => setMenu(false), [location.pathname]);
  const chapterMatch = location.pathname.match(/^\/read\/([^/]+)\/(.+?)\/?$/);
  const switchLocale = () => {
    const next = nextLocale(prefs.locale);
    update({ locale: next });
    if (chapterMatch) {
      const chapter = getChapter(chapterMatch[1], chapterMatch[2]);
      const matching = chapter && getTranslation(chapter, next);
      if (matching) navigate(readPath(matching));
      else navigate("/library/");
    } else if (
      location.pathname === "/" ||
      location.pathname.startsWith("/library")
    ) {
      navigate(`/library/${next}/`);
    }
  };
  const navigation = config.navigation.filter(
    (item) => item.target !== "studio" || config.features.studio,
  );
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <nav aria-label={tr.headerPrimaryNavigation} className="top-nav">
          {navigation.map((item, index) => (
            <NavLink
              key={index}
              to={targetPath(item.target, prefs.locale)}
              end={item.target === "home"}
              className={({ isActive }) => (isActive ? "nav-active" : "")}
            >
              {localized(item.label, prefs.locale)}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          {config.features.search && (
            <button
              className="nav-search"
              onClick={onSearch}
              aria-label={tr.search}
            >
              <Search size={config.appearance.iconSizes["17"]} />
              <span>{tr.search}</span>
              <kbd>{config.shortcuts.searchLabel}</kbd>
            </button>
          )}
          {config.features.languageSwitch && config.locales.length > 1 && (
            <button
              className="icon-button hide-mobile"
              onClick={switchLocale}
              aria-label={tr.headerSwitchLanguage}
            >
              <Globe2 size={config.appearance.iconSizes["19"]} />
              {/* <span className="locale-label">
                {language(prefs.locale).shortLabel}
              </span> */}
            </button>
          )}
          {config.features.settings && (
            <button
              className="icon-button"
              onClick={onSettings}
              aria-label={tr.settings}
            >
              <SlidersHorizontal size={config.appearance.iconSizes["19"]} />
            </button>
          )}
          {config.features.repositoryLink && config.repository && (
            <a
              className="icon-button hide-tablet"
              href={config.repository}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tr.headerGithub}
            >
              <Github size={config.appearance.iconSizes["19"]} />
            </a>
          )}
          {config.features.writeButton && config.features.studio && (
            <Button className="header-write" size="sm" asChild>
              <Link to="/studio/">
                <PenLine size={config.appearance.iconSizes["15"]} />
                {tr.write}
              </Link>
            </Button>
          )}
          <button
            className="icon-button mobile-menu-trigger"
            onClick={() => setMenu(!menu)}
            aria-label={tr.headerToggleMenu}
            aria-expanded={menu}
            aria-controls="mobile-navigation-menu"
          >
            <Menu size={config.appearance.iconSizes["21"]} />
          </button>
        </div>
      </div>
      {menu && (
        <div className="mobile-menu" id="mobile-navigation-menu">
          {navigation.map((item, index) => (
            <Link
              key={index}
              to={targetPath(item.target, prefs.locale)}
              onClick={() => setMenu(false)}
            >
              {localized(item.label, prefs.locale)}
            </Link>
          ))}
          {config.features.languageSwitch && config.locales.length > 1 && (
            <button
              onClick={() => {
                switchLocale();
                setMenu(false);
              }}
            >
              {language(nextLocale(prefs.locale)).label}
            </button>
          )}
          {config.features.search && (
            <button
              onClick={() => {
                onSearch();
                setMenu(false);
              }}
            >
              {tr.search}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
export function BottomNav() {
  const { prefs } = useBookPreferences(),
    tr = t(prefs.locale),
    location = useLocation();
  if (!config.features.bottomNavigation) return null;
  const navigation = config.navigation.filter(
    (item) => item.target !== "studio" || config.features.studio,
  );
  return (
    <nav
      className="mobile-bottom-nav"
      aria-label={tr.headerMobileNavigation}
      style={{
        gridTemplateColumns: `repeat(${navigation.length},minmax(0,1fr))`,
      }}
    >
      {navigation.map((item, index) => (
        <NavLink
          key={index}
          to={targetPath(item.target, prefs.locale)}
          end={item.target === "home"}
          className={({ isActive }) =>
            isActive ||
            (item.target === "library" &&
              location.pathname.startsWith("/read/"))
              ? "active"
              : ""
          }
        >
          <ConfigIcon
            name={item.icon}
            size={config.appearance.iconSizes["20"]}
          />
          <span>{localized(item.label, prefs.locale)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
