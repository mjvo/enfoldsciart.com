# Enfold website fidelity review

Review date: October 10, 2026.

The six-page static rebuild matches the live site's text and measured layout at the three reviewed viewport sizes. It is ready for owner review, but not an unconditional claim that every rendered pixel and service interaction is identical. The Google map remains visually different, the recreated underline has a small rounding difference, and live form delivery needs a Netlify preview.

The reference is [enfoldsciart.com](https://enfoldsciart.com/). Its page markup and styles are Squarespace-based. The rebuild uses Vite and React, with checked-in page content and local image/video assets; it does not require the Squarespace application runtime.

## Content and layout results

All 90 original content blocks match, including linked text, link destinations, and italic/bold emphasis. Original wording, punctuation, event-date inconsistencies, and unusual links have been retained rather than editorially corrected.

The production build was compared with the live reference in the Codex in-app browser on macOS. The tested viewports were 390 × 844, 768 × 1024, and 1440 × 900. These are responsive viewport tests, not tests on three separate physical devices.

| Page | Content blocks | Layout blocks | Largest measured layout difference across tested sizes |
| --- | ---: | ---: | ---: |
| Home | 4 | 10 | 0 px |
| About | 1 | 4 | 0 px |
| Schedule | 26 | 10 | 0 px |
| Participants | 54 | 86 | 0 px |
| Art | 3 | 8 | 0 px |
| Contact | 2 | 3 | 0 px |

The zero-difference result applies to the positions and dimensions of the 121 Fluid Engine layout blocks at each tested viewport. It is not a whole-image pixel-diff score. Image crop settings, marquee typography and spacing, and horizontal overflow also match at these sizes. Moving backgrounds, animation phases, and third-party widgets can produce different screenshot pixels even when the surrounding layout matches.

The active assets include 33 original images and the original background movie. The movie is locally served as an MP4 without re-encoding its video stream. Their saved SHA-256 fingerprints provide a reproducible check against accidental asset changes.

Saved production-preview screenshots show the [desktop home page](fidelity/screenshots/home-desktop.png), [phone home page](fidelity/screenshots/home-mobile.png), [phone navigation](fidelity/screenshots/menu-mobile.png), and [desktop Contact form](fidelity/screenshots/contact-desktop.png). These are visual review references, not synchronized image-diff results.

## Fidelity corrections

- Restored the original paragraph structure, all participant biographies, links, headings, and emphasis instead of approximate hand-entered copy.
- Preserved the original Fluid Engine grids, centered About text, vertically stacked Schedule days, portrait image sizing/crops, and portrait-format Art presentation embed.
- Restored Orpheus Pro typography using the original Adobe-hosted font files.
- Replaced approximate scrolling text with native SVG text on the original path geometry, font metrics, item spacing, and one-pixel-per-frame movement.
- Restored the shrinking header, including the original ResizeObserver content-box measurement to eliminate a subpixel padding discrepancy.
- Restored the 0.65-second fade/scale reveals and the original scale-from-90-percent preset.
- Matched the mobile menu typography, placement, overlay color, and close icon, including the header theme change that keeps the icon white on the black overlay; added Escape handling and focus containment.
- Fixed all eleven Schedule accordions so their descriptions actually expand. Their expanded description heights match the reference, and opening one entry closes the other entries in the same day.
- Preserved the Contact form's field positions, sizes, borders, colors, typefaces, and button styling. Required-field and invalid-email validation prevent submission locally.

## Remaining differences and deployment checks

### Google map

The current map is a standard Google Maps iframe with a darkening filter. Its surrounding position and size match, but its labels, controls, marker, and map styling do not reproduce the reference's styled JavaScript map. A separately configured Google Maps integration for the new site is needed for a closer match. No shared Squarespace API key has been copied into this repository.

### Underline and motion

The home-page underline is generated locally from text-line rectangles. At the reviewed sizes, some line endpoints differ from the reference by 1 px; the line positions, heights, and font-based stroke sizing are matched. The reveal and marquee effects use the original settings, but frame-by-frame synchronization with a separately loaded live page is not asserted.

### Fonts and embedded content

Adobe font delivery works in the local preview. Confirm the appropriate Adobe web-font project and continued font delivery on the eventual Netlify/custom domain before retiring the current hosting arrangement. The fonts are externally served, not redistributed as local font files.

YouTube and Google Slides remain external embeds with the original target URLs and layout. Their remote content, controls, availability, and load timing are not controlled by the static rebuild.

### Contact delivery

The form is prepared for Netlify Forms using a static detection form in `index.html` and a matching rendered POST form. It uses browser validation and a separate `/thank-you` route rather than Squarespace's form service and inline submission flow. Native validation messages therefore differ from Squarespace's error presentation.

No real message was sent during the local tests. On a Netlify preview, enable/confirm form detection and notification delivery, submit an explicitly authorized test message, and verify both receipt and the success page before changing the domain.

## Reproducible checks

```bash
npm ci
npm run check:fidelity
npm run build
npm run preview
```

`check:fidelity` verifies the stored content baseline, original asset fingerprints, script/event-handler removal, local asset existence, accordion control/panel relationships, and required form fields. It does not automatically run the browser layout comparison. The recorded layout summary is in `tests/fidelity-layout-summary.json`; repeat the visual comparison at the listed viewport sizes after changing layout or typography.

A clean dependency installation and production build pass. The dependency audit reports zero vulnerabilities after updating Vite from 8.0.13 to the minimal patched release 8.0.16. The relevant upstream advisories are [Windows file-deny bypass](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff) and [Windows editor path handling](https://github.com/vitejs/vite/security/advisories/GHSA-v6wh-96g9-6wx3).

## Owner review and migration

Review the local production preview at [127.0.0.1:4173](http://127.0.0.1:4173/), resolve or explicitly accept the remaining visual differences, and approve the baseline before publishing it to GitHub. Next, connect the repository to Netlify using the included configuration and complete font/form checks on its preview URL. Keep the existing domain pointed at the live site until the preview is approved.

No GitHub push, Netlify deployment, or domain change was made during this review.
