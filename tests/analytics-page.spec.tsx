import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AnalyticsPage } from '../src/pages/AnalyticsPage';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return { ...actual, useQuery: jest.fn(), useMutation: jest.fn() };
});

const apollo = jest.requireMock('@apollo/client') as { useQuery: jest.Mock; useMutation: jest.Mock };
const operationName = (doc: any) => doc.definitions.find((d: any) => d.kind === 'OperationDefinition')?.name?.value;

const SPRINT = { id: 'sprint-1', name: 'Sprint 1', goal: 'Entregar pagos' };
const ISSUES = [{ id: 'issue-1', key: 'PLAT-1', title: 'Pasarela' }];
const METRICS = {
  sprintId: 'sprint-1', velocity: 21, idealBurndown: [20, 10, 0], actualBurndown: [20, 15, 9], blockedCount: 2, healthStatus: 'AT_RISK',
};

let burndown: { data?: unknown; loading?: boolean; error?: Error };
let workLogs: { data?: unknown; error?: Error; refetch: jest.Mock };
let diagnose: jest.Mock;
let logWork: jest.Mock;

beforeEach(() => {
  burndown = { data: { getBurndownAnalytics: METRICS }, loading: false };
  workLogs = {
    data: {
      projectWorkLogs: {
        totalHours: 3.5,
        entries: [{ id: 'w1', issueKey: 'PLAT-1', issueTitle: 'Pasarela', userName: 'Ana', hours: 3.5, note: 'Webhooks', loggedAt: '2026-11-14T10:00:00.000Z' }],
      },
    },
    refetch: jest.fn().mockResolvedValue({}),
  };
  diagnose = jest.fn().mockResolvedValue({
    data: { aiDiagnoseMetrics: { sprintId: 'sprint-1', healthStatus: 'AT_RISK', summary: 'Hay bloqueos', rootCauses: ['Dependencia externa'], recommendations: ['Hacer swarming'] } },
  });
  logWork = jest.fn().mockResolvedValue({ data: { logWork: { id: 'w2' } } });
  apollo.useQuery.mockImplementation((doc: any) => {
    const name = operationName(doc);
    if (name === 'GetBurndownAnalytics') return { loading: false, ...burndown };
    if (name === 'ProjectWorkLogs') return { loading: false, ...workLogs };
    return { data: undefined, loading: false };
  });
  apollo.useMutation.mockImplementation((doc: any) => {
    const name = operationName(doc);
    if (name === 'AiDiagnoseMetrics') return [diagnose, { loading: false }];
    return [logWork, { loading: false }];
  });
});

describe('AnalyticsPage', () => {
  it('draws the burndown with theme classes, a legend and the KPI boxes', () => {
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    const chart = screen.getByLabelText('Gráfico de burndown del sprint');
    expect(chart).toHaveClass('burndown-chart');
    expect(chart.querySelector('.burndown-axis')).not.toBeNull();
    expect(chart.querySelector('.burndown-ideal')).not.toBeNull();
    expect(chart.querySelector('.burndown-actual')).not.toBeNull();
    // Dark-theme colors are gone from the markup; strokes come from CSS.
    expect(container.innerHTML).not.toMatch(/#3f3f46|#71717a|#3b82f6/i);
    expect(screen.getByText('Ideal')).toHaveClass('burndown-legend-item', 'is-ideal');
    expect(screen.getByText('Real')).toHaveClass('burndown-legend-item');

    const kpis = container.querySelector('.analytics-kpis') as HTMLElement;
    expect(within(kpis).getByText('21 SP / sprint')).toBeInTheDocument();
    expect(within(kpis).getByText('2')).toBeInTheDocument();
    expect(within(kpis).getByText('AT_RISK')).toBeInTheDocument();
  });

  it('explains when there are not enough burndown points to draw the chart', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, actualBurndown: [20] } } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByText(/El burndown estará disponible/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Gráfico de burndown del sprint')).not.toBeInTheDocument();
  });

  it('shows loading, error and empty states', () => {
    burndown = { data: undefined, loading: true };
    const { unmount } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByText('Cargando métricas del sprint Sprint 1...')).toBeInTheDocument();
    unmount();

    burndown = { data: undefined, error: new Error('Kafka caído') };
    const second = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByText('No se pudieron cargar las métricas: Kafka caído')).toBeInTheDocument();
    second.unmount();

    burndown = { data: { getBurndownAnalytics: null } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByText('Todavía no hay datos analíticos para este sprint.')).toBeInTheDocument();
  });

  it('runs the AI diagnosis with the blocked count and renders the recommendations card', async () => {
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    fireEvent.click(screen.getByText('Analizar sprint con IA'));

    await screen.findByText('Hay bloqueos');
    expect(diagnose).toHaveBeenCalledWith({ variables: { input: { projectId: 'project-1', sprintId: 'sprint-1', blockedIssuesCount: 2 } } });
    const card = container.querySelector('.ai-diagnosis-card') as HTMLElement;
    expect(within(card).getByText('Dependencia externa')).toBeInTheDocument();
    expect(within(card).getByText('Hacer swarming')).toBeInTheDocument();
  });

  it('shows the diagnosis error', async () => {
    diagnose.mockRejectedValueOnce(new Error('El agente de IA no está disponible'));
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    fireEvent.click(screen.getByText('Analizar sprint con IA'));

    expect(await screen.findByText('El agente de IA no está disponible')).toBeInTheDocument();
  });

  it('lists logged time and records new work', async () => {
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    const section = container.querySelector('.work-log-section') as HTMLElement;
    expect(within(section).getByText('3.50 h')).toBeInTheDocument();
    expect(within(section.querySelector('.work-log-list') as HTMLElement).getByText('Webhooks')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Historia para registrar tiempo'), { target: { value: 'issue-1' } });
    fireEvent.change(screen.getByLabelText('Horas trabajadas'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Nota del registro de tiempo'), { target: { value: 'Pruebas' } });
    fireEvent.click(screen.getByText('Registrar tiempo'));

    await waitFor(() => expect(logWork).toHaveBeenCalledWith({
      variables: { input: { projectId: 'project-1', issueId: 'issue-1', hours: 2, note: 'Pruebas' } },
    }));
    await waitFor(() => expect(workLogs.refetch).toHaveBeenCalled());
    expect(screen.getByLabelText('Nota del registro de tiempo')).toHaveValue('');
  });

  it('accepts whole and quarter hours in the hours field (min and step aligned)', () => {
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    const hours = screen.getByLabelText('Horas trabajadas') as HTMLInputElement;
    for (const value of ['0.25', '1', '1.5', '2', '24']) {
      fireEvent.change(hours, { target: { value } });
      expect(hours.checkValidity()).toBe(true);
    }
    fireEvent.change(hours, { target: { value: '0.1' } });
    expect(hours.checkValidity()).toBe(false);
  });

  it('shows work log errors', async () => {
    logWork.mockRejectedValueOnce(new Error('Máximo 24 horas'));
    workLogs = { ...workLogs, error: new Error('BFF caído') };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    expect(screen.getByText('No se pudo cargar el tiempo registrado: BFF caído')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Historia para registrar tiempo'), { target: { value: 'issue-1' } });
    fireEvent.click(screen.getByText('Registrar tiempo'));
    expect(await screen.findByText('Máximo 24 horas')).toBeInTheDocument();
  });
});
