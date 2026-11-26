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
let burndownRefetch: jest.Mock;
let workLogs: { data?: unknown; error?: Error; refetch: jest.Mock };
let diagnose: jest.Mock;
let logWork: jest.Mock;
let trend: { data?: unknown; loading?: boolean; error?: Error };
let retrospective: jest.Mock;

beforeEach(() => {
  burndown = { data: { getBurndownAnalytics: METRICS }, loading: false };
  burndownRefetch = jest.fn().mockResolvedValue({});
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
  trend = {
    data: {
      getProjectVelocityTrend: {
        projectId: 'project-1',
        velocity: 28.5,
        velocitySampleSize: 2,
        totalPoints: 60,
        completedPoints: 55,
        velocityHistory: [
          {
            sprintId: 'sp-1',
            sprintName: 'Sprint 1',
            committedStoryPoints: 30,
            completedStoryPoints: 27,
            completedDate: '2026-11-01T00:00:00Z',
          },
          {
            sprintId: 'sp-2',
            sprintName: 'Sprint 2',
            committedStoryPoints: 30,
            completedStoryPoints: 28,
            completedDate: '2026-11-15T00:00:00Z',
          },
        ],
      },
    },
    loading: false,
  };
  retrospective = jest.fn().mockResolvedValue({
    data: {
      aiProjectRetrospective: {
        projectId: 'project-1',
        summary: 'Alta cadencia y buena predictibilidad.',
        strengths: ['Velocidad consistente de 28.5 SP'],
        areasForImprovement: ['Diferencia minima de 5 SP'],
        actionableRecommendations: ['Mantener la capacidad en 28 SP'],
      },
    },
  });

  apollo.useQuery.mockImplementation((doc: any) => {
    const name = operationName(doc);
    if (name === 'GetBurndownAnalytics') return { loading: false, refetch: burndownRefetch, ...burndown };
    if (name === 'ProjectWorkLogs') return { loading: false, ...workLogs };
    if (name === 'GetProjectVelocityTrend') return { loading: false, ...trend };
    return { data: undefined, loading: false };
  });
  apollo.useMutation.mockImplementation((doc: any) => {
    const name = operationName(doc);
    if (name === 'AiDiagnoseMetrics') return [diagnose, { loading: false }];
    if (name === 'AiProjectRetrospective') return [retrospective, { loading: false }];
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
    expect(screen.getByText('Real (hasta hoy)')).toHaveClass('burndown-legend-item');

    const kpis = container.querySelector('.analytics-kpis') as HTMLElement;
    expect(within(kpis).getByText('21 SP / sprint')).toBeInTheDocument();
    expect(within(kpis).getByText('2')).toBeInTheDocument();
    expect(within(kpis).getByTestId('sprint-health')).toHaveTextContent('En riesgo');
    expect(within(kpis).getByTestId('sprint-health')).toHaveClass('health-badge', 'is-at-risk');
  });

  it('explains when the sprint has no ideal line to draw', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, idealBurndown: [20], actualBurndown: [20] } } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByText(/El burndown estará disponible/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Gráfico de burndown del sprint')).not.toBeInTheDocument();
  });

  it('draws the whole ideal line and the real one only up to today', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, idealBurndown: [20, 10, 0], actualBurndown: [20, 14, null] } } };
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    const ideal = container.querySelector('.burndown-ideal') as SVGPolylineElement;
    const real = container.querySelector('.burndown-actual') as SVGPolylineElement;
    expect(ideal.getAttribute('points')?.split(' ')).toHaveLength(3);
    expect(real.getAttribute('points')?.split(' ')).toHaveLength(2);
    expect(screen.getByTestId('burndown-today')).toBeInTheDocument();
  });

  it('draws only the ideal line before the sprint starts', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, healthStatus: 'NOT_STARTED', actualBurndown: [null, null, null] } } };
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(container.querySelector('.burndown-ideal')).not.toBeNull();
    expect(container.querySelector('.burndown-actual')).toBeNull();
    expect(screen.queryByTestId('burndown-today')).not.toBeInTheDocument();
    expect(screen.getByText('La línea real aparecerá cuando comience el sprint.')).toBeInTheDocument();
  });

  it('says there are no closed sprints instead of showing a velocity of 0', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, velocity: 0, velocitySampleSize: 0 } } };
    const first = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByTestId('velocity-value')).toHaveTextContent('Sin sprints cerrados');
    expect(screen.getByText('Se calculará al cerrar el primer sprint.')).toBeInTheDocument();
    first.unmount();

    burndown = { data: { getBurndownAnalytics: { ...METRICS, velocity: 18, velocitySampleSize: 2 } } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByTestId('velocity-value')).toHaveTextContent('18 SP / sprint');
    expect(screen.getByText('Promedio de 2 sprints cerrados')).toBeInTheDocument();
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

