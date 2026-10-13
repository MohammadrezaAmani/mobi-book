import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpRight, BookOpen, Command } from "lucide-react";
import index from "@/generated/search-index.json";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { t } from "@/lib/i18n";
import { config } from "@/lib/book";
import { Modal } from "@/components/ui/dialog";

type SearchEntry = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  description: string;
  body: string;
};
function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/‌/g, " ")
    .trim();
}
export function SearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { prefs } = useBookPreferences(),
    tr = t(prefs.locale),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(
        () => input.current?.focus(),
        config.timing.searchFocus,
      );
    }
  }, [open]);
  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return (index as SearchEntry[])
      .filter((d) => d.locale === prefs.locale)
      .map((d) => {
        const title = norm(d.title),
          desc = norm(d.description),
          body = norm(d.body);
        const score =
          (title.includes(q) ? 8 : 0) +
          (desc.includes(q) ? 4 : 0) +
          (body.includes(q) ? 1 : 0);
        const at = body.indexOf(q);
        return {
          ...d,
          score,
          snippet:
            at >= 0
              ? d.body.slice(
                  Math.max(0, at - config.search.snippetBefore),
                  at + config.search.snippetAfter,
                )
              : d.description,
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, config.search.maxResults);
  }, [query, prefs.locale]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tr.search}
      width="wide"
    >
      <div className="search-input-wrap">
        <Search size={config.appearance.iconSizes["20"]} />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(prefs.locale).searchModalSearchChaptersPhrasesIdeas}
          aria-label={tr.search}
        />
        <kbd>{config.shortcuts.escapeLabel}</kbd>
      </div>
      <div className="search-results">
        {!query ? (
          <div className="search-empty">
            <Command size={config.appearance.iconSizes["26"]} />
            <p>{t(prefs.locale).searchModalTypeToSearchAcrossAllChapters}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="search-empty">
            <Search size={config.appearance.iconSizes["25"]} />
            <p>{tr.noResult}</p>
          </div>
        ) : (
          results.map((result) => (
            <button
              key={result.id}
              className="search-result"
              onClick={() => {
                navigate(`/read/${result.locale}/${result.slug}/`);
                onOpenChange(false);
              }}
            >
              <span className="search-result-icon">
                <BookOpen size={config.appearance.iconSizes["17"]} />
              </span>
              <span className="search-result-body">
                <strong>{result.title}</strong>
                <small>{result.snippet}</small>
              </span>
              <ArrowUpRight size={config.appearance.iconSizes["17"]} />
            </button>
          ))
        )}
      </div>
      <div className="search-footer">
        <span>
          {results.length > 0
            ? `${results.length} ${t(prefs.locale).searchModalResults}`
            : ""}
        </span>
        <span>{t(prefs.locale).searchModalIndexedLocallyNoServer}</span>
      </div>
    </Modal>
  );
}
