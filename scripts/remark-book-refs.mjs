/** Rewrite [[chapter:id]] into real links when compiling MDX chapters. */
import { routeHref } from "./routing.mjs";

export function makeBookReferences({ chapters, base = "/", mode = "hash" }) {
  return function transformer(tree, file) {
    const path = String(file?.path || "").replaceAll("\\", "/");
    const locale = /\/content\/([^/]+)\//.exec(path)?.[1];
    if (!locale) return;
    const byId = new Map(
      chapters.filter((ch) => ch.locale === locale).map((ch) => [ch.id, ch]),
    );
    function walk(parent) {
      if (!parent?.children) return;
      const result = [];
      for (const node of parent.children) {
        if (
          node.type === "text" &&
          /\[\[chapter:([a-z0-9-]+)\]\]/.test(node.value)
        ) {
          const source = node.value;
          const regex = /\[\[chapter:([a-z0-9-]+)\]\]/g;
          let start = 0;
          for (const match of source.matchAll(regex)) {
            if (match.index > start)
              result.push({
                type: "text",
                value: source.slice(start, match.index),
              });
            const target = byId.get(match[1]);
            result.push(
              target
                ? {
                    type: "link",
                    url: routeHref(`/read/${locale}/${target.slug}/`, {
                      base,
                      mode,
                    }),
                    children: [{ type: "text", value: target.title }],
                  }
                : { type: "text", value: match[0] },
            );
            start = match.index + match[0].length;
          }
          if (start < source.length)
            result.push({ type: "text", value: source.slice(start) });
        } else {
          if (node.type !== "link" && node.type !== "linkReference") walk(node);
          result.push(node);
        }
      }
      parent.children = result;
    }
    walk(tree);
  };
}
