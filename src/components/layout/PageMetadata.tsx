import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { chapters, config } from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { buildPageSeo, renderSeoHead } from "../../../scripts/seo.mjs";

export function PageMetadata() {
  const { pathname } = useLocation();
  const { prefs } = useBookPreferences();
  useLayoutEffect(() => {
    const seo = buildPageSeo(config, chapters, {
      pathname,
      locale: prefs.locale,
      base: import.meta.env.BASE_URL,
      origin:
        import.meta.env.VITE_SITE_URL ||
        config.siteUrl ||
        window.location.origin,
    });
    const template = document.createElement("template");
    template.innerHTML = renderSeoHead(seo);
    document.head
      .querySelectorAll("[data-book-seo]")
      .forEach((node) => node.remove());
    document.head.append(template.content);
  }, [pathname, prefs.locale]);
  return null;
}
