# Publishing contract / قرارداد انتشار

The site is served entirely by static assets. There is no API, backend worker, database, or mandatory third-party service.

## Files you edit

- `book.config.ts`: book title, author, description, cover and repository link.
- `src/content/{fa,en}/`: Markdown and MDX chapters. Files determine chapter routes.
- `public/images/`: illustrations, cover, diagrams and other static assets.
- `src/styles/main.css`: theme palettes, layout and typography.

## Editor-to-Git handoff

When `features.studio` is enabled, the public `/#/studio/` writes **only into browser state**. It never commits to GitHub and never claims a server-side save. The `Download MDX` action exports one text file. `Export bundle` creates a ZIP of every document currently in the browser workspace, with all referenced imported images. It validates duplicate output filenames and chapter identifiers before export. Image binaries must be included in that bundle or copied manually.

## Release invariant

No deployment is published unless the content generator, unit tests, TypeScript compilation and Vite build all succeed. GitHub Actions uses the Pages artifact upload/deploy flow, not the deprecated gh-pages branch method.

## Static routing

Vite builds a React HashRouter app by default. Published links use `/<repo>/#/read/fa/.../`, so navigation and refresh request the same static entry point. The repository base stays outside the hash. Heading anchors and Studio query parameters remain inside the logical route. `routing.mode: "browser"` is available for hosts with suitable route handling.

The `prerender.mjs` step also emits physical chapter entry points for crawlable text fallbacks and existing links. Old physical chapter URLs upgrade to the hash route on startup. Studio entry points are generated only when `features.studio` is enabled. `features.landingPage: false` publishes the configured book home instead of the Mobi introduction. Both features are disabled in the default publication configuration.

The GitHub Pages artifact is hosted under `BASE_PATH`; all reader-generated absolute internal references respect Vite's `import.meta.env.BASE_URL`.

## Threat model

Markdown content is rendered through react-markdown, while committed MDX is **trusted application source**. MDX can contain JavaScript. Review contributions to the repository before deployment. User-pasted MDX is **not evaluated dynamically** inside the editor. Mermaid is initialized with `securityLevel: 'strict'`. External links open with `noopener noreferrer`.

## Current scope boundaries

Offline-first, browser-local writing and on-push static publication are implemented in source. Professional paged PDF layout, EPUB packaging, cloud collaboration, multi-user permissions, comments and server-side sync are not included. Print-to-PDF via the browser is available. No fake API endpoints are provided for capabilities that would need a backend.

## Verification

Every build runs `scripts/verify-dist.mjs` after the Vite build and prerender step to check the emitted entry points, direction metadata and local asset paths. See `RELEASE_CHECKLIST.md` for limitations and outstanding browser verification.
