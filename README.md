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
- Hand Mode for mouse/touch panning, Select Mode for inspection with separate explicit completion, temporary Hand Mode with Space, modifier-wheel/button zoom, two-finger pinch, fit, and focus current step.
- Computed palette statistics, coordinate labels, current-step bead positions, and deterministic color-run recommendation.
- LocalStorage persistence, malformed-storage fallback, and visible storage-failure reporting. Data is device/browser/origin specific; uploads are temporary previews and are never parsed or persisted.

## Data accuracy

`src/model.ts` contains a separate synthetic 20 × 20 flower with 91 beads: P1 38, G1 16, Y1 17, I1 7, W1 13. These are demo codes. It is **not** a transcription of `public/samples/sample-pattern.jpg`. The original chart (40 × 51, labeled 1,179 beads) has not been verified cell by cell. Its counts are never presented as computed demo totals. Existing PRD and all reference/sample images are preserved.

Replace `createProject` with validated structured pattern data to support future parsed patterns; presentation and grid/statistics logic are separate. The persisted-data validator accepts rectangular projects with positive dimensions, a complete row-major grid, and a valid per-project palette; legacy flower projects retain their saved progress unchanged.

## Validation

```sh
npm test
npm run build
```

Eighteen model/hit/route/focus tests cover exact demo totals, coordinates, shared progress, clearing, direction, empty steps, recommendation, rectangular grids, palette-based statistics, and legacy storage compatibility. Chromium smoke checks exercised mobile navigation, upload preview, completion, strategy preservation, undo, reload, zoom, and horizontal overflow. Playwright is a development dependency; it is not bundled into the application.

## Cloud configuration status

The cloud draft read/save service returned INVALID_ARGUMENT and could not confirm persistence. Tested installation and startup steps are retained here and in `scripts/setup.sh`; cloud draft publication has not been performed.

## GitHub Pages deployment

Expected live URL: https://iriszhu79.github.io/pindou/ . This is the intended address; it is live only after a successful Pages deployment.

1. In the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. A repository administrator may need to do this. Ensure GitHub Actions and the official actions used by the workflow are allowed in repository/organization settings.
2. Merge the deployment workflow PR into `main`. `.github/workflows/deploy.yml` runs on every push to `main`, using Node.js 24 and `npm ci`, `npm test`, and `npm run build`. A failed install, test, or build prevents deployment.
3. The workflow uploads only the generated `dist/` directory using `actions/upload-pages-artifact`, then publishes it using `actions/deploy-pages`. No Jekyll build or source-branch publishing is used.
4. To deploy manually after the workflow is on `main`, open **Actions → Deploy to GitHub Pages → Run workflow**, select `main`, and run it. Use `main` for production deployments.

### Check deployment status

Open https://github.com/iriszhu79/pindou/actions and select the latest **Deploy to GitHub Pages** run. Both `build` and `deploy` must succeed. The `github-pages` environment/deployment link and **Settings → Pages** show the deployed URL. After success, open the site and test sample navigation, the original chart link, and saved progress. A pushed branch or passing local build alone does not mean the site is deployed.

### Troubleshooting

- **Pages configuration / 404 / deploy permission error:** select GitHub Actions as the Pages source; check repository Actions policies and `github-pages` environment protection rules. The workflow needs `contents: read`, `pages: write`, and `id-token: write`. Approve an environment deployment if your repository requires it. Read the failing step's log before rerunning.
- **Dependency, test, or build failure:** reproduce with Node.js 24, `npm ci`, `npm test`, and `npm run build`. Commit matching dependency and lockfile changes together; do not bypass failing tests.
- **Blank page or missing JS/CSS/images:** retain `base: '/pindou/'` in `vite.config.ts` and use `import.meta.env.BASE_URL` for public assets. The original sample resolves to `/pindou/samples/sample-pattern.jpg`. Publish `dist/`, not the source checkout. Inspect browser Network/Console errors and verify the exact case of image filenames.
- **Old content:** verify that the successful deployment used the expected `main` commit, wait for Pages propagation, then hard-refresh. Do not clear LocalStorage unless you intend to delete saved progress.
- **Manual run button missing:** the workflow must first exist on the default branch and include `workflow_dispatch`.

