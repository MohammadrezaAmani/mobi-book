import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Brand } from "./Brand";
import { config, localized, targetPath } from "@/lib/book";
import { copy } from "@/lib/i18n";
import { ConfigIcon } from "@/components/ui/config-content";
import { useBookPreferences } from "@/hooks/use-book-preferences";
export function Footer() {
  const { prefs } = useBookPreferences(),
    footer = config.pages.footer;
  if (!footer.visible) return null;
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Brand />
          <p>{copy(footer.tagline, prefs.locale)}</p>
        </div>
        <div className="footer-links">
          {footer.links
            .filter(
              (item) =>
                (item.target !== "studio" || config.features.studio) &&
                (item.target !== "repository" ||
                  config.features.repositoryLink),
            )
            .map((item, index) => {
              const href = targetPath(item.target, prefs.locale),
                children = (
                  <>
                    {copy(item.label, prefs.locale)}{" "}
                    <ConfigIcon
                      name={item.icon}
                      size={config.appearance.iconSizes["14"]}
                    />
                  </>
                );
              return /^(https?:|mailto:)/.test(href) ? (
                <a
                  key={index}
                  href={href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {children}
                </a>
              ) : (
                <Link key={index} to={href}>
                  {children}
                </Link>
              );
            })}
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {config.year} {localized(config.title, prefs.locale)} ·{" "}
          {config.license}
        </span>
        <span>
          {copy(footer.credit, prefs.locale)}{" "}
          <Heart size={config.appearance.iconSizes["12"]} />
        </span>
      </div>
    </footer>
  );
}
