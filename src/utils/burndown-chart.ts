/** SVG geometry of the burndown chart. */
export interface ChartBox {
  width: number;
  height: number;
  padding: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface BurndownGeometry {
  /** SVG "x,y x,y" for the ideal line (every sprint day). */
  idealPoints: string;
  /** SVG points for the real line: from the first day up to the last day that already happened. */
  actualPoints: string;
  /** Last real point (today, or the last recorded day), to mark where the real line ends. */
  lastActual: ChartPoint | null;
}

/**
 * Builds the burndown lines. The x scale comes from the ideal line, which covers the whole sprint,
 * so the real line (null for days that have not happened yet) ends at today instead of being
 * stretched over the whole width. The y scale uses the highest value of both lines.
 */
export function buildBurndownGeometry(ideal: number[], actual: (number | null)[], box: ChartBox): BurndownGeometry {
  const days = Math.max(ideal.length, 1);
  const happened: number[] = [];
  for (const value of actual.slice(0, days)) {
    if (value === null || value === undefined || !Number.isFinite(value)) break;
    happened.push(value);
  }
  const maxPoints = Math.max(...ideal, ...happened, 1);
  const toPoint = (value: number, index: number): ChartPoint => ({
    x: box.padding + (index / Math.max(days - 1, 1)) * (box.width - 2 * box.padding),
    y: box.height - box.padding - (value / maxPoints) * (box.height - 2 * box.padding),
  });
  const toSvg = (points: ChartPoint[]) => points.map((point) => `${point.x},${point.y}`).join(' ');
  const actualChart = happened.map(toPoint);
  return {
    idealPoints: toSvg(ideal.map(toPoint)),
    actualPoints: toSvg(actualChart),
    lastActual: actualChart.length ? actualChart[actualChart.length - 1] : null,
  };
}
