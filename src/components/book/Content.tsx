import { ConfigIcon } from "@/components/ui/config-content";
import { Link, useLocation } from "react-router-dom";
import { contentRoute } from "../../../scripts/routing.mjs";
import { formatText, t } from "@/lib/i18n";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type AnchorHTMLAttributes,
  type ImgHTMLAttributes,
} from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import katex from "katex";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-sql";
import {
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  X,
  Lightbulb,
  Info,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  assetUrl,
  base,
  config,
  chapters,
  localized,
  readPath,
  removeFrontmatter,
  resolveReferences,
  type Locale,
} from "@/lib/book";
import { copyText } from "@/lib/utils";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { MermaidDiagram } from "./MermaidDiagram";

export function CodeBlock({
  children,
  ...props
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { prefs } = useBookPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (ref.current) Prism.highlightAllUnder(ref.current);
  }, [children]);
  const element = children as
    { props?: { children?: string; className?: string } } | undefined;
  const code =
    typeof element?.props?.children === "string" ? element.props.children : "";
  const language =
    element?.props?.className?.replace("language-", "") || "text";
  if (language === "mermaid") return <MermaidDiagram code={code} />;
  return (
    <div className="code-shell" ref={ref} {...props}>
      <div className="code-header">
        <span className="code-lang">
          <span className="code-dot" />
          {language.toUpperCase()}
        </span>
        <button
          aria-label={t(prefs.locale).contentCopyCode}
          className="code-copy"
          onClick={async () => {
            await copyText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), config.timing.copied);
          }}
        >
          {copied ? (
            <Check size={config.appearance.iconSizes["14"]} />
          ) : (
            <Copy size={config.appearance.iconSizes["14"]} />
          )}{" "}
          {copied ? t(prefs.locale).copied : t(prefs.locale).copy}
        </button>
      </div>
      <pre dir="ltr">{children}</pre>
    </div>
  );
}

function RichImage({ src, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const { prefs } = useBookPreferences();
  const [open, setOpen] = useState(false);
  const url = assetUrl(src || "");
  return (
    <>
      <span className="rich-image-container">
        <img alt={alt || ""} src={url} {...rest} loading="lazy" />
        <button
          type="button"
          className="image-zoom"
          onClick={() => setOpen(true)}
          aria-label={t(prefs.locale).contentEnlargeImage}
        >
          <Maximize2 size={config.appearance.iconSizes["17"]} />
        </button>
      </span>
      {open && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button
            aria-label={t(prefs.locale).contentCloseImage}
            className="lightbox-close"
          >
            <X />
          </button>
          <img src={url} alt={alt || ""} />
        </div>
      )}
    </>
  );
}
export function SmartLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const location = useLocation();
  const external = Boolean(href && /^(https?:)?\/\//.test(href));
  const route =
    href &&
    contentRoute(href, { base, from: location.pathname + location.search });
  if (route)
    return (
      <Link to={route} {...props}>
        {children}
      </Link>
    );
  if (href?.startsWith("#")) {
    return (
      <Link
        to={{
          pathname: location.pathname,
          search: location.search,
          hash: href,
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      {...props}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
      {external && (
        <ExternalLink
          size={config.appearance.iconSizes["12"]}
          className="external-mark"
        />
      )}
    </a>
  );
}

export function Callout({
  type = config.content.defaultCallout,
  title,
  children,
}: {
  type?: string;
  title?: string;
  children: ReactNode;
}) {
  const { prefs } = useBookPreferences();
  const callout =
    config.content.callouts.find((item) => item.id === type) ||
    config.content.callouts[0];
  return (
    <aside className={`callout callout-${callout.id}`}>
      <div className="callout-head">
        <ConfigIcon
          name={callout.icon}
          size={config.appearance.iconSizes["18"]}
        />
        {title || localized(callout.label, prefs.locale)}
      </div>
      <div className="callout-content">{children}</div>
    </aside>
  );
}
export function Figure({
  src,
  alt,
  caption,
  id,
}: {
  src: string;
  alt: string;
  caption?: string;
  id?: string;
}) {
  return (
    <figure className="book-figure" id={id}>
      <RichImage src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
export function Quote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="elegant-quote">
      <p>{children}</p>
      {attribution && <footer>— {attribution}</footer>}
    </blockquote>
  );
}
export function Equation({
  children,
  label,
  id,
}: {
  children: string;
  label?: string;
  id?: string;
}) {
  let html = "";
  try {
    html = katex.renderToString(children, {
      displayMode: true,
      throwOnError: false,
      trust: false,
      strict: "warn",
    });
  } catch {
    html = "";
  }
  return (
    <figure className="book-equation" id={id}>
      {label && <figcaption>{label}</figcaption>}
      {html ? (
        <div dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>{children}</pre>
      )}
    </figure>
  );
}
export function BookRef({
  to,
  locale,
  children,
}: {
  to: string;
  locale?: Locale;
  children?: ReactNode;
}) {
  const { prefs } = useBookPreferences();
  const resolvedLocale = locale || prefs.locale;
  const ch = chapters.find(
    (x) => x.locale === resolvedLocale && (x.id === to || x.slug === to),
  );
  return ch ? (
    <Link to={readPath(ch)}>{children || ch.title}</Link>
  ) : (
    <span
      className="invalid-ref"
      title={formatText(t(resolvedLocale).unresolvedChapter, { chapter: to })}
    >
      {children || to}
    </span>
  );
}

export const contentComponents = {
  pre: CodeBlock,
  img: RichImage,
  a: SmartLink,
  Callout,
  Figure,
  Quote,
  Equation,
  BookRef,
  Mermaid: MermaidDiagram,
};

export function MarkdownContent({
  text,
  locale,
}: {
  text: string;
  locale: Locale;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeSlug]}
      urlTransform={(url, key) =>
        key === "src" && url.startsWith("blob:")
          ? url
          : defaultUrlTransform(url)
      }
      components={contentComponents}
    >
      {resolveReferences(removeFrontmatter(text), locale)}
    </ReactMarkdown>
  );
}
