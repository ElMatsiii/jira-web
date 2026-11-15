import { buildBurndownGeometry } from '../src/utils/burndown-chart';

const box = { width: 100, height: 100, padding: 0 };

describe('buildBurndownGeometry', () => {
  it('scales both lines over the ideal days and ends the real line at the last known day', () => {
    const chart = buildBurndownGeometry([20, 10, 0], [20, 15, null], box);

    expect(chart.idealPoints).toBe('0,0 50,50 100,100');
    expect(chart.actualPoints).toBe('0,0 50,25');
    expect(chart.lastActual).toEqual({ x: 50, y: 25 });
  });

  it('uses the highest value of both lines for the y scale (scope creep above the ideal start)', () => {
    const chart = buildBurndownGeometry([10, 0], [20, null], box);

    expect(chart.idealPoints).toBe('0,50 100,100');
    expect(chart.actualPoints).toBe('0,0');
  });

  it('has no real line when no day has happened yet', () => {
    const chart = buildBurndownGeometry([8, 4, 0], [null, null, null], box);

    expect(chart.actualPoints).toBe('');
    expect(chart.lastActual).toBeNull();
  });

  it('stops at the first missing day and ignores values beyond the sprint', () => {
    const chart = buildBurndownGeometry([4, 2, 0], [4, null, 1, 9], box);

    expect(chart.actualPoints).toBe('0,0');
  });

  it('handles empty lines', () => {
    expect(buildBurndownGeometry([], [], box)).toEqual({ idealPoints: '', actualPoints: '', lastActual: null });
  });
});
