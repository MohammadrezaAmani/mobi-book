import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpLeft,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Search,
  ListFilter,
  Bookmark,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  getChapters,
  config,
  chapterNumber,
  localized,
  readPath,
  isRtl,
  assetUrl,
} from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { formatText, t } from "@/lib/i18n";
import { RichText } from "@/components/ui/config-content";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export function Library() {
  const { prefs, bookmarked } = useBookPreferences(),
    tr = t(prefs.locale),
    rtl = isRtl(prefs.locale),
    arr = useMemo(() => getChapters(prefs.locale), [prefs.locale]);
  const [query, setQuery] = useState(""),
    [onlySaved, setOnlySaved] = useState(false);
  const filtered = useMemo(
    () =>
      arr.filter(
        (ch) =>
          (!onlySaved || bookmarked.includes(`${ch.locale}:${ch.slug}`)) &&
          `${ch.title} ${ch.description} ${ch.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [arr, query, onlySaved, bookmarked],
  );
  const categories = Array.from(new Set(arr.map((x) => x.category)));
  const Arrow = rtl ? ArrowUpLeft : ArrowUpRight,
    Step = rtl ? ArrowLeft : ArrowRight;
  return (
    <>
      <main className="library-page">
        <section className="library-hero section-wrap">
          <div
            className={`book-intro ${config.pages.library.showCover ? "" : "book-intro-no-cover"}`}
          >
            {config.pages.library.showCover && (
              <img
                className="book-intro-cover"
                src={assetUrl(config.cover)}
                alt={formatText(tr.bookCover, {
                  title: localized(config.title, prefs.locale),
                })}
              />
            )}
            <div className="book-intro-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {t(prefs.locale).libraryTheCollection}
              </div>
              <h1>
                {config.pages.library.useBookTitle ? (
                  localized(config.title, prefs.locale)
                ) : (
                  <RichText
                    parts={localized(config.pages.library.title, prefs.locale)}
                  />
                )}
              </h1>
              {config.pages.library.showSubtitle && (
                <p className="book-intro-subtitle">
                  {localized(config.subtitle, prefs.locale)}
                </p>
              )}
              <p>{localized(config.description, prefs.locale)}</p>
              {config.pages.library.showAuthor && (
                <p className="book-intro-author">
                  {tr.author}: {localized(config.author, prefs.locale)}
                </p>
              )}
              {config.pages.library.showStartReading && arr[0] && (
                <Button asChild size="lg">
                  <Link to={readPath(arr[0])}>
                    <BookOpen size={config.appearance.iconSizes["18"]} />
                    {tr.read}
                    <Step size={config.appearance.iconSizes["17"]} />
                  </Link>
                </Button>
              )}
              <div className="library-toolbar">
                {config.pages.library.showSearch && (
                  <div className="filter-search">
                    <Search size={config.appearance.iconSizes["19"]} />
                    <input
                      placeholder={t(prefs.locale).libraryFilterChapters}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                )}
                {config.pages.library.showBookmarks && (
                  <button
                    className={`filter-saved ${onlySaved ? "active" : ""}`}
                    onClick={() => setOnlySaved(!onlySaved)}
                  >
                    <Bookmark size={config.appearance.iconSizes["17"]} />
                    {tr.bookmarks}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="library-content section-wrap">
          <div className="library-intro">
            <div>
              <span className="tiny-kicker">
                {t(prefs.locale).libraryTableOfContents}
              </span>
              <h2>{tr.allChapters}</h2>
            </div>
            <span>
              <ListFilter size={config.appearance.iconSizes["16"]} />
              {filtered.length} {t(prefs.locale).libraryChapters}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="library-empty">{tr.noResult}</div>
          ) : (
            categories.map((cat) => {
              const group = filtered.filter((ch) => ch.category === cat);
              if (!group.length) return null;
              return (
                <section className="chapter-group" key={cat}>
                  <div className="chapter-group-label">
                    <span className="group-line" />
                    {cat}
                  </div>
                  <div className="chapter-cards">
                    {group.map((ch) => (
                      <Link
                        key={ch.slug}
                        className="chapter-card"
                        to={readPath(ch)}
                      >
                        <div className="chapter-index">
                          {chapterNumber(ch.order)}
                        </div>
                        <div className="chapter-card-copy">
                          <h3>{ch.title}</h3>
                          <p>{ch.description}</p>
                          <div className="chapter-card-meta">
                            <span>
                              <Clock3
                                size={config.appearance.iconSizes["14"]}
                              />
                              {ch.duration} {tr.min}
                            </span>
                            <span className="format-chip">
                              {ch.format.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="chapter-arrow">
                          <Arrow size={config.appearance.iconSizes["20"]} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })
          )}
          {config.pages.library.showOutro && config.features.studio && (
            <div className="library-outro">
              <BookOpen size={config.appearance.iconSizes["23"]} />
              <p>{t(prefs.locale).libraryEveryChapterHereComesFromA}</p>
              <Link to="/studio/">
                {tr.create}
                <Step size={config.appearance.iconSizes["16"]} />
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
