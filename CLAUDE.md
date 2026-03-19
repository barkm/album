# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static site to build/
npm run check        # Type-check with svelte-check
npm run lint         # Check formatting (Prettier) and lint (ESLint)
npm run format       # Auto-fix formatting
npm run test         # Run unit tests (single run)
npm run test:unit    # Run unit tests in watch mode
```

Run a single test file: `npx vitest run src/lib/packing/packing.spec.ts`

## Architecture

**What it is:** A client-side-only SvelteKit SPA for arranging photos into print-ready album pages. No SSR, no backend — fully static with `adapter-static`.

**Tech stack:** SvelteKit 2 + Svelte 5, Konva (2D canvas), Dexie (IndexedDB), Tailwind CSS 4, TypeScript strict mode.

**Main UI flow (`src/routes/+page.svelte`):** Three-tab interface:

1. **Layout** — drag/drop images onto album pages, position/resize via Konva transformer
2. **Print** — bin-pack images across print pages, download as PNG
3. **Settings** — configure album size, paper dimensions, resolution, padding

**Key components:**

- `src/lib/components/Layout.svelte` — multi-page canvas editor; syncs with IndexedDB
- `src/lib/components/Page.svelte` — single page using Konva; handles image transforms
- `src/lib/components/Print.svelte` — print preview and PNG download
- `src/lib/components/Settings.svelte` — configuration form

**Packing algorithm (`src/lib/packing/packing.ts`):** Guillotine bin-packing that places images across multiple pages, respects padding/borders, and supports rotation optimization. Has unit tests in `packing.spec.ts`.

**Persistence (`src/lib/db.ts`):** Dexie/IndexedDB stores images (as blobs) and page layout state. No centralized Svelte store — state is component-local with `$state()` / `$bindable()`.

**Constraints:** Images are validated against min/max dimensions based on short/long side of the configured album size. HEIC files are only supported on Safari.
