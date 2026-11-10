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
  const focus = () => {
    const el = stage.current;
    const svg = el?.querySelector("svg");
    const rect = svg?.querySelector<SVGRectElement>("[data-active-step]");
    const matrix = svg?.getScreenCTM();
    if (!el || !rect || !matrix) return;
    const bounds = rect.getBBox();
    const point = new DOMPoint(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    ).matrixTransform(matrix);
    const viewport = el.getBoundingClientRect();
    const panel = document.querySelector(".task-panel");
    const panelTop =
      panel && getComputedStyle(panel).position === "fixed"
        ? panel.getBoundingClientRect().top
        : viewport.bottom;
    const top = Math.max(0, viewport.top);
    const bottom = Math.min(viewport.bottom, panelTop);
    if (bottom <= top) return;
    const transform = new DOMMatrix(
      getComputedStyle(svg!.parentElement!).transform,
    );
    setPan({
      x: transform.m41 + viewport.left + viewport.width / 2 - point.x,
      y: transform.m42 + top + (bottom - top) / 2 - point.y,
    });
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
    const frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [
    page,
    p.id,
    p.step,
    p.strategy,
    p.reverse,
    p.rows,
    p.columns,
    panelExpanded,
  ]);
  useEffect(() => {
    if (page !== "workspace" || !stage.current) return;
    const observer = new ResizeObserver(() => focus());
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [page, p.step, p.strategy, p.reverse]);
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
      <main className={page === "workspace" ? "workspace-main" : undefined}>
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
                <button className="back" onClick={() => setPage("overview")}>
                  ← Pattern overview
                </button>
                <h2>
                  {p.name} <span className="tag">DEMO</span>
                </h2>
              </div>
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
                      maxWidth: `calc((var(--stage-height) - 32px) * ${(p.columns * CELL + 40) / (p.rows * CELL + 40)})`,
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
                  <button onClick={focus}>⌖ Focus step</button>
                </div>
              </section>
              <aside
                className={`card task-panel ${panelExpanded ? "expanded" : "collapsed"}`}
                aria-label="Beading task"
              >
                <div className="task-heading">
                  <div className="eyebrow">YOUR CURRENT STEP</div>
                  <button
                    className="panel-toggle"
                    aria-expanded={panelExpanded}
                    aria-controls="task-details"
                    onClick={() => setPanelExpanded((v) => !v)}
                  >
                    {panelExpanded ? "− Less" : "+ Details"}
                  </button>
                </div>
                <h2 className="step-title">
                  {p.strategy === "row" ? "Row" : "Column"} {coordinate(p) + 1}{" "}
                  <small>/ {stepCount(p)}</small>
                </h2>
                <p className="remaining-summary" aria-live="polite">
                  {cells.filter((c) => !c.isCompleted).length} remaining{" "}
                  <span>of {cells.length} beads</span>
                </p>
                <StepNavigation p={p} update={setP} />
                <button
                  className="primary full"
                  disabled={!cells.length}
                  onClick={() =>
                    change(markStep(p, !cells.every((c) => c.isCompleted)))
                  }
                >
                  {cells.length && cells.every((c) => c.isCompleted)
                    ? "↶ Clear this step"
                    : "✓ Mark step complete"}
                </button>
                <div className="task-details" id="task-details">
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