For a local production check, run `npm run build` then `npm run preview` and open the displayed address under `/pindou/`. LocalStorage is origin-specific, so local development progress will not automatically appear on GitHub Pages.

## V1.1 workspace controls

- **Hand:** drag with a mouse or finger to pan. The grab cursor becomes grabbing while held. Clicking/tapping never changes completion or the active step.
- **Select:** click/tap a bead to inspect its color, original coordinates, and completion status. Use **Mark Selected Complete** or **Undo Completion** explicitly. Selecting another bead or clearing selection never changes progress. Cross-cell release drift, drags, cancelled touches, and pinches never select a neighboring cell or complete a bead.
- **Space:** hold while the canvas/page is focused to temporarily pan; release to restore Select. Focused buttons/selects retain their normal keyboard behavior. Switching modes leaves zoom, pan, and progress intact.
- **Scroll:** normal wheel/two-finger trackpad scroll moves the page. Hold **Ctrl** or **Command** while scrolling over the canvas to zoom. The +/− buttons work in either mode; two-finger touchscreen pinch is also supported. Fit resets the view; Focus step recenters the active row/column.

The existing `pindou.projects.v1` LocalStorage key and project schema are unchanged; no reset or migration is required.

### Browser interaction regression test

Install dependencies with `npm ci` and Chromium with `npx playwright install chromium` (on Linux, install browser OS dependencies as needed). Start `npm run dev` in one terminal, then run `npm run test:browser` in another. For an existing Chromium installation, set `CHROMIUM_PATH=/path/to/chromium`. To test a local production preview instead, set `PINDOU_TEST_URL=http://127.0.0.1:4173/pindou/` after running `npm run build` and `npm run preview -- --port 4173`.

The browser regression checks mouse/touch selection and panning, drag suppression, Space, native wheel scrolling, Ctrl/Command zoom, zoom buttons, pinch, reload persistence, and mobile overflow. It uses an isolated browser context and does not modify your browser's saved projects. Physical Mac trackpad acceptance testing remains useful; modifier wheel behavior is verified using Chromium input events.

### V1.1 strategy preview and task panel

The overview highlights the chosen row/column. Tap the preview, use Previous/Next, or move the step slider to explore the strategy and starting direction without changing bead completion. Start Beading continues from that previewed step.

In the workspace, navigation reveals an offscreen active step with minimal movement and preserves zoom; an already-visible step stays in place. Focus step can restore it after manual panning; Fit still shows the whole grid. On phones, focus accounts for the fixed task panel. The panel keeps navigation, completion, and the total remaining count visible; Details expands per-color remaining/required counts, an ordered bead-position strip (including empty positions and completion checkmarks), undo, and strategy controls. Collapse returns more room to the pattern. Panel details scroll independently on small screens.

Grid dimensions, axis limits, coordinates, progress, palette counts, and viewport sizing derive from project data, including rectangular patterns. Loading a different saved project does not discard other projects. The original flower data, `pindou.projects.v1` storage key, and PR #3 input behavior remain unchanged. This does not add image parsing or a pattern-import editor.

`npm run test:browser` includes the updated input regression suite and `tests/steps.mjs`, which checks preview navigation, reverse limits, rectangular/tall grids, viewport centering with zoom retention, remaining counts/undo, the collapsible fixed mobile panel, and retention of legacy progress and multiple projects. No deployment configuration is changed.

## V1.2 — viewport beading sessions

The workspace is a viewport-sized tool (the studio/overview remain normal webpages). Phones and tablets in portrait have a canvas above a persistent task dock. Landscape phones, landscape tablets, and desktop use a canvas with a task panel on the right. Essential controls never require vertical webpage scrolling: coordinate, total/completed/remaining counts, computed color chips, Previous/Next, and a separate Mark Step Complete action. Only optional task details and unusually large color lists scroll internally.

