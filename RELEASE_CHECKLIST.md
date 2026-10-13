# Mobi — Release checklist and verified scope

## Architecture guarantees

- [x] The published reader is a static Vite/React artifact; no runtime backend, database or privileged service is required.
- [x] `/studio/` edits in the browser; it never writes to GitHub or requires credentials.
- [x] Studio exports `.md` / `.mdx` and a ZIP containing `src/content/{fa,en}/` and `public/images/`.
- [x] Studio retains multiple document drafts in browser Local Storage and image blobs in IndexedDB.
- [x] Existing unknown YAML fields survive Studio export.
- [x] Chapter hyperlinks use the Pages subpath base and locale.
- [x] The GitHub Actions workflow builds and deploys on `main`.

## Validations that can run without npm dependencies

- `node --test tests/*.test.mjs`
- `node scripts/generate-content.mjs`
- TypeScript **syntax** transpilation using globally installed TypeScript (this does **not** establish type safety).

## Required for a verified public release (not yet completed in this environment)

- [ ] `npm install` successfully completes against a reachable npm Registry.
- [ ] Commit the generated `package-lock.json`, then switch CI to `npm ci` only.
- [ ] `npm run check` and `npm run build` complete with installed dependencies.
- [ ] Direct navigation and reload work at `/<repo>/#/read/fa/.../`; Studio is available only when enabled.
- [ ] Browser E2E exercises writing, reload, image persistence, multiple drafts, ZIP export, and chapter navigation.
- [ ] Keyboard-only and screen-reader navigation audited for both RTL and LTR.
- [ ] PDF/print appearance audited in actual browsers.
- [ ] Paged-book print engine, EPUB writer and advanced academic references are **not implemented**; don't advertise them as finished.

## Trust and accessibility

Committed MDX is executable React application code; only merge trusted contributions. Studio does **not** execute arbitrary pasted MDX in its preview. The Markdown-only WYSIWYG mode is intentionally disabled for unsupported expressions and JSX to avoid data loss.

## Production release policy

Do not describe the repository as independently production-verified until every unchecked item above is exercised on the release commit. This checklist describes the implementation status, not a certification.
