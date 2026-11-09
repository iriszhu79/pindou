# Pindou · Phase 1

A mobile-first React + TypeScript + Vite beading studio. No backend, login, AI service, or credentials required. Node 22+ is required for the TypeScript model tests; the cloud environment uses Node 24.

## Develop

Use the existing isolated checkout `/workspace/pindou`; do not create a worktree unless explicitly requested.

```sh
cd /workspace/pindou
bash scripts/setup.sh
npm run dev
```

Vite serves the app under `/pindou/` (port 5173 by default). Verify the page in a browser, try the sample, complete a nonempty row, switch strategy, and refresh to confirm saved progress. Live servers must be restarted in future tasks. `npm run build` produces `dist/` for deployment under the GitHub Pages repository path `/pindou/`; `npm run preview` serves the production build.

## Included

- Home, image upload preview, recent project, pattern overview, and interactive workspace.
- Shared cell-level completion for rows/columns in either direction; undo (last 30 edits, current session).
- Pan, button/wheel zoom, two-finger pinch, fit, focus current step, and tap-to-toggle Select mode.
- Computed palette statistics, coordinate labels, current-step bead positions, and deterministic color-run recommendation.
- LocalStorage persistence, malformed-storage fallback, and visible storage-failure reporting. Data is device/browser/origin specific; uploads are temporary previews and are never parsed or persisted.

## Data accuracy

`src/model.ts` contains a separate synthetic 20 × 20 flower with 91 beads: P1 38, G1 16, Y1 17, I1 7, W1 13. These are demo codes. It is **not** a transcription of `public/samples/sample-pattern.jpg`. The original chart (40 × 51, labeled 1,179 beads) has not been verified cell by cell. Its counts are never presented as computed demo totals. Existing PRD and all reference/sample images are preserved.

Replace `createProject` with validated structured pattern data to support future parsed patterns; presentation and grid/statistics logic are separate. The current persisted-data validator intentionally accepts this Phase 1 demo only.

## Validation

```sh
npm test
npm run build
```

Three model tests cover exact demo totals, coordinates, shared progress, clearing, direction, empty steps, and recommendation. Chromium smoke checks exercised mobile navigation, upload preview, completion, strategy preservation, undo, reload, zoom, and horizontal overflow. Automated browser tooling was used outside the application dependencies.

## Cloud configuration status

The cloud draft read/save service returned INVALID_ARGUMENT and could not confirm persistence. Tested installation and startup steps are retained here and in `scripts/setup.sh`; cloud draft publication has not been performed.