Canvas-edge arrows follow row/column direction, including reversed strategies; navigation never marks beads complete. Automatic focus uses actual rendered bounds and moves only when the active step is outside the usable canvas. It preserves zoom, and manual pan never changes the step. Focus step explicitly centers the current strip; Fit still resets the view.

Focus mode removes optional task detail and extra project chrome while retaining tools, progress, color quantities, and navigation. **Exit Focus** is always visible; leave Focus before exiting the project. It uses no browser fullscreen or orientation-lock API. Rotation keeps the tool, step, zoom, and completion data, remeasures the canvas, and reveals the active step only if needed. `100dvh` (with a `100vh` fallback), `viewport-fit=cover`, and safe-area padding keep the workspace within supported mobile browser viewports. Native browser toolbar/home-indicator behavior still requires physical-device review.

The `pindou.projects.v1` key, IDs, cell colors, and completion schema are unchanged. No migration, clearing of storage, or cloud synchronization is introduced. Upload recognition remains preview-only, and the original chart is not transcribed. Large-grid browser tests use an explicitly synthetic 40-column × 51-row fixture, not guessed source-image data.

Validation commands are `npm ci`, `npm test`, `npm run build`, and `npm run test:browser` against a running dev server or production preview. See [V1.2 QA](docs/V1.2-QA.md) for automated viewports, coverage, and real-device limitations. GitHub Pages configuration is unchanged; this feature branch must be reviewed and merged before the existing deployment workflow can publish it.

## V1.3 — select, place, navigate

Selection and completion are independent. A selected bead has a two-tone dashed outline and corner markers; a placed bead keeps its original color/code and adds a high-contrast boxed check. Select only changes temporary UI state. The selected-bead inspector shows row, column, color, and status, with explicit completion/undo and clear-selection controls. Hand, pinch, wheel, route changes, and Focus never silently complete beads. Keyboard users can Tab into the Select grid, use arrow keys to inspect the next nonempty cell, and Enter to select; Space remains temporary Hand Mode. Selection clears on a project change or invalid cell and is never written to LocalStorage.

The workspace route bar exposes row/column strategy and direction without opening Details. Focus Mode has a compact **Focus route** menu in its top bar. A changed strategy/direction starts at the first step with unfinished beads, preserving exactly the same completed cells and overall percentage.

New projects skip empty boundaries and display **Step 1 / 16 · Row 3** for the synthetic flower. Previous/Next skip empty rows/columns but retain physical chart coordinates. **Show empty steps** explicitly switches to **Grid coordinate …** navigation without deleting cells. Resuming keeps a saved nonempty position; a legacy empty position routes to the first unfinished/nonempty step. Completed projects show a finished banner. An entirely empty pattern is handled separately without fake progress or an error.

Compatibility: the `pindou.projects.v1` key and project IDs are unchanged. The persisted `step` remains the original directional **grid offset**, not a nonempty-route index. Routes are derived from the grid at runtime; there is no destructive migration. Opening the studio does not rewrite saved projects. Progress is still browser/origin local, with no cross-device sync.

Focus Mode now removes the secondary route bar, folds dock actions together, and narrows the wide-screen side panel, increasing useful canvas area rather than merely hiding text. It retains strategy access, tools, selection, progress, colors, navigation, and Exit Focus. Supported layout changes may adjust pan to keep the active step visible; zoom and project progress are retained.

Hit detection uses the current SVG matrix after checking it against rendered fill geometry, with an axis-aligned rendered-rectangle fallback for CSS-transform inconsistencies. Pointer down/up must identify the same cell. It does not apply iPhone offsets or trust rounded native SVG hit boxes near tiny borders. The implementation supports the workspace's existing translate/scale transforms; adding arbitrary rotation/skew would require revisiting the fallback.

See [V1.3 QA](docs/V1.3-QA.md) for reproduced failure paths, test coverage, and physical Safari/iPad limitations. Run `npm ci`, `npm test`, `npm run build`, and `npm run test:browser` against the dev server or a local production preview. The browser command includes five suites; `V13_WIDTH=375 node tests/selection-navigation.mjs` can isolate one selection-test width during diagnosis.
