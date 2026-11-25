# enfoldsciart.com

Static Vite/React rebuild of the Enfold Science Art website.

The six original pages are preserved in `src/content/pages/`, with the original responsive layout styles and local image/video assets. React supplies navigation-menu, accordion, and visual-effect behavior. The result deploys as static files without a server-side application, but it currently renders its page content in the browser with JavaScript.

See [the fidelity review](docs/fidelity-review.md) for measured results and remaining differences. The map is not yet visually identical; fonts and form delivery need verification on the eventual Netlify preview. The live site and domain remain unchanged.

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The repository includes `netlify.toml`; connect the GitHub repository in Netlify and its build settings will be detected automatically. The production output is generated in `dist/`.

## Content and fidelity checks

Edit the corresponding HTML file in `src/content/pages/`. The original rich text uses `white-space: pre-wrap`, so inserting newlines between inline elements can create visible line breaks. Keep editorial changes separate from the approved fidelity baseline.

```bash
npm run check:fidelity
```

This checks original text, links, emphasis, local image/video fingerprints, accordion structure, and form requirements. It does not replace a visual comparison. Stored results cover phone, tablet, and desktop widths.

`src/styles/` retains the reference's generated layout/theme rules; `src/styles.css`, `src/App.tsx`, and `src/reference-effects.ts` contain the small standalone behavior replacements. `scripts/import-reference.mjs` supports recreating the sanitized reference from saved source HTML; it is not part of the production build.

## Deployment checks

Keep the existing domain unchanged until the Netlify preview is approved. Confirm Adobe font delivery, complete the map configuration or accept its current appearance, and test a real Netlify Forms submission and notification. The hidden form in `index.html` supports Netlify's build-time form detection.
