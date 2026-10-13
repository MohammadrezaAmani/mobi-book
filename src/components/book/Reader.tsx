import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Feather,
  List,
  Menu,
  PanelLeftClose,
  Share2,
  Printer,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  config,
  chapterNumber,
  getChapter,
  getChapters,
  getTranslation,
  loadCompiled,
  loadRaw,
  localized,
  readPath,
  language,
  isRtl as localeIsRtl,
  storageKey,
  type Chapter,
  type Locale,
} from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { formatText, t } from "@/lib/i18n";
import { MarkdownContent, contentComponents } from "./Content";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { copyText, storageSet } from "@/lib/utils";

type Compiled = React.ComponentType<{ components?: Record<string, unknown> }>;
function ChapterSidebar({
  list,
  active,
  close,
}: {
  list: Chapter[];
  active: Chapter;
  close?: () => void;
}) {
  const { prefs } = useBookPreferences(),
    tr = t(prefs.locale);
  const groups = Array.from(new Set(list.map((x) => x.category)));
  return (
    <div className="reader-sidebar-inner">
      <div className="reader-sidebar-top">
        <div className="reader-sidebar-kicker">
          {tr.book} / {config.edition}
        </div>
        <h2>{localized(config.title, prefs.locale)}</h2>
        <p>{localized(config.subtitle, prefs.locale)}</p>
      </div>
      <div className="reader-sidebar-items">
        <div className="sidebar-section-title">
          {tr.chapters}
          <span>{list.length}</span>
        </div>
        {groups.map((group) => (
          <div key={group} className="sidebar-chapter-group">
            <span className="sidebar-category">{group}</span>
            {list
              .filter((x) => x.category === group)
              .map((ch) => (
                <Link
                  key={ch.slug}
                  to={readPath(ch)}
                  onClick={close}
                  className={`sidebar-chapter ${ch.slug === active.slug ? "active" : ""}`}
                  aria-current={ch.slug === active.slug ? "page" : undefined}
                >
                  <span className="sidebar-num">{chapterNumber(ch.order)}</span>
                  <span>{ch.title}</span>
                  {ch.slug === active.slug && <span className="current-mark" />}
                </Link>
              ))}
          </div>
        ))}
      </div>
      <Link className="reader-sidebar-footer" to="/library/">
        <BookOpen size={config.appearance.iconSizes["16"]} />
        {tr.allChapters}
      </Link>
    </div>
  );
}

