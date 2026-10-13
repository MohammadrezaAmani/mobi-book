import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useSearchParams, Link } from "react-router-dom";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import CodeMirror from "@uiw/react-codemirror";
import JSZip from "jszip";
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  Download,
  Eye,
  FileCode2,
  FileText,
  FolderOpen,
  ImagePlus,
  Layers3,
  Lightbulb,
  Link2,
  List,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Quote,
  Settings2,
  Sigma,
  Sparkles,
  Table2,
  Type,
  UploadCloud,
  WandSparkles,
  X,
  FileArchive,
  Bold,
  Italic,
  Hash,
} from "lucide-react";
import { ConfigIcon } from "@/components/ui/config-content";
import { Button } from "@/components/ui/button";
import {
  chapters,
  config,
  language,
  localized,
  loadRaw,
  storageKey,
  isRtl,
  type Locale,
} from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { MarkdownContent } from "@/components/book/Content";
import { downloadBlob, storageGet, storageSet } from "@/lib/utils";
import { copy, formatText, t } from "@/lib/i18n";
import {
  fromSource,
  toSource,
  safeFilename,
  draftPath,
  collectDraftErrors,
  type StudioDraft,
} from "../../../scripts/book-draft.mjs";
import {
  loadStoredImages,
  saveStoredImage,
  deleteStoredImage,
  assetFilename,
} from "@/lib/studio-assets";

const VisualEditor = lazy(() =>
  import("./VisualEditor").then((x) => ({ default: x.VisualEditor })),
);
const WORKSPACE_KEY = storageKey("studio:workspace-v2");
function savedWorkspace(): StudioDraft[] {
  const items = storageGet<StudioDraft[]>(WORKSPACE_KEY, []);
  return Array.isArray(items)
    ? items.filter(
        (d) => d && typeof d.uid === "string" && typeof d.body === "string",
      )
    : [];
}
const upsert = (items: StudioDraft[], changed: StudioDraft) => {
  const found = items.some((item) => item.uid === changed.uid);
  return found
    ? items.map((item) => (item.uid === changed.uid ? changed : item))
    : [...items, changed];
};

