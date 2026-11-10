import type { MouseEvent } from "react";
import { coordinate, type Project } from "./model";
export const CELL = 24;
export const MARGIN = 20;
export function Grid({
  p,
  active = false,
  onStep,
}: {
  p: Project;
  active?: boolean;
  onStep?: (step: number) => void;
}) {
  const width = p.columns * CELL,
    height = p.rows * CELL;
  const choose = (event: MouseEvent<SVGSVGElement>) => {
    if (!onStep) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    const n = Math.floor((p.strategy === "row" ? point.y : point.x) / CELL);
    const limit = p.strategy === "row" ? p.rows : p.columns;
    if (n >= 0 && n < limit) onStep(p.reverse ? limit - 1 - n : n);
  };
  return (
    <svg
      viewBox={`-${MARGIN} -${MARGIN} ${width + MARGIN * 2} ${height + MARGIN * 2}`}
      role="img"
      aria-label={`${p.name}, ${p.columns} columns by ${p.rows} rows${active ? `, ${p.strategy} ${coordinate(p) + 1} highlighted` : ""}`}
      onClick={choose}
    >
      {Array.from({ length: p.columns }, (_, i) => (
        <text key={`c${i}`} x={i * CELL + 12} y="-7">
          {i + 1}
        </text>
      ))}
      {Array.from({ length: p.rows }, (_, i) => (
        <text key={`r${i}`} x="-10" y={i * CELL + 15}>
          {i + 1}
        </text>
      ))}
      {p.grid.map((c) => (
        <g key={`${c.row}-${c.column}`}>
          <rect
            x={c.column * CELL}
            y={c.row * CELL}
            width={CELL}
            height={CELL}
            fill={
              c.isEmpty
                ? "#fffdf8"
                : p.palette.find((v) => v.code === c.colorCode)!.hex
            }
            stroke="#d9d3c8"
            strokeWidth=".6"
          />
          {!c.isEmpty && (
            <text
              fill={c.colorCode === "I1" ? "#fff" : "#292638"}
              x={c.column * CELL + 12}
              y={c.row * CELL + 15}
            >
              {c.isCompleted ? "✓" : c.colorCode}
            </text>
          )}
        </g>
      ))}
      {active && (
        <rect
          data-active-step
          x={p.strategy === "column" ? coordinate(p) * CELL : 0}
          y={p.strategy === "row" ? coordinate(p) * CELL : 0}
          width={p.strategy === "column" ? CELL : width}
          height={p.strategy === "row" ? CELL : height}
          fill="none"
          stroke="#292638"
          strokeWidth="3"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
