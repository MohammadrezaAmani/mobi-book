export type RefChapter = {
  id: string;
  locale: string;
  slug: string;
  title: string;
};
export function makeBookReferences(options: {
  chapters: RefChapter[];
  base?: string;
  mode?: "hash" | "browser";
}): (tree: unknown, file: { path?: string }) => void;