export function Studio() {
  const { prefs } = useBookPreferences(),
    tr = t(prefs.locale),
    rtl = isRtl(prefs.locale),
    [params] = useSearchParams();
  const studio = config.studio;
  const makeStarter = () =>
    fromSource(
      copy(studio.starterSources, prefs.locale),
      studio.starterFilename,
      prefs.locale,
    );
  const [draft, setDraft] = useState<StudioDraft>(
    () => savedWorkspace()[0] || makeStarter(),
  );
  const [workspace, setWorkspace] = useState<StudioDraft[]>(savedWorkspace);
  const [view, setView] = useState(studio.defaultView);
  const [sidebar, setSidebar] = useState(studio.sidebar),
    [metaOpen, setMetaOpen] = useState(studio.metadataOpen),
    [assetOpen, setAssetOpen] = useState(studio.assetTrayOpen);
  const [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false);
  const [assets, setAssets] = useState<
    { name: string; file: File; url: string }[]
  >([]);
  const fileInput = useRef<HTMLInputElement>(null),
    imageInput = useRef<HTMLInputElement>(null);
  const loadedRef = useRef<string | null>(null);
  useEffect(() => setWorkspace((old) => upsert(old, draft)), [draft]);
  useEffect(() => storageSet(WORKSPACE_KEY, workspace), [workspace]);
  useEffect(() => {
    let active = true;
    loadStoredImages()
      .then((files) => {
        if (active)
          setAssets(
            files.map((file) => ({
              name: file.name,
              file,
              url: URL.createObjectURL(file),
            })),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const assetsRef = useRef(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);
  useEffect(
    () => () => {
      assetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.url));
    },
    [],
  );
  useEffect(() => {
    const target = params.get("from");
    if (!target || loadedRef.current === target) return;
    const chapter = chapters.find((ch) => ch.file === target);
    if (!chapter) return;
    loadedRef.current = target;
    const old = workspace.find(
      (d) =>
        d.locale === chapter.locale &&
        d.filename === chapter.file.split("/").at(-1),
    );
    if (old) {
      setDraft(old);
      setDirty(false);
    } else
      loadRaw(chapter)
        .then((src) => {
          setDraft(
            fromSource(
              src,
              chapter.file.split("/").at(-1) || studio.starterFilename,
              chapter.locale,
            ),
          );
          setDirty(false);
        })
        .catch((e) => setMessage(String(e)));
  }, [params]);
  const change = (patch: Partial<StudioDraft>) => {
    setDraft((old) => ({ ...old, ...patch }));
    setDirty(true);
  };
  const showMessage = (m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(""), config.timing.toast);
  };
  const append = (text: string) => {
    change({ body: draft.body + "\n" + text });
    setView(
      studio.enabledViews.includes("split") ? "split" : studio.defaultView,
    );
  };
  const newChapter = () => {
    const token = Date.now().toString(36);
    const id = `${studio.newChapterPrefix}-${token}`;
    const locale = prefs.locale;
    const source = formatText(localized(studio.newChapterSources, locale), {
      id,
      title: tr.studioNewChapter,
      order: studio.newChapterOrder,
    });
    setDraft(fromSource(source, `${id}${studio.defaultExtension}`, locale));
    setDirty(false);
  };
  const discardDraft = (uid: string) => {
    if (!window.confirm(t(prefs.locale).studioDeleteThisLocalDraft)) return;
    const next = workspace.filter((d) => d.uid !== uid);
    setWorkspace(next);
    if (draft.uid === uid) setDraft(next[0] || makeStarter());
  };
  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setDraft(fromSource(text, file.name, draft.locale));
    setDirty(false);
    showMessage(t(prefs.locale).studioDocumentAddedToWorkspace);
    e.target.value = "";
  };
  const onImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const candidates = Array.from(e.target.files || []);
    const added: { name: string; file: File; url: string }[] = [];
    const errors: string[] = [];
    for (const original of candidates) {
      if (original.size > studio.maxImageBytes) {
        errors.push(
          `${original.name}: ${formatText(tr.imageTooLarge, { size: studio.maxImageBytes / 1_000_000 })}`,
        );
        continue;
      }
      try {
        const name = assetFilename(original.name);
        if (!original.type.startsWith("image/")) throw new Error(tr.notAnImage);
        const known =
          assets.some((a) => a.name === name) ||
          added.some((a) => a.name === name);
        if (known) throw new Error(tr.duplicateImage);
        const file = new File([original], name, {
          type: original.type,
          lastModified: original.lastModified,
        });
        await saveStoredImage(file);
        added.push({ name, file, url: URL.createObjectURL(file) });
      } catch (error) {
        errors.push(
          `${original.name}: ${String(error instanceof Error ? error.message : error)}`,
        );
      }
    }
    if (added.length) {
      setAssets((previous) => [...previous, ...added]);
      change({
        body:
          draft.body +
          "\n" +
          added
            .map((asset) => `![${asset.name}](images/${asset.name})`)
            .join("\n\n") +
          "\n",
      });
    }
    showMessage(
      errors.length
        ? errors.join("; ")
        : t(prefs.locale).studioImagesSavedAndAddedToThe,
    );
    e.target.value = "";
  };
  const exportSource = () => {
    try {
      if (
        assets.some((a) => draft.body.includes(`images/${a.name}`)) &&
        !window.confirm(t(prefs.locale).studioImagesAreNotEmbeddedInThe)
      )
        return;
      downloadBlob(
        new Blob([toSource(draft, tr)], {
          type: "text/markdown;charset=utf-8",
        }),
        safeFilename(draft.filename),
      );
      setDirty(false);
      showMessage(t(prefs.locale).studioMdxDownloaded);
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    }
  };
  const exportBundle = async () => {
    const docs = upsert(workspace, draft);
    const errors = collectDraftErrors(docs, tr);
    if (errors.length) {
      showMessage(errors.join(" | "));
      return;
    }
    const zip = new JSZip();
    for (const doc of docs) zip.file(draftPath(doc), toSource(doc, tr));
    for (const asset of assets)
      zip.file(`public/images/${asset.name}`, asset.file);
    zip.file(
      studio.importInstructionsFilename,
      formatText(studio.importInstructions, {
        brand: config.brand,
        chapters: docs.length,
        images: assets.length,
      }),
    );
    downloadBlob(
      await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
      formatText(studio.bundleFilename, { id: config.id, brand: config.brand }),
    );
    setDirty(false);
    showMessage(t(prefs.locale).studioCompleteWorkspaceDownloaded);
  };
  const openChapter = async (file: string) => {
    const chapter = chapters.find((x) => x.file === file);
    if (!chapter) return;
    const existing = workspace.find(
      (x) =>
        x.locale === chapter.locale &&
        x.filename === chapter.file.split("/").at(-1),
    );
    if (existing) {
      setDraft(existing);
      setDirty(false);
      return;
    }
    try {
      const src = await loadRaw(chapter);
      setDraft(
        fromSource(
          src,
          chapter.file.split("/").at(-1) || studio.starterFilename,
          chapter.locale,
        ),
      );
      setDirty(false);
    } catch (e) {
      showMessage(String(e));
    }
  };
  const previewText = draft.body.replace(
    /\]\((?:\/)?images\/([^)]+)\)/g,
    (full: string, name: string) => {
      const match = assets.find((a) => a.name === name);
      return match ? `]( ${match.url} )`.replaceAll(" ", "") : full;
    },
  );
  const wordCount = draft.body.trim().split(/\s+/).filter(Boolean).length;
  const visualSafe =
    !/<[A-Z][A-Za-z0-9]*/.test(draft.body) &&
    !/^import\s|^export\s/m.test(draft.body) &&
    !/\[\[chapter:|\$\$|(^|[^\\])\$[^\s]/m.test(draft.body);
  return (
    <main className="studio-page">
      <div className="studio-top">
        <div className="studio-path">
          <span className="studio-logo">
            <Layers3 size={config.appearance.iconSizes["19"]} />
          </span>
          <span>{formatText(studio.name, { brand: config.brand })}</span>
          <span className="path-slash">/</span>
          <span className="muted-path">{draft.filename}</span>
          <span className="studio-workspace-count">
            {workspace.length} {t(prefs.locale).studioFiles}
          </span>
          <span className="studio-status">
            <span className="status-dot" />
            {dirty
              ? t(prefs.locale).studioModifiedDraft
              : t(prefs.locale).studioSavedLocally}
          </span>
        </div>
        <div className="studio-top-actions">
          <button
            className="icon-button"
            aria-label={t(prefs.locale).studioToggleChapterSidebar}
            onClick={() => setSidebar(!sidebar)}
          >
            <PanelLeftClose size={config.appearance.iconSizes["18"]} />
          </button>
          <button
            className="icon-button"
            title={tr.import}
            onClick={() => fileInput.current?.click()}
          >
            <FolderOpen size={config.appearance.iconSizes["18"]} />
          </button>
          <button
            className="icon-button"
            title={t(prefs.locale).studioChapterMetadata}
            onClick={() => setMetaOpen(!metaOpen)}
          >
            <Settings2 size={config.appearance.iconSizes["18"]} />
          </button>
          <Button variant="outline" size="sm" onClick={exportSource}>
            <Download size={config.appearance.iconSizes["15"]} />
            <span className="hide-phone">{t(prefs.locale).studioMdx}</span>
          </Button>
          <Button size="sm" onClick={exportBundle}>
            <FileArchive size={config.appearance.iconSizes["15"]} />
            <span className="hide-phone">
              {t(prefs.locale).studioExportBundle}
            </span>
          </Button>
        </div>
      </div>
      <div className="studio-workspace">
        {sidebar && (
          <aside className="studio-sidebar">
            <div className="studio-sidebar-heading">
              <span>
                <BookOpen size={config.appearance.iconSizes["16"]} />
                {t(prefs.locale).studioBookChapters}
              </span>
              <button
                className="icon-button"
                title={tr.newChapter}
                onClick={newChapter}
              >
                <Plus size={config.appearance.iconSizes["18"]} />
              </button>
            </div>
            <div className="studio-sidebar-list">
              <div className="studio-sidebar-heading studio-local-title">
                {t(prefs.locale).studioMyWorkspace}{" "}
                <span>{workspace.length}</span>
              </div>
              {workspace.map((doc) => (
                <div
                  key={doc.uid}
                  className={`studio-draft-row ${doc.uid === draft.uid ? "active" : ""}`}
                >
                  <button
                    className="studio-draft-open"
                    onClick={() => {
                      setDraft(doc);
                      setDirty(false);
                    }}
                  >
                    <FileCode2 size={config.appearance.iconSizes["15"]} />
                    <span>{doc.title || doc.filename}</span>
                  </button>
                  <button
                    className="studio-draft-delete"
                    title={t(prefs.locale).studioDeleteDraft}
                    onClick={() => discardDraft(doc.uid)}
                  >
                    <X size={config.appearance.iconSizes["14"]} />
                  </button>
                </div>
              ))}
              <div className="studio-sidebar-heading studio-local-title">
                {t(prefs.locale).studioPublishedChapters}
              </div>
              {chapters
                .filter((x) => x.locale === draft.locale)
                .map((ch) => (
                  <button
                    key={ch.file}
                    onClick={() => openChapter(ch.file)}
                    className={`studio-chapter-item ${draft.id === ch.id ? "active" : ""}`}
                  >
                    <span className="studio-file-icon">
                      <FileText size={config.appearance.iconSizes["16"]} />
                    </span>
                    <span>{ch.title}</span>
                  </button>
                ))}
            </div>
            <div className="studio-sidebar-bottom">
              <span>
                <Sparkles size={config.appearance.iconSizes["15"]} />{" "}
                {t(prefs.locale).studioBrowserOnlyEditing}
              </span>
              <p>{t(prefs.locale).studioYourDraftStaysInThisBrowser}</p>
            </div>
          </aside>
        )}
        <section className="studio-editor-panel">
          <div className="studio-tabs">
            <div className="studio-tab-switch">
              {studio.enabledViews.includes("source") && (
                <button
                  className={view === "source" ? "active" : ""}
                  onClick={() => setView("source")}
                >
                  <Code2 size={config.appearance.iconSizes["16"]} />
                  {tr.source}
                </button>
              )}
              {studio.enabledViews.includes("split") && (
                <button
                  className={view === "split" ? "active" : ""}
                  onClick={() =>
                    setView(
                      studio.enabledViews.includes("split")
                        ? "split"
                        : studio.defaultView,
                    )
                  }
                >
                  <Columns2 size={config.appearance.iconSizes["16"]} />
                  {tr.split}
                </button>
              )}
              {studio.enabledViews.includes("preview") && (
                <button
                  className={view === "preview" ? "active" : ""}
                  onClick={() => setView("preview")}
                >
                  <Eye size={config.appearance.iconSizes["16"]} />
                  {tr.preview}
                </button>
              )}
              {studio.enabledViews.includes("visual") && (
                <button
                  disabled={!visualSafe}
                  title={
                    !visualSafe
                      ? tr.studioAdvancedMdxRemainsInSourceMode
                      : tr.studioWysiwyg
                  }
                  className={view === "visual" ? "active" : ""}
                  onClick={() => visualSafe && setView("visual")}
                >
                  <WandSparkles size={config.appearance.iconSizes["16"]} />
                  {t(prefs.locale).studioVisual}
                </button>
              )}
            </div>
            <div className="studio-tab-actions">
              <button
                className="icon-button"
                title={tr.import}
                onClick={() => fileInput.current?.click()}
              >
                <UploadCloud size={config.appearance.iconSizes["17"]} />
              </button>
              <button
                className="icon-button"
                title={t(prefs.locale).studioUploadImages}
                onClick={() => imageInput.current?.click()}
              >
                <ImagePlus size={config.appearance.iconSizes["17"]} />
              </button>
              <button
                className="icon-button"
                title={t(prefs.locale).studioEditChapterProperties}
                onClick={() => setMetaOpen(!metaOpen)}
              >
                <MoreHorizontal size={config.appearance.iconSizes["19"]} />
              </button>
            </div>
          </div>
          {metaOpen && (
            <div className="studio-metadata">
              <label>
                {t(prefs.locale).studioTitle}
                <input
                  value={draft.title}
                  onChange={(e) => change({ title: e.target.value })}
                />
              </label>
              <label>
                {t(prefs.locale).studioChapterId}
                <input
                  dir="ltr"
                  value={draft.id}
                  onChange={(e) =>
                    change({
                      id: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                />
              </label>
              <label>
                {t(prefs.locale).studioFilename}
                <input
                  dir="ltr"
                  value={draft.filename}
                  onChange={(e) => change({ filename: e.target.value })}
                />
              </label>
              <label>
                {t(prefs.locale).studioOrder}
                <input
                  type="number"
                  min={studio.minChapterOrder}
                  value={draft.order}
                  onChange={(e) => change({ order: Number(e.target.value) })}
                />
              </label>
              <label>
                {t(prefs.locale).studioLanguage}
                <select
                  value={draft.locale}
                  onChange={(e) => change({ locale: e.target.value as Locale })}
                >
                  {config.locales.map((locale) => (
                    <option key={locale} value={locale}>
                      {language(locale).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="meta-description">
                {t(prefs.locale).studioDescription}
                <input
                  value={draft.description}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </label>
            </div>
          )}
          <div className="studio-insert-bar">
            <div className="insert-tools">
              {studio.snippets.map((item, index) => (
                <button
                  key={index}
                  title={localized(item.label, prefs.locale)}
                  onClick={() => append(copy(item.text, draft.locale))}
                >
                  <ConfigIcon
                    name={item.icon}
                    size={config.appearance.iconSizes["17"]}
                  />
                  <span>{localized(item.label, prefs.locale)}</span>
                </button>
              ))}
            </div>
            <button
              className="insert-more"
              onClick={() => setAssetOpen(!assetOpen)}
            >
              <ImagePlus size={config.appearance.iconSizes["17"]} />
              <ChevronDown size={config.appearance.iconSizes["13"]} />
            </button>
          </div>
          {assetOpen && (
            <div className="studio-asset-tray">
              <strong>{t(prefs.locale).studioImageAssets}</strong>
              <button onClick={() => imageInput.current?.click()}>
                <Plus size={config.appearance.iconSizes["16"]} />
                {t(prefs.locale).studioAddImages}
              </button>
              {assets.map((asset) => (
                <span key={asset.name}>
                  {asset.name}{" "}
                  <button
                    aria-label={t(prefs.locale).studioRemoveImage}
                    onClick={async () => {
                      try {
                        await deleteStoredImage(asset.name);
                        setAssets((old) => {
                          URL.revokeObjectURL(asset.url);
                          return old.filter((x) => x.name !== asset.name);
                        });
                      } catch (e) {
                        showMessage(String(e));
                      }
                    }}
                  >
                    <X size={config.appearance.iconSizes["13"]} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={`studio-edit-area view-${view}`}>
            {(view === "source" || view === "split") && (
              <div className="studio-source">
                <div className="pane-label">
                  <FileCode2 size={config.appearance.iconSizes["15"]} />{" "}
                  {draft.filename}
                </div>
                <CodeMirror
                  value={draft.body}
                  height="100%"
                  extensions={[
                    markdown({
                      base: markdownLanguage,
                      codeLanguages: languages,
                    }),
                  ]}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                  }}
                  onChange={(value) => change({ body: value })}
                  theme="light"
                  className="studio-codemirror"
                />
              </div>
            )}
            {(view === "preview" || view === "split") && (
              <div
                className="studio-preview"
                dir={language(draft.locale).direction}
              >
                <div className="pane-label">
                  <Eye size={config.appearance.iconSizes["15"]} />
                  {tr.preview}{" "}
                  <span className="preview-badge">
                    {t(prefs.locale).studioLive}
                  </span>
                </div>
                <div className="studio-preview-sheet">
                  <span className="preview-sheet-kicker">
                    {t(prefs.locale).studioChapterPreview}
                  </span>
                  <h1>{draft.title}</h1>
                  <div className="preview-divider" />
                  <article className="prose-book studio-prose">
                    <MarkdownContent
                      text={previewText
                        .replace(
                          /<Callout[^>]*>/g,
                          `\n> **${t(draft.locale).note}:**`,
                        )
                        .replace(/<\/Callout>/g, "\n")
                        .replace(
                          /<Figure[^>]*\/>/g,
                          `\n[${t(draft.locale).figurePreview}]\n`,
                        )
                        .replace(/<Quote[^>]*>/g, "\n> ")
                        .replace(/<\/Quote>/g, "\n")}
                      locale={draft.locale}
                    />
                  </article>
                </div>
              </div>
            )}
            {view === "visual" && (
              <div className="studio-visual">
                <div className="pane-label">
                  <WandSparkles size={config.appearance.iconSizes["15"]} />{" "}
                  {t(prefs.locale).studioWysiwyg}
                  <span className="visual-safe-pill">
                    {t(prefs.locale).studioMarkdownOnly}
                  </span>
                </div>
                <Suspense
                  fallback={
                    <div className="studio-loading">
                      {t(prefs.locale).studioLoadingVisualEditor}
                    </div>
                  }
                >
                  <VisualEditor
                    key={`${draft.locale}:${draft.filename}:${draft.id}`}
                    value={draft.body}
                    onChange={(body) => change({ body })}
                    locale={draft.locale}
                  />
                </Suspense>
              </div>
            )}
          </div>
          <div className="studio-statusbar">
            <span>
              <span className="status-dot" /> {tr.autosaved}
            </span>
            <span>
              {wordCount.toLocaleString(draft.locale)}{" "}
              {t(prefs.locale).studioWords} <i>·</i>{" "}
              {t(prefs.locale).studioUtf8}
              <i>·</i> {t(prefs.locale).studioMdx}
            </span>
          </div>
        </section>
      </div>
      <div className="studio-help">
        <div>
          <span className="help-star">✳</span>
          <span>{t(prefs.locale).studioYourWritingStaysYoursDownloadAnd}</span>
        </div>
        <button onClick={exportBundle}>
          {t(prefs.locale).studioDownloadPublishBundle}
          <ArrowDownToLine size={config.appearance.iconSizes["16"]} />
        </button>
      </div>
      {message && (
        <div className="toast-message">
          <Check size={config.appearance.iconSizes["17"]} />
          {message}
        </div>
      )}
      <input
        hidden
        ref={fileInput}
        type="file"
        accept=".md,.mdx,text/markdown,text/plain"
        onChange={onImport}
      />
      <input
        hidden
        ref={imageInput}
        type="file"
        multiple
        accept="image/*"
        onChange={onImage}
      />
    </main>
  );
}
