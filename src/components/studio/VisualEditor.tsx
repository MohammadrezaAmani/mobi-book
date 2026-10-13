import { config, language, localized, type Locale } from "@/lib/book";
import { useMemo } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertCodeBlock,
  InsertThematicBreak,
  Separator,
  diffSourcePlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

/** The WYSIWYG mode is opt-in for supported Markdown. Preserve advanced MDX in source mode. */
export function VisualEditor({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  locale: Locale;
}) {
  const plugins = useMemo(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      tablePlugin(),
      codeBlockPlugin({
        defaultCodeBlockLanguage: config.studio.defaultCodeLanguage,
      }),
      codeMirrorPlugin({ codeBlockLanguages: config.studio.codeLanguages }),
      diffSourcePlugin({ viewMode: "rich-text" }),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BlockTypeSelect />
            <BoldItalicUnderlineToggles />
            <Separator />
            <ListsToggle />
            <CreateLink />
            <InsertTable />
            <InsertCodeBlock />
            <InsertThematicBreak />
          </>
        ),
      }),
    ],
    [],
  );
  return (
    <div className="visual-editor-surface" dir={language(locale).direction}>
      <MDXEditor
        translation={(key, defaultValue, values) => {
          const dictionary = localized(
            config.studio.visualEditorMessages,
            locale,
          );
          return (dictionary[key] ?? defaultValue).replace(
            /\{\{(\w+)\}\}/g,
            (match, name: string) => String(values?.[name] ?? match),
          );
        }}
        key={locale}
        markdown={value}
        onChange={onChange}
        contentEditableClassName="visual-editor-prose"
        plugins={plugins}
      />
    </div>
  );
}
