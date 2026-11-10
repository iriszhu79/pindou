import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createProject,
  loadProjects,
  stats,
  stepCells,
  markStep,
  coordinate,
  recommendation,
  stepCount,
  type Project,
} from "./model";
import "./style.css";
import "./workspace.css";
import { stepPanDelta } from "./viewport";
import { Grid, CELL } from "./Grid";
import { StepNavigation, StepPositions } from "./StepTools";
import { useCanvasInteraction } from "./useCanvasInteraction";
function Strategy({ p, update }: { p: Project; update: (p: Project) => void }) {
  return (
    <div className="strategy">
      <div className="segmented">
        {(["row", "column"] as const).map((s) => (
          <button
            key={s}
            className={p.strategy === s ? "selected" : ""}
            onClick={() => update({ ...p, strategy: s, step: 0 })}
          >
            {s === "row" ? "☷ Row-by-Row" : "▥ Column-by-Column"}
          </button>
        ))}
      </div>
      <label>
        Starting direction
        <select
          value={p.reverse ? "reverse" : "forward"}
          onChange={(e) =>
            update({ ...p, reverse: e.target.value === "reverse", step: 0 })
          }
        >
          <option value="forward">
            {p.strategy === "row" ? "Top to bottom ↓" : "Left to right →"}
          </option>
          <option value="reverse">
            {p.strategy === "row" ? "Bottom to top ↑" : "Right to left ←"}
          </option>
        </select>
      </label>
    </div>
  );
}
function App() {
  const [saved, setSaved] = useState(loadProjects);
  const [p, setP] = useState<Project>(
    () => loadProjects()[0] ?? createProject(),
  );
  const [page, setPage] = useState("home");
  const [upload, setUpload] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [select, setSelect] = useState(false);
  const [undo, setUndo] = useState<Project[]>([]);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const file = useRef<HTMLInputElement>(null);
  const counts = stats(p.grid, p.palette),
    total = counts.reduce((a, c) => a + c.count, 0),
    done = p.grid.filter((c) => !c.isEmpty && c.isCompleted).length,
    percent = total ? Math.round((done / total) * 100) : 0,
    cells = stepCells(p),
    rec = recommendation(p);
  useEffect(() => {
    if (page === "home") return;
    const next = [
      { ...p, updatedAt: new Date().toISOString() },
      ...saved.filter((v) => v.id !== p.id),
    ];
    setSaved(next);
    try {
      localStorage.setItem("pindou.projects.v1", JSON.stringify(next));
      setError("");
    } catch {
      setError(
        "Local storage is unavailable. Progress stays in this tab but cannot be saved.",
      );
    }
  }, [p, page]);
  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url);
    },
    [upload],
  );
  useEffect(() => setUndo([]), [p.id]);
  const change = (n: Project) => {
    setUndo((v) => [...v.slice(-29), p]);
    setP(n);
  };
  const open = () => {
    setP(saved[0] ?? createProject());
    setPage("overview");
    setUpload(null);
  };
  const focus = (force = true) => {
    const el = stage.current;
    const svg = el?.querySelector("svg");
    const active = svg?.querySelector<SVGRectElement>("[data-active-step]");
    if (!el || !active || !svg) return;
    const delta = stepPanDelta(
      active.getBoundingClientRect(),
      el.getBoundingClientRect(),
      p.strategy,
      force,
    );
    if (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5) return;
    const transform = new DOMMatrix(
      getComputedStyle(svg.parentElement!).transform,
    );
    setPan({ x: transform.m41 + delta.x, y: transform.m42 + delta.y });
  };
  const toggle = ({ x, y }: { x: number; y: number }) => {
    const svg = stage.current?.querySelector("svg");
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const pt = new DOMPoint(x, y).matrixTransform(matrix.inverse());
    const row = Math.floor(pt.y / CELL),
      column = Math.floor(pt.x / CELL);
    if (!p.grid.some((c) => c.row === row && c.column === column && !c.isEmpty))
      return;
    change({
      ...p,
      grid: p.grid.map((c) =>
        c.row === row && c.column === column
          ? { ...c, isCompleted: !c.isCompleted }
          : c,
      ),
    });
  };
  const { stage, scale, pan, setPan, zoom, fit, hand, dragging, handlers } =
    useCanvasInteraction(select, toggle);

  useEffect(() => {
    if (page !== "workspace") return;
    document.body.classList.add("workspace-open");
    return () => document.body.classList.remove("workspace-open");
  }, [page]);
  useEffect(() => {
    if (page !== "workspace" || !stage.current) return;
    const element = stage.current;
    const measure = () =>
      setStageSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [page]);
  useEffect(() => {
    if (page !== "workspace") return;
    const frame = requestAnimationFrame(() => focus(false));
    return () => cancelAnimationFrame(frame);
  }, [
    page,
    p.id,
    p.step,
    p.strategy,
    p.reverse,
    p.rows,
    p.columns,
    stageSize.width,
    stageSize.height,
  ]);
  return (
    <>
      <header>
        <button className="logo" onClick={() => setPage("home")}>
          <span>✿</span> pindou<sup>✦</sup>
        </button>
        <nav>
          <button onClick={() => setPage("home")}>My studio</button>
          <small>
            PHASE 01 <i /> LOCAL STUDIO
          </small>
        </nav>
      </header>
      <main
        className={
          page === "workspace"
            ? `workspace-main${focusMode ? " focus-mode" : ""}`
            : undefined
        }
      >
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">
                  ▪ SMALL BEADS. BIG POSSIBILITIES.
                </div>
                <h1>
                  A little focus.
                  <br />A little color.
                  <br />
                  <em>A little bead of joy.</em>
                </h1>
                <p>
                  Your cozy corner for pixel-perfect creations. Turn a pattern
                  into small, satisfying steps — one bead at a time.
                </p>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => file.current?.click()}
                  >
                    ↑ Upload Pattern
                  </button>
                  <button onClick={open}>Try Sample Pattern ↗</button>
                </div>
                <small>
                  No sign-up. No rush. Just you and your next creation.
                </small>
              </div>
              <div className="hero-art">
                <small>MADE OF LITTLE MOMENTS</small>
                <span className="spark">✦</span>
                <div className="art-board">
                  <Grid p={createProject()} />
                </div>
                <b>✿ A bloom, bead by bead.</b>
                <span className="art-caption">+ a little everyday magic</span>
              </div>
            </section>
            <div className="features">
              <span>▦ One step at a time</span>
              <span>✥ Make room to explore</span>
              <span>▣ Pick up where you left off</span>
            </div>
            {upload && (
              <section className="card upload">
                <div>
                  <div className="eyebrow">YOUR UPLOAD · PREVIEW ONLY</div>
                  <h2>{upload.name}</h2>
                  <p>
                    Automatic image recognition isn't available in Phase 1. This
                    image has not been parsed. Try the synthetic demo for an
                    interactive workspace.
                  </p>
                  <button onClick={open}>Use sample →</button>{" "}
                  <button onClick={() => setUpload(null)}>Close preview</button>
                </div>
                <img
                  src={upload.url}
                  alt="Uploaded pattern preview"
                  onError={() =>
                    setError(
                      "This image format cannot be displayed. Try PNG or JPEG.",
                    )
                  }
                />
              </section>
            )}
            <section className="recent">
              <div className="section-title">
                <div>
                  <div className="eyebrow">YOUR CREATIVE CORNER</div>
                  <h2>
                    Recent projects{" "}
                    <sup>{String(saved.length).padStart(2, "0")}</sup>
                  </h2>
                </div>
                <small>Saved on this device</small>
              </div>
              {saved.length ? (
                saved.map((v) => (
                  <button
                    className="project"
                    key={v.id}
                    onClick={() => {
                      setP(v);
                      setPage("workspace");
                      fit();
                    }}
                  >
                    <div className="thumb">
                      <Grid p={v} />
                    </div>
                    <div>
                      <span className="tag">SYNTHETIC DEMO</span>
                      <h3>{v.name}</h3>
                      <p>
                        {v.columns} × {v.rows} ·{" "}
                        {stats(v.grid, v.palette).filter((c) => c.count).length}{" "}
                        colors
                      </p>
                      <small>
                        {v.grid.filter((c) => c.isCompleted).length} beads
                        placed · Continue →
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty">
                  <span>▧</span>
                  <div>
                    <h3>Your next little masterpiece starts here.</h3>
                    <p>
                      Upload an image to preview it, or find your flow with our
                      sample.
                    </p>
                  </div>
                  <button onClick={open}>Explore the sample →</button>
                </div>
              )}
            </section>
            <section className="how">
              <div className="eyebrow">LESS COUNTING. MORE CREATING.</div>
              <h2>Find your flow, one bead at a time.</h2>
              <div>
                {[
                  [
                    "01",
                    "Bring a little inspiration",
                    "Preview your own image or explore our interactive demo.",
                  ],
                  [
                    "02",
                    "Choose your own rhythm",
                    "Work across rows or down columns. You set the pace.",
                  ],
                  [
                    "03",
                    "Watch it come together",
                    "Mark your progress and come back whenever you like.",
                  ],
                ].map(([n, t, d]) => (
                  <article key={n}>
                    <b>{n}</b>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {page === "overview" && (
          <>
            <button className="back" onClick={() => setPage("home")}>
              ← Back to studio
            </button>
            <div className="page-heading">
              <div className="eyebrow">A SMALL PROJECT, A HAPPY MOMENT</div>
              <h1>Find your next little moment.</h1>
              <p>Get to know your pattern, then find your rhythm.</p>
            </div>
            <div className="overview">
              <section className="card preview">
                <span className="tag">SYNTHETIC DEMO</span>
                <Grid p={p} active onStep={(step) => setP({ ...p, step })} />
                <p>{p.name} · Tap a row or column to preview</p>
                <StepNavigation p={p} update={setP} />
                <details>
                  <summary>About this sample & original reference</summary>
                  <p>
                    {p.id === "flower-demo"
                      ? "This synthetic flower is not a transcription of the original 40 × 51 chart."
                      : "This project uses structured grid data."}{" "}
                    All counts come from the {p.columns} × {p.rows} project
                    grid. The original's 1,179-bead total is not used here.
                  </p>
                  <a
                    href={`${import.meta.env.BASE_URL}samples/sample-pattern.jpg`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original chart ↗
                  </a>
                </details>
              </section>
              <div className="info">
                <section className="card">
                  <h2>
                    {p.name} <em>✿</em>
                  </h2>
                  <div className="metrics">
                    <div>
                      <b>
                        {p.columns} × {p.rows}
                      </b>
                      <small>GRID SIZE</small>
                    </div>
                    <div>
                      <b>{total}</b>
                      <small>BEADS</small>
                    </div>
                    <div>
                      <b>{counts.filter((c) => c.count).length}</b>
                      <small>COLORS</small>
                    </div>
                  </div>
                  <h3>Your bead palette</h3>
                  <div className="palette">
                    {counts.map((c) => (
                      <div key={c.code}>
                        <i style={{ background: c.hex }} />
                        <b>{c.code}</b>
                        <span>{c.name}</span>
                        <strong>
                          {c.count} <small>beads</small>
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="card">
                  <h2>Find your rhythm</h2>
                  <Strategy p={p} update={setP} />
                  <div className="recommend">
                    <b>
                      ✦ A little suggestion <small>EXPERIMENTAL</small>
                    </b>
                    <p>
                      {rec.strategy === "row"
                        ? "Row-by-row"
                        : "Column-by-column"}{" "}
                      has fewer or equal continuous color runs (
                      {Math.min(rec.row, rec.column)} vs{" "}
                      {Math.max(rec.row, rec.column)}). This simple estimate may
                      reduce color changes. Choose what feels comfortable.
                    </p>
                    <button
                      onClick={() =>
                        setP({ ...p, strategy: rec.strategy, step: 0 })
                      }
                    >
                      Use suggestion
                    </button>
                  </div>
                  <button
                    className="primary full"
                    onClick={() => {
                      setPage("workspace");
                      fit();
                    }}
                  >
                    Start Beading →
                  </button>
                </section>
              </div>
            </div>
          </>
        )}
        {page === "workspace" && (
          <>
            <div className="workspace-heading">
              <div>
                <button
                  className="back"
                  aria-label="Pattern overview"
                  title="Exit workspace"
                  onClick={() => setPage("overview")}
                >
                  ←
                </button>
                <h2 title={p.name}>
                  {p.name} <span className="tag">DEMO</span>
                </h2>
              </div>
              <button
                className="focus-mode-toggle"
                aria-pressed={focusMode}
                onClick={() => setFocusMode((v) => !v)}
              >
                {focusMode ? "Exit Focus" : "Focus mode"}
              </button>
              <div className="progress-info">
                <b>{percent}%</b> complete
                <div className="progress">
                  <i style={{ width: `${percent}%` }} />
                </div>
                <small>
                  {done} / {total} beads ·{" "}
                  {error ? "Unsaved" : "Saved on this device"}
                </small>
              </div>
            </div>
            <div className="workspace">
              <section className="canvas-card">
                <div className="toolbar">
                  <div>
                    <button
                      aria-pressed={hand}
                      className={hand ? "selected" : ""}
                      onClick={() => setSelect(false)}
                    >
                      ✥ Hand
                    </button>
                    <button
                      aria-pressed={!hand}
                      className={!hand ? "selected" : ""}
                      onClick={() => setSelect(true)}
                    >
                      ✓ Select
                    </button>
                  </div>
                  <span>{Math.round(scale * 100)}%</span>
                  <div>
                    <button aria-label="Zoom out" onClick={() => zoom(0.8)}>
                      −
                    </button>
                    <button aria-label="Zoom in" onClick={() => zoom(1.25)}>
                      +
                    </button>
                    <button onClick={fit}>Fit</button>
                  </div>
                </div>
                <div
                  className={`stage ${hand ? "hand-mode" : "select-mode"}${dragging && hand ? " is-dragging" : ""}`}
                  ref={stage}
                  tabIndex={0}
                  aria-label="Pattern canvas"
                  aria-describedby="canvas-help"
                  {...handlers}
                >
                  <div
                    className="canvas-pattern"
                    style={{
                      aspectRatio: `${p.columns * CELL + 40} / ${p.rows * CELL + 40}`,
                      width: `${Math.max(1, Math.min(stageSize.width - 32, ((stageSize.height - 32) * (p.columns * CELL + 40)) / (p.rows * CELL + 40)))}px`,
                      maxWidth: "none",
                      transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
                    }}
                  >
                    <Grid p={p} active />
                  </div>
                </div>
                <div className="canvas-caption">
                  <span id="canvas-help">
                    {hand
                      ? "Drag to pan · Ctrl/⌘ + scroll to zoom"
                      : "Tap a bead to toggle · Hold Space to pan"}
                  </span>
                  <div
                    className="canvas-step-nav"
                    role="group"
                    aria-label="Canvas step navigation"
                  >
                    <button
                      aria-label="Previous canvas step"
                      title="Previous step (does not mark complete)"
                      disabled={p.step === 0}
                      onClick={() => setP({ ...p, step: p.step - 1 })}
                    >
                      {p.strategy === "row"
                        ? p.reverse
                          ? "↓"
                          : "↑"
                        : p.reverse
                          ? "→"
                          : "←"}
                    </button>
                    <span>
                      {p.strategy === "row" ? "Row" : "Column"}{" "}
                      {coordinate(p) + 1}
                    </span>
                    <button
                      aria-label="Next canvas step"
                      title="Next step (does not mark complete)"
                      disabled={p.step === stepCount(p) - 1}
                      onClick={() => setP({ ...p, step: p.step + 1 })}
                    >
                      {p.strategy === "row"
                        ? p.reverse
                          ? "↑"
                          : "↓"
                        : p.reverse
                          ? "←"
                          : "→"}
                    </button>
                  </div>
                  <button onClick={() => focus()}>⌖ Focus step</button>
                </div>
              </section>
              <aside
                className={`card task-panel ${panelExpanded ? "expanded" : "collapsed"}`}
                aria-label="Beading task"
              >
                <div className="task-heading">
                  <h2 className="step-title">
                    {p.strategy === "row" ? "Row" : "Column"}{" "}
                    {coordinate(p) + 1} <small>/ {stepCount(p)}</small>
                  </h2>
                  <button
                    className="panel-toggle"
                    aria-expanded={panelExpanded}
                    aria-controls="task-details"
                    onClick={() => setPanelExpanded((v) => !v)}
                  >
                    {panelExpanded ? "− Less" : "+ Details"}
                  </button>
                </div>
                <p className="remaining-summary" aria-live="polite">
                  <span>
                    {cells.length} total ·{" "}
                    {cells.filter((c) => c.isCompleted).length} completed ·{" "}
                  </span>
                  {cells.filter((c) => !c.isCompleted).length} remaining
                </p>
                <div
                  className="color-chips"
                  role="list"
                  tabIndex={0}
                  aria-label="Remaining beads by color"
                >
                  {stats(cells, p.palette)
                    .filter((c) => c.count)
                    .map((c) => (
                      <span
                        className="color-chip"
                        role="listitem"
                        key={c.code}
                        aria-label={`${c.code}, ${c.count - c.done} remaining of ${c.count}`}
                      >
                        <i style={{ background: c.hex }} />
                        <b>{c.code}</b> × {c.count - c.done}
                      </span>
                    ))}
                  {!cells.length && (
                    <span className="empty-step" role="listitem">
                      Empty step · continue when ready
                    </span>
                  )}
                </div>
                <StepNavigation p={p} update={setP} />
                <button
                  className={`primary full complete-action${cells.length && cells.every((c) => c.isCompleted) ? " step-completed" : ""}`}
                  disabled={!cells.length}
                  onClick={() =>
                    change(markStep(p, !cells.every((c) => c.isCompleted)))
                  }
                >
                  {cells.length && cells.every((c) => c.isCompleted)
                    ? "↶ Clear this step"
                    : "✓ Mark step complete"}
                </button>
                <div
                  className="task-details"
                  id="task-details"
                  role="region"
                  aria-label="Task details"
                  tabIndex={0}
                >
                  <div className="palette step-counts">
                    {stats(cells, p.palette)
                      .filter((c) => c.count)
                      .map((c) => (
                        <div key={c.code}>
                          <i style={{ background: c.hex }} />
                          <b>{c.code}</b>
                          <strong>
                            {c.count - c.done} left <small>/ {c.count}</small>
                          </strong>
                        </div>
                      ))}
                  </div>
                  {!cells.length && (
                    <p className="muted">
                      A little breathing room. This step is empty — move on when
                      ready.
                    </p>
                  )}
                  <StepPositions p={p} />
                  <button
                    className="undo full"
                    disabled={!undo.length}
                    onClick={() => {
                      setP(undo[undo.length - 1]);
                      setUndo((v) => v.slice(0, -1));
                    }}
                  >
                    ↶ Undo last change
                  </button>
                  <hr />
                  <Strategy p={p} update={setP} />
                  <p className="muted">
                    ▣ Switching strategies preserves your completed beads.
                  </p>
                  {percent === 100 && (
                    <div className="recommend" role="status">
                      <h3>✦ You made it bloom!</h3>
                      <p>
                        Every bead is in place. Your finished project is saved
                        on this device.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
        <input
          hidden
          ref={file}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (!f.type.startsWith("image/") || f.size > 15 * 1024 * 1024) {
              setError("Choose an image smaller than 15 MB.");
              return;
            }
            setUpload({ url: URL.createObjectURL(f), name: f.name });
            e.target.value = "";
          }}
        />
      </main>
      <footer>
        <span className="logo">✿ pindou</span>
        <span>A little less counting. A little more joy.</span>
        <span>Made for your own pace. ✦</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
