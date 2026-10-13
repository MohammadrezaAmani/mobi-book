import { Link } from "react-router-dom";
import { ConfigIcon } from "@/components/ui/config-content";
import { assetUrl, config, localized } from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { formatText, t } from "@/lib/i18n";
export function Brand({ compact = false }: { compact?: boolean }) {
  const { prefs } = useBookPreferences();
  const wordmark =
    config.wordmark === "book"
      ? localized(config.title, prefs.locale)
      : config.brand;
  return (
    <Link
      to="/"
      className={`brand ${config.wordmark === "book" ? "brand-book" : ""}`}
      aria-label={formatText(t(prefs.locale).brandHome, {
        brand: wordmark,
      })}
    >
      <span className="brand-symbol">
        {config.brandLogo ? (
          <img src={assetUrl(config.brandLogo)} alt="" />
        ) : (
          <ConfigIcon
            name={config.brandIcon}
            size={config.appearance.iconSizes["25"]}
          />
        )}
      </span>
      {!compact && (
        <span className="brand-name">
          {wordmark}
          {config.wordmark === "brand" && (
            <span className="brand-period">{config.brandSuffix}</span>
          )}
        </span>
      )}
    </Link>
  );
}
