export const palette = [
  { code: "P1", name: "Petal pink", hex: "#EFA4B7" },
  { code: "G1", name: "Leaf green", hex: "#A7CB8C" },
  { code: "Y1", name: "Butter yellow", hex: "#F6C768" },
  { code: "I1", name: "Dark ink", hex: "#292638" },
  { code: "W1", name: "Warm white", hex: "#FFF1DC" },
];
export type Cell = {
  row: number;
  column: number;
  colorCode: string | null;
  isEmpty: boolean;
  isCompleted: boolean;
};
export type Project = {
  id: string;
  name: string;
  rows: number;
  columns: number;
  grid: Cell[];
  palette: typeof palette;
  strategy: "row" | "column";
  reverse: boolean;
  step: number;
  updatedAt: string;
};
// Original, synthetic flower. Deliberately distinct from the untranscribed source chart.
const flower = [
  "....................",
  "....................",
  "......PPP.PPP.......",
  ".....PPPPYPPPP......",
  ".....PPYYYYYPP......",
  "......PYYYYYP.......",
  ".....PPYYYYYPP......",
  ".....PPPPYPPPP......",
  "......PPPIPPP.......",
  ".........I..........",
  "......GG.IGG........",
  ".....GGGGIGGG.......",
  "......GGGIGG........",
  ".........I..........",
  ".........I..........",
  ".......WWWWW........",
  ".......WWWWW........",
  "........WWW.........",
  "....................",
  "....................",
];
export function createProject(): Project {
  return {
    id: "flower-demo",
    name: "Little bloom",
    rows: flower.length,
    columns: flower[0].length,
    grid: flower.flatMap((line, row) =>
      [...line].map((v, column) => ({
        row,
        column,
        colorCode:
          (
            { P: "P1", G: "G1", Y: "Y1", I: "I1", W: "W1" } as Record<
              string,
              string
            >
          )[v] ?? null,
        isEmpty: v === ".",
        isCompleted: false,
      })),
    ),
    palette,
    strategy: "row",
    reverse: false,
    step: 0,
    updatedAt: new Date().toISOString(),
  };
}
export function stats(grid: Cell[], colors = palette) {
  return colors.map((p) => ({
    ...p,
    count: grid.filter((c) => !c.isEmpty && c.colorCode === p.code).length,
    done: grid.filter(
      (c) => !c.isEmpty && c.colorCode === p.code && c.isCompleted,
    ).length,
  }));
}
export function coordinate(p: Project) {
  return p.reverse
    ? (p.strategy === "row" ? p.rows : p.columns) - 1 - p.step
    : p.step;
}
export function stepCells(p: Project) {
  const n = coordinate(p);
  return p.grid.filter(
    (c) => !c.isEmpty && (p.strategy === "row" ? c.row : c.column) === n,
  );
}
export function markStep(p: Project, complete: boolean): Project {
  const selected = new Set(stepCells(p));
  return {
    ...p,
    grid: p.grid.map((c) =>
      selected.has(c) ? { ...c, isCompleted: complete } : c,
    ),
  };
}
export function recommendation(p: Project) {
  const runs = (axis: "row" | "column") => {
    let n = 0;
    for (let a = 0; a < (axis === "row" ? p.rows : p.columns); a++) {
      let last: string | null = null;
      for (const c of p.grid.filter(
        (c) => (axis === "row" ? c.row : c.column) === a,
      )) {
        if (!c.isEmpty && c.colorCode !== last) n++;
        last = c.colorCode;
      }
    }
    return n;
  };
  const row = runs("row"),
    column = runs("column");
  return {
    strategy: row <= column ? ("row" as const) : ("column" as const),
    row,
    column,
  };
}
export function stepCount(p: Project) {
  return p.strategy === "row" ? p.rows : p.columns;
}
export function stepLine(p: Project) {
  const n = coordinate(p);
  return p.grid.filter((c) => (p.strategy === "row" ? c.row : c.column) === n);
}
export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Project;
  if (
    typeof p.id !== "string" ||
    !p.id ||
    typeof p.name !== "string" ||
    typeof p.updatedAt !== "string"
  )
    return false;
  if (
    !Number.isInteger(p.rows) ||
    !Number.isInteger(p.columns) ||
    p.rows < 1 ||
    p.columns < 1 ||
    p.rows * p.columns > 250000
  )
    return false;
  if (
    !["row", "column"].includes(p.strategy) ||
    typeof p.reverse !== "boolean" ||
    !Number.isInteger(p.step) ||
    p.step < 0 ||
    p.step >= stepCount(p)
  )
    return false;
  if (
    !Array.isArray(p.palette) ||
    !p.palette.length ||
    !p.palette.every(
      (c) =>
        c &&
        typeof c.code === "string" &&
        typeof c.name === "string" &&
        typeof c.hex === "string" &&
        /^#[0-9a-f]{6}$/i.test(c.hex),
    )
  )
    return false;
  const codes = new Set(p.palette.map((c) => c.code));
  return (
    codes.size === p.palette.length &&
    Array.isArray(p.grid) &&
    p.grid.length === p.rows * p.columns &&
    p.grid.every(
      (c, i) =>
        c &&
        c.row === Math.floor(i / p.columns) &&
        c.column === i % p.columns &&
        typeof c.isCompleted === "boolean" &&
        typeof c.isEmpty === "boolean" &&
        (c.isEmpty ? c.colorCode === null : codes.has(c.colorCode!)),
    )
  );
}
export function loadProjects(): Project[] {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem("pindou.projects.v1") ?? "[]",
    );
    return Array.isArray(raw) ? raw.filter(isProject) : [];
  } catch {
    return [];
  }
}
