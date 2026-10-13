import { t } from "@/lib/i18n";
import { config } from "@/lib/book";
import { useEffect, useId, useState } from "react";
import { useBookPreferences } from "@/hooks/use-book-preferences";

/** Lazy loaded and strict-sanitized Mermaid renderer; runs only in the browser. */
export function MermaidDiagram({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "-");
  const [svg, setSvg] = useState(""),
    [error, setError] = useState("");
  const { prefs } = useBookPreferences();
  useEffect(() => {
    let cancelled = false;
    setSvg("");
    setError("");
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: config.appearance.themes.find(
            (item) => item.id === prefs.theme,
          )!.diagramTheme,
          fontFamily: config.typography.diagram,
        });
        const result = await mermaid.render(`${config.id}-${id}`, code);
        if (!cancelled) setSvg(result.svg);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [code, id, prefs.theme]);
  return (
    <figure
      className="mermaid-diagram"
      aria-label={t(prefs.locale).mermaidDiagramDiagram}
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : error ? (
        <pre className="diagram-error">{error}</pre>
      ) : (
        <div className="diagram-loading">
          {t(prefs.locale).mermaidDiagramRenderingDiagram}
        </div>
      )}
    </figure>
  );
}