describe('AnalyticsPage when analytics are UNAVAILABLE', () => {
  const UNAVAILABLE = {
    sprintId: 'sprint-1', velocity: 0, idealBurndown: [], actualBurndown: [], blockedCount: 0, healthStatus: 'UNAVAILABLE',
  };

  it('explains the outage instead of showing placeholder numbers, and lets the user retry', () => {
    burndown = { data: { getBurndownAnalytics: UNAVAILABLE } };
    const { container } = render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    const notice = screen.getByTestId('analytics-unavailable');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent('Métricas no disponibles por ahora');
    expect(notice).toHaveTextContent('Sprint 1');
    expect(screen.queryByText('UNAVAILABLE')).not.toBeInTheDocument();
    expect(screen.queryByText('0 SP / sprint')).not.toBeInTheDocument();
    expect(container.querySelector('.analytics-kpis')).toBeNull();
    expect(screen.queryByLabelText('Gráfico de burndown del sprint')).not.toBeInTheDocument();

    fireEvent.click(within(notice).getByText('Reintentar'));
    expect(burndownRefetch).toHaveBeenCalledTimes(1);
  });

  it('still allows the AI diagnosis and shows it below the notice', async () => {
    burndown = { data: { getBurndownAnalytics: UNAVAILABLE } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    fireEvent.click(screen.getByText('Analizar sprint con IA'));

    expect(await screen.findByText('Hay bloqueos')).toBeInTheDocument();
    expect(diagnose).toHaveBeenCalledWith({ variables: { input: { projectId: 'project-1', sprintId: 'sprint-1', blockedIssuesCount: 0 } } });
    expect(screen.getByTestId('analytics-unavailable')).toBeInTheDocument();
  });

  it('shows the diagnosis error in the unavailable state too', async () => {
    burndown = { data: { getBurndownAnalytics: UNAVAILABLE } };
    diagnose.mockRejectedValueOnce(new Error('El agente de IA no está disponible'));
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);

    fireEvent.click(screen.getByText('Analizar sprint con IA'));

    expect(await screen.findByText('El agente de IA no está disponible')).toBeInTheDocument();
  });

  it('allows selecting previous completed sprints and diagnoses the chosen sprint', async () => {
    const SPRINTS_LIST = [
      { id: 'sprint-1', name: 'Sprint 1', goal: 'MVP', status: 'ACTIVE' },
      { id: 'sprint-0', name: 'Sprint 0', goal: 'Arquitectura base', status: 'COMPLETED' },
    ];
    render(<AnalyticsPage projectId="project-1" sprint={SPRINTS_LIST[0]} sprints={SPRINTS_LIST} issues={ISSUES} />);

    const select = screen.getByTestId('select-sprint-analytics') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('sprint-1');

    fireEvent.change(select, { target: { value: 'sprint-0' } });
    expect(select.value).toBe('sprint-0');
    expect(screen.getByText('Sprint 0 · Burndown')).toBeInTheDocument();
    expect(screen.getByText('Arquitectura base')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Analizar sprint con IA'));
    await waitFor(() => {
      expect(diagnose).toHaveBeenCalledWith({
        variables: { input: { projectId: 'project-1', sprintId: 'sprint-0', blockedIssuesCount: 2 } },
      });
    });
  });

  it('renders project velocity trend table and historical stats', () => {
    render(<AnalyticsPage projectId="project-1" projectKey="PROJ" sprint={SPRINT} issues={ISSUES} />);

    expect(screen.getByTestId('velocity-trend-section')).toBeInTheDocument();
    expect(screen.getByText('Tendencia histórica del proyecto')).toBeInTheDocument();
    const table = screen.getByTestId('velocity-history-table');
    expect(table).toBeInTheDocument();
    expect(within(table).getByText('Sprint 1')).toBeInTheDocument();
    expect(within(table).getByText('Sprint 2')).toBeInTheDocument();
    expect(screen.getByText('28.5 SP')).toBeInTheDocument();
  });

  it('triggers AI project retrospective and renders result card', async () => {
    render(<AnalyticsPage projectId="project-1" projectKey="PROJ" sprint={SPRINT} issues={ISSUES} />);

    const retroBtn = screen.getByTestId('btn-project-retrospective');
    expect(retroBtn).toBeInTheDocument();

    fireEvent.click(retroBtn);

    await waitFor(() => {
      expect(retrospective).toHaveBeenCalledWith({
        variables: { input: { projectId: 'project-1', projectKey: 'PROJ' } },
      });
    });

    expect(await screen.findByTestId('ai-retrospective-card')).toBeInTheDocument();
    expect(screen.getByText('Retrospectiva del proyecto con IA')).toBeInTheDocument();
    expect(screen.getByText('Alta cadencia y buena predictibilidad.')).toBeInTheDocument();
    expect(screen.getByText('Velocidad consistente de 28.5 SP')).toBeInTheDocument();
  });
});

describe('Sprint health badge', () => {
  it.each([
    ['HEALTHY', 'Saludable', 'is-healthy'],
    ['AT_RISK', 'En riesgo', 'is-at-risk'],
    ['CRITICAL', 'Crítico', 'is-critical'],
    ['NOT_STARTED', 'Sin iniciar', 'is-not-started'],
    ['NO_SCOPE', 'Sin alcance', 'is-no-scope'],
  ])('shows %s as "%s"', (status, label, className) => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, healthStatus: status } } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByTestId('sprint-health')).toHaveTextContent(label);
    expect(screen.getByTestId('sprint-health')).toHaveClass('health-badge', className);
  });

  it('falls back to the raw value for an unknown status', () => {
    burndown = { data: { getBurndownAnalytics: { ...METRICS, healthStatus: 'ON_TRACK' } } };
    render(<AnalyticsPage projectId="project-1" sprint={SPRINT} issues={ISSUES} />);
    expect(screen.getByTestId('sprint-health')).toHaveTextContent('ON_TRACK');
    expect(screen.getByTestId('sprint-health')).toHaveClass('health-badge');
  });
});
