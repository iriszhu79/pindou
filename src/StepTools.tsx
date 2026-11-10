import { coordinate, stepCount, stepLine, type Project } from "./model";
export function StepNavigation({
  p,
  update,
}: {
  p: Project;
  update: (p: Project) => void;
}) {
  return (
    <div className="step-navigation">
      <div className="step-nav">
        <button
          disabled={p.step === 0}
          onClick={() => update({ ...p, step: p.step - 1 })}
        >
          ← Previous
        </button>
        <span aria-live="polite">
          {p.strategy === "row" ? "Row" : "Column"} {coordinate(p) + 1} /{" "}
          {stepCount(p)}
        </span>
        <button
          disabled={p.step === stepCount(p) - 1}
          onClick={() => update({ ...p, step: p.step + 1 })}
        >
          Next →
        </button>
      </div>
      <label className="step-slider">
        Step {p.step + 1} of {stepCount(p)}
        <input
          aria-label="Beading step"
          type="range"
          min="0"
          max={stepCount(p) - 1}
          value={p.step}
          onChange={(e) => update({ ...p, step: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
export function StepPositions({ p }: { p: Project }) {
  return (
    <div className="step-positions">
      <p className="muted">
        {p.strategy === "row" ? "Column" : "Row"} positions · ✓ completed ·
        dotted = empty
      </p>
      <ol aria-label="Current step bead positions">
        {stepLine(p).map((c, i) => (
          <li key={i}>
            <span
              className={c.isEmpty ? "position empty-position" : "position"}
              style={{
                background: c.isEmpty
                  ? "transparent"
                  : p.palette.find((v) => v.code === c.colorCode)!.hex,
                color: c.colorCode === "I1" ? "white" : undefined,
              }}
              title={`${i + 1}: ${c.isEmpty ? "empty" : `${c.colorCode}, ${c.isCompleted ? "completed" : "remaining"}`}`}
              aria-label={`${i + 1}: ${c.isEmpty ? "empty" : `${c.colorCode}, ${c.isCompleted ? "completed" : "remaining"}`}`}
            >
              {c.isEmpty ? "·" : c.isCompleted ? "✓" : c.colorCode}
            </span>
            <small>{i + 1}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