export function Reader({
  onSettings,
  chapter,
}: {
  onSettings: () => void;
  chapter?: Chapter;
}) {
  const { locale: routeLocale, slug } = useParams(),
    location = useLocation(),
    { prefs, update, bookmarked, toggleBookmark } = useBookPreferences();
  const locale: Locale =
    chapter?.locale ||
    (routeLocale && config.locales.includes(routeLocale)
      ? routeLocale
      : prefs.locale);
  const tr = t(locale),
    list = getChapters(locale),
    ch =
      chapter ||
      (routeLocale && !config.locales.includes(routeLocale)
        ? undefined
        : getChapter(locale, slug || "")),
    reader = config.pages.reader;
  const [source, setSource] = useState(""),
    [compiled, setCompiled] = useState<Compiled | undefined>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [progress, setProgress] = useState(0),
    [activeHeading, setActiveHeading] = useState(""),
    [showChapters, setShowChapters] = useState(false),
    [isCopied, setIsCopied] = useState(false);
  const [showToc, setShowToc] = useState(reader.tocExpanded),
    [isOutlineVisible, setOutlineVisible] = useState(reader.sidebar);
  const [headings, setHeadings] = useState<
    { id: string; title: string; level: number }[]
  >([]);
  const contentRef = useRef<HTMLElement>(null);
  const chaptersButtonRef = useRef<HTMLButtonElement>(null);
  const isRtl = localeIsRtl(locale),
    PrevIcon = isRtl ? ArrowRight : ArrowLeft,
    NextIcon = isRtl ? ArrowLeft : ArrowRight;
  const key = ch ? `${ch.locale}:${ch.slug}` : "";
  const saved = bookmarked.includes(key);
  const index = ch ? list.findIndex((x) => x.slug === ch.slug) : -1,
    previous = list[index - 1],
    next = list[index + 1];
  const translations = ch
    ? config.locales
        .filter((item) => item !== locale)
        .map((item) => getTranslation(ch, item))
        .filter((item): item is Chapter => Boolean(item))
    : [];
  useEffect(() => {
    if (prefs.locale !== locale) update({ locale });
  }, [locale]); // readers inherit chapter direction
  useEffect(() => {
    if (!ch) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSource("");
    setCompiled(undefined);
    setHeadings([]);
    setActiveHeading("");
    Promise.all([loadRaw(ch), loadCompiled(ch)])
      .then(([raw, component]) => {
        if (cancelled) return;
        setSource(raw);
        setCompiled(() => component);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    storageSet(storageKey("last-read"), readPath(ch));
    return () => {
      cancelled = true;
    };
  }, [ch?.slug, locale]);
  useEffect(() => {
    if (loading || !ch) return;
    let raf = 0;
    const article = contentRef.current;
    if (article) {
      const nodes = Array.from(
        article.querySelectorAll<HTMLElement>(
          reader.headingLevels.map((level) => `h${level}[id]`).join(","),
        ),
      );
      setHeadings(
        nodes.map((node) => ({
          id: node.id,
          title: node.textContent?.trim() || node.id,
          level: Number(node.tagName.slice(1)),
        })),
      );
    }
    const updateScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = contentRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect(),
          total = Math.max(
            rect.height - window.innerHeight + reader.scroll.bottomOffset,
            1,
          );
        setProgress(
          Math.min(
            100,
            Math.max(0, ((-rect.top + reader.scroll.topOffset) / total) * 100),
          ),
        );
        const headings = Array.from(
          el.querySelectorAll<HTMLElement>(
            reader.headingLevels.map((level) => `h${level}[id]`).join(","),
          ),
        );
        const passed = headings.filter(
          (h) =>
            h.getBoundingClientRect().top < reader.scroll.activeHeadingOffset,
        );
        if (passed.length) setActiveHeading(passed.at(-1)?.id || "");
      });
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();
    return () => {
      window.removeEventListener("scroll", updateScroll);
      cancelAnimationFrame(raf);
    };
  }, [loading, ch?.slug]);
  useEffect(() => {
    if (loading) return;
    const hash = location.hash;
    if (hash) {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* Preserve malformed author anchors. */
      }
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView(),
      );
    } else window.scrollTo({ top: 0 });
  }, [ch?.slug, loading, location.hash]);
  if (!ch)
    return (
      <main className="not-found">
        <h1>{tr.notFoundCode}</h1>
        <p>{t(locale).readerChapterNotFound}</p>
        <Button asChild>
          <Link to="/library/">{t(locale).readerBrowseChapters}</Link>
        </Button>
      </main>
    );
  return (
    <>
      <div
        className={`reader-page ${prefs.focus ? "focus-mode" : ""} ${isOutlineVisible ? "" : "reader-no-sidebar"} ${reader.toc ? "" : "reader-no-toc"}`}
      >
        {reader.progress && (
          <div className="reading-progress" style={{ width: `${progress}%` }} />
        )}
        <div className="reader-mobile-bar">
          {reader.sidebar && (
            <button
              ref={chaptersButtonRef}
              onClick={() => setShowChapters(true)}
              aria-haspopup="dialog"
              aria-expanded={showChapters}
            >
              <Menu size={config.appearance.iconSizes["19"]} />
              {tr.chapters}
            </button>
          )}
          <span>{ch.title}</span>
          {config.features.settings && (
            <button onClick={onSettings} aria-label={tr.settings}>
              <SlidersHorizontal size={config.appearance.iconSizes["19"]} />
            </button>
          )}
        </div>
        <Dialog.Root open={showChapters} onOpenChange={setShowChapters}>
          <Dialog.Portal>
            <Dialog.Overlay className="mobile-sidebar-overlay" />
            <Dialog.Content
              className="mobile-sidebar-panel"
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                chaptersButtonRef.current?.focus();
              }}
            >
              <Dialog.Title className="sr-only">{tr.chapters}</Dialog.Title>
              <Dialog.Close
                aria-label={tr.dialogClose}
                className="mobile-close"
              >
                <X size={config.appearance.iconSizes["18"]} />
              </Dialog.Close>
              <ChapterSidebar
                list={list}
                active={ch}
                close={() => setShowChapters(false)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <div className="reader-grid">
          {reader.sidebar && isOutlineVisible && (
            <aside className="reader-sidebar">
              <ChapterSidebar list={list} active={ch} />
            </aside>
          )}
          <main className="reader-main">
            <div className="reader-top-actions">
              <div className="reader-crumb">
                <Link to="/library/">{tr.library}</Link>
                <ChevronLeft
                  className="rtl-aware"
                  size={config.appearance.iconSizes["14"]}
                />
                <span>{ch.title}</span>
              </div>
              <div className="reader-controls">
                {reader.sidebar && (
                  <button
                    title={t(locale).readerToggleChapterList}
                    className="icon-button"
                    onClick={() => setOutlineVisible(!isOutlineVisible)}
                  >
                    <PanelLeftClose size={config.appearance.iconSizes["17"]} />
                  </button>
                )}
                {config.features.settings && (
                  <button
                    title={tr.appearance}
                    className="icon-button"
                    onClick={onSettings}
                  >
                    <SlidersHorizontal
                      size={config.appearance.iconSizes["17"]}
                    />
                  </button>
                )}
                {reader.print && (
                  <button
                    title={t(locale).readerPrintOrSavePdf}
                    className="icon-button"
                    onClick={() => window.print()}
                  >
                    <Printer size={config.appearance.iconSizes["17"]} />
                  </button>
                )}
                {reader.bookmarks && (
                  <button
                    title={tr.bookmark}
                    className={`icon-button ${saved ? "selected-action" : ""}`}
                    onClick={() => toggleBookmark(key)}
                  >
                    <Bookmark
                      fill={saved ? "currentColor" : "none"}
                      size={config.appearance.iconSizes["17"]}
                    />
                  </button>
                )}
              </div>
            </div>
            <div className="reader-article-shell">
              <div className="reader-article-head">
                <div className="reader-chapter-eyebrow">
                  <span className="chapter-eyebrow-line" />
                  {ch.category} <span className="small-sep">·</span>{" "}
                  {chapterNumber(ch.order)}
                </div>
                <h1>{ch.title}</h1>
                <p className="article-deck">{ch.description}</p>
                <div className="article-meta">
                  <span>
                    <Clock3 size={config.appearance.iconSizes["15"]} />
                    {ch.duration} {tr.min}
                  </span>
                  <span className="meta-dot">●</span>
                  <span>{config.year}</span>
                  <span className="meta-dot">●</span>
                  <span>{ch.format.toUpperCase()}</span>
                </div>
                <div className="article-rule">
                  <span>✻</span>
                </div>
              </div>
              <article
                ref={contentRef}
                className={`prose-book prose-${locale}`}
                dir={language(locale).direction}
                aria-label={ch.title}
              >
                {loading ? (
                  <div className="chapter-loading">
                    <div className="skeleton-title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                ) : error ? (
                  <div className="chapter-error">
                    {formatText(tr.readerLoadError, { detail: error })}
                  </div>
                ) : compiled ? (
                  (() => {
                    const Component = compiled;
                    return <Component components={contentComponents} />;
                  })()
                ) : (
                  <MarkdownContent text={source} locale={locale} />
                )}
              </article>
              {reader.endcard && (
                <div className="end-ornament">
                  <span>✦</span>
                </div>
              )}
              {reader.endcard && (
                <div className="reader-endcard">
                  <div className="endcard-copy">
                    <span>{tr.finish}</span>
                    <h3>{ch.title}</h3>
                    <p>{t(locale).readerEnjoyedThisChapterBookmarkItFor}</p>
                  </div>
                  <div className="endcard-actions">
                    {reader.bookmarks && (
                      <button onClick={() => toggleBookmark(key)}>
                        <Bookmark
                          size={config.appearance.iconSizes["17"]}
                          fill={saved ? "currentColor" : "none"}
                        />
                        {saved ? tr.bookmarked : tr.bookmark}
                      </button>
                    )}
                    {reader.share && (
                      <button
                        onClick={async () => {
                          await copyText(window.location.href);
                          setIsCopied(true);
                          setTimeout(
                            () => setIsCopied(false),
                            config.timing.copied,
                          );
                        }}
                      >
                        <Share2 size={config.appearance.iconSizes["17"]} />
                        {isCopied ? tr.copied : t(locale).readerShare}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="reader-pager">
                <div>
                  {previous ? (
                    <Link to={readPath(previous)} className="pager-link">
                      <PrevIcon size={config.appearance.iconSizes["19"]} />
                      <span>
                        <small>{tr.previous}</small>
                        <strong>{previous.title}</strong>
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div>
                  {next ? (
                    <Link to={readPath(next)} className="pager-link pager-next">
                      <span>
                        <small>{tr.next}</small>
                        <strong>{next.title}</strong>
                      </span>
                      <NextIcon size={config.appearance.iconSizes["19"]} />
                    </Link>
                  ) : (
                    <Link to="/library/" className="pager-link">
                      <span>{tr.allChapters}</span>
                      <BookOpen size={config.appearance.iconSizes["18"]} />
                    </Link>
                  )}
                </div>
              </div>
              <div className="reader-bottom-tools">
                {reader.share && (
                  <button
                    onClick={async () => {
                      await copyText(window.location.href);
                      setIsCopied(true);
                      setTimeout(
                        () => setIsCopied(false),
                        config.timing.copied,
                      );
                    }}
                  >
                    <Copy size={config.appearance.iconSizes["14"]} />
                    {isCopied ? tr.copied : tr.copyLink}
                  </button>
                )}
                {reader.edit && config.features.studio && (
                  <Link to={`/studio/?from=${encodeURIComponent(ch.file)}`}>
                    <Feather size={config.appearance.iconSizes["14"]} />
                    {tr.edit}
                  </Link>
                )}
                {config.features.languageSwitch &&
                  reader.languageSwitch &&
                  translations.map((item) => (
                    <Link key={item.locale} to={readPath(item)}>
                      {language(item.locale).label}
                    </Link>
                  ))}
              </div>
            </div>
            <Footer />
          </main>
          {reader.toc && (
            <aside className="reader-toc">
              <div className="toc-sticky">
                <button
                  className="toc-heading"
                  onClick={() => setShowToc(!showToc)}
                >
                  <List size={config.appearance.iconSizes["17"]} />
                  {tr.contents}
                  <ChevronDown
                    size={config.appearance.iconSizes["15"]}
                    className={showToc ? "" : "toc-closed"}
                  />
                </button>
                {showToc && (
                  <div className="toc-items">
                    {headings.map((h) => (
                      <Link
                        key={h.id}
                        to={{
                          pathname: location.pathname,
                          search: location.search,
                          hash: `#${encodeURIComponent(h.id)}`,
                        }}
                        className={activeHeading === h.id ? "toc-active" : ""}
                        style={{
                          paddingInlineStart: `calc(${h.level - Math.min(...reader.headingLevels)} * var(--toc-indent))`,
                        }}
                      >
                        {h.title}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="toc-progress">
                  <div>
                    <span>{t(locale).readerChapterProgress}</span>
                    <strong>{Math.round(progress)}%</strong>
                  </div>
                  <div className="toc-progress-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {config.features.languageSwitch &&
                  reader.languageSwitch &&
                  translations.map((item) => (
                    <Link
                      key={item.locale}
                      to={readPath(item)}
                      className="toc-language"
                    >
                      <span>
                        {formatText(tr.readInLanguage, {
                          language: language(item.locale).label,
                        })}
                      </span>
                      <span>↗</span>
                    </Link>
                  ))}
              </div>
            </aside>
          )}
        </div>
        {reader.backToTop && (
          <button
            className={`back-top ${progress > reader.scroll.backToTopThreshold ? "visible" : ""}`}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t(locale).readerBackToTop}
          >
            <ArrowUp size={config.appearance.iconSizes["18"]} />
          </button>
        )}
      </div>
    </>
  );
}
