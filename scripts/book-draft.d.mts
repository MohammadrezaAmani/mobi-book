export type BookLocale = string;
export type StudioDraft = {
  uid: string;
  id: string;
  title: string;
  description: string;
  order: number;
  locale: BookLocale;
  filename: string;
  body: string;
  frontmatterRaw: string;
};
export function safeFilename(input: string, preferredExt?: string): string;
export function fromSource(
  source: string,
  filename: string,
  locale?: BookLocale,
  uid?: string,
): StudioDraft;
export function toSource(
  draft: StudioDraft,
  messages?: Record<string, string>,
): string;
export function draftPath(draft: StudioDraft): string;
export function collectDraftErrors(
  drafts: StudioDraft[],
  messages?: Record<string, string>,
): string[];
