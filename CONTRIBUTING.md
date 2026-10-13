# Contributing

Mobi is a Git-first publishing template. Changes to the Reader or Studio should preserve direct GitHub Pages deployment and bilingual RTL/LTR behavior.

1. Install Node 22.12+ and run `npm install`.
2. Run `npm run content`, `npm test`, and `npm run build`.
3. Include a Persian and an English fixture for changes to Markdown, MDX, typography, or routing.
4. Run accessibility checks on desktop and mobile for new controls. Prefer semantic links/buttons and visible keyboard focus.
5. Avoid adding server-only APIs or requiring a hosted third-party account.

Changes to the book contract (`id`, `locale`, slug, frontmatter, or component mapping) should include migration notes. Code is MIT-licensed; contributor content in a book may use a different license.
