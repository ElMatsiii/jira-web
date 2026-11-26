import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AI_DIAGNOSE_METRICS, AI_PROJECT_RETROSPECTIVE, GET_BURNDOWN_ANALYTICS, GET_PROJECT_VELOCITY_TREND, GET_PROJECT_WORK_LOGS, LOG_WORK } from '../graphql/client';
import { buildBurndownGeometry } from '../utils/burndown-chart';

export interface SprintOption {
  id: string;
  name: string;
  goal?: string;
  status?: string;
}

/** healthStatus value the BFF returns when the analytics service (MS3) did not answer. */
export const HEALTH_UNAVAILABLE = 'UNAVAILABLE';

/** Spanish label and badge style for each sprint health value sent by the BFF. */
export const HEALTH_DISPLAY: Record<string, { label: string; className: string }> = {
  HEALTHY: { label: 'Saludable', className: 'health-badge is-healthy' },
  AT_RISK: { label: 'En riesgo', className: 'health-badge is-at-risk' },
  CRITICAL: { label: 'Crítico', className: 'health-badge is-critical' },
  NOT_STARTED: { label: 'Sin iniciar', className: 'health-badge is-not-started' },
  NO_SCOPE: { label: 'Sin alcance', className: 'health-badge is-no-scope' },
};

/** Velocity KPI: MS3 averages the last closed sprints; with none, 0 is not a real average. */
export const formatVelocity = (velocity: number, sampleSize: number | null | undefined): { value: string; hint: string } => {
  if (sampleSize === 0) return { value: 'Sin sprints cerrados', hint: 'Se calculará al cerrar el primer sprint.' };
  const hint = sampleSize ? `Promedio de ${sampleSize} sprint${sampleSize === 1 ? '' : 's'} cerrado${sampleSize === 1 ? '' : 's'}` : '';
  return { value: `${velocity} SP / sprint`, hint };
};

const renderDiagnosis = (
  diagnosis: { summary: string; rootCauses: string[]; recommendations: string[] },
  sprintName: string,
) => (
  <section className="ai-diagnosis-card" aria-live="polite">
    <h2>Recomendaciones para {sprintName}</h2>
    <p>{diagnosis.summary}</p>
    {!!diagnosis.rootCauses.length && <h3>Factores detectados</h3>}
    <ul>{diagnosis.rootCauses.map((item) => <li key={item}>{item}</li>)}</ul>
    {!!diagnosis.recommendations.length && <h3>Acciones sugeridas</h3>}
    <ul>{diagnosis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
  </section>
);

interface BurndownData {
  sprintId: string;
  velocity: number;
  /** Closed sprints averaged in velocity; 0 = none yet, null = unknown. */
  velocitySampleSize?: number | null;
  idealBurndown: number[];
  /** Aligned with idealBurndown; null for days that have not happened yet. */
  actualBurndown: (number | null)[];
  blockedCount: number;
  healthStatus: string;
}

interface Diagnosis {
  summary: string;
  rootCauses: string[];
  recommendations: string[];
  healthStatus: string;
}

export interface AnalyticsPageProps {
  projectId: string;
  projectKey?: string;
  sprint: SprintOption | null;
  sprints?: SprintOption[];
  issues: { id: string; key: string; title: string }[];
}

export interface VelocityHistoryEntry {
  sprintId: string;
  sprintName: string;
  committedStoryPoints: number;
  completedStoryPoints: number;
  completedDate: string;
}

export interface ProjectVelocityTrendData {
  projectId: string;
  velocity: number;
  velocitySampleSize: number | null;
  totalPoints: number;
  completedPoints: number;
  velocityHistory: VelocityHistoryEntry[];
}

export interface AiProjectRetrospectiveData {
  projectId: string;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  actionableRecommendations: string[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projectId, projectKey, sprint, sprints, issues }) => {
  const availableSprints: SprintOption[] = sprints && sprints.length > 0
    ? sprints
    : sprint
      ? [sprint]
      : [];

  const defaultSprintId = sprint?.id || availableSprints.find((s) => s.status === 'ACTIVE')?.id || availableSprints[0]?.id || '';
  const [selectedSprintId, setSelectedSprintId] = useState<string>(defaultSprintId);

  const activeSprintSelection = availableSprints.find((s) => s.id === (selectedSprintId || defaultSprintId)) || sprint || null;

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [issueId, setIssueId] = useState('');
  const [hours, setHours] = useState('1');
  const [workNote, setWorkNote] = useState('');
  const [workError, setWorkError] = useState('');

  const [retrospective, setRetrospective] = useState<AiProjectRetrospectiveData | null>(null);
  const [retrospectiveError, setRetrospectiveError] = useState('');

  const { data: trendData, loading: trendLoading } = useQuery(GET_PROJECT_VELOCITY_TREND, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: 'cache-and-network',
  });
  const [generateRetrospective, retrospectiveState] = useMutation(AI_PROJECT_RETROSPECTIVE);
  const trend: ProjectVelocityTrendData | undefined = trendData?.getProjectVelocityTrend;

  const workLogs = useQuery(GET_PROJECT_WORK_LOGS, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: 'cache-and-network',
  });
  const [recordWork, recordWorkState] = useMutation(LOG_WORK);
  const { data, loading, error, refetch } = useQuery(GET_BURNDOWN_ANALYTICS, {
    variables: { sprintId: activeSprintSelection?.id || '' },
    skip: !activeSprintSelection,
    fetchPolicy: 'cache-and-network',
  });
  const [diagnose, diagnoseState] = useMutation(AI_DIAGNOSE_METRICS);
  const metrics: BurndownData | undefined = data?.getBurndownAnalytics;
  // The BFF answers UNAVAILABLE when MS3 (analytics) did not respond; its numbers are placeholders.
  const metricsUnavailable = metrics?.healthStatus === HEALTH_UNAVAILABLE;
  const health = HEALTH_DISPLAY[metrics?.healthStatus || ''] || { label: metrics?.healthStatus || '', className: 'health-badge' };
  const ideal = metrics?.idealBurndown || [];
  const actual = metrics?.actualBurndown || [];
  const width = 560;
  const height = 240;
  const padding = 34;
  const chart = buildBurndownGeometry(ideal, actual, { width, height, padding });
  const velocity = formatVelocity(metrics?.velocity || 0, metrics?.velocitySampleSize);

  const runDiagnosis = async () => {
    if (!activeSprintSelection) return;
    setDiagnosisError('');
    setDiagnosis(null);
    try {
      const result = await diagnose({
        variables: {
          input: { projectId, sprintId: activeSprintSelection.id, blockedIssuesCount: metrics?.blockedCount || 0 },
        },
      });
      setDiagnosis(result.data?.aiDiagnoseMetrics || null);
    } catch (requestError) {
      setDiagnosisError(requestError instanceof Error ? requestError.message : 'No se pudo analizar el sprint.');
    }
  };

  const runProjectRetrospective = async () => {
    if (!projectId) return;
    setRetrospectiveError('');
    setRetrospective(null);
    try {
      const result = await generateRetrospective({
        variables: {
          input: { projectId, projectKey },
        },
      });
      setRetrospective(result.data?.aiProjectRetrospective || null);
    } catch (requestError) {
      setRetrospectiveError(
        requestError instanceof Error ? requestError.message : 'No se pudo generar la retrospectiva del proyecto.'
      );
    }
  };

  const submitWorkLog = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorkError('');
    try {
      await recordWork({
        variables: { input: { projectId, issueId, hours: Number(hours), note: workNote } },
      });
      await workLogs.refetch();
      setWorkNote('');
    } catch (requestError) {
      setWorkError(requestError instanceof Error ? requestError.message : 'No se pudo registrar el tiempo.');
    }
  };

  return (
    <main className="main-content" data-testid="page-analytics">
      <header className="page-header">
        <div>
          <h1 className="page-title">Rendimiento del proyecto</h1>
          <p className="page-subtitle">Métricas reales del sprint seleccionado; la IA puede señalar riesgos y proponer acciones.</p>
        </div>
        {activeSprintSelection && (
          <button className="btn btn-ai" onClick={() => void runDiagnosis()} disabled={diagnoseState.loading || loading}>
            {diagnoseState.loading ? 'Analizando...' : 'Analizar sprint con IA'}
          </button>
        )}
      </header>

      {availableSprints.length > 0 && (
        <div className="analytics-sprint-picker">
          <label htmlFor="sprint-select" className="analytics-sprint-picker-label">
            Sprint:
          </label>
          <select
            id="sprint-select"
            className="form-select analytics-sprint-select"
            data-testid="select-sprint-analytics"
            value={activeSprintSelection?.id || ''}
            onChange={(event) => {
              setSelectedSprintId(event.target.value);
              setDiagnosis(null);
              setDiagnosisError('');
            }}
          >
            {availableSprints.map((s) => {
              const tag = s.status === 'ACTIVE'
                ? ' (Activo)'
                : s.status === 'COMPLETED'
                ? ' (Completado)'
                : s.status === 'PLANNED'
                ? ' (Planificado)'
                : '';
              return (
                <option key={s.id} value={s.id}>
                  {s.name}{tag}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {!activeSprintSelection ? (
        <section className="empty-state-box">Crea e inicia un sprint en Cronograma para ver métricas y análisis.</section>
      ) : loading && !metrics ? (
        <section className="empty-state-box">Cargando métricas del sprint {activeSprintSelection.name}...</section>
      ) : error ? (
        <section className="app-error" role="alert">No se pudieron cargar las métricas: {error.message}</section>
      ) : !metrics ? (
        <section className="empty-state-box">Todavía no hay datos analíticos para este sprint.</section>
      ) : metricsUnavailable ? (
        <>
          <section className="analytics-unavailable" role="status" data-testid="analytics-unavailable">
            <h2 className="analytics-section-title">Métricas no disponibles por ahora</h2>
            <p>
              El servicio de analítica no respondió a tiempo, así que no hay burndown, velocidad ni salud
              para {activeSprintSelection.name}. Los datos del sprint no se perdieron; vuelve a intentarlo en unos momentos.
            </p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refetch()}>
              Reintentar
            </button>
          </section>
          {diagnosisError && <div className="app-error" role="alert">{diagnosisError}</div>}
          {diagnosis && renderDiagnosis(diagnosis, activeSprintSelection.name)}
        </>
      ) : (
        <>
          <div className="analytics-grid">
            <section className="chart-card">
              <h2 className="analytics-section-title">{activeSprintSelection.name} · Burndown</h2>
              <p className="page-subtitle">{activeSprintSelection.goal || 'Sin objetivo definido'}</p>
              {ideal.length > 1 ? (
                <>
                  <svg viewBox={`0 0 ${width} ${height}`} className="burndown-chart" role="img" aria-label="Gráfico de burndown del sprint">
                    <line className="burndown-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                    <polyline className="burndown-ideal" fill="none" strokeDasharray="4 4" strokeWidth="2" points={chart.idealPoints} />
                    {chart.actualPoints && (
                      <polyline className="burndown-actual" fill="none" strokeWidth="2.5" points={chart.actualPoints} />
                    )}
                    {chart.lastActual && (
                      <circle className="burndown-today" cx={chart.lastActual.x} cy={chart.lastActual.y} r="4" data-testid="burndown-today" />
                    )}
                  </svg>
                  <div className="burndown-legend">
                    <span className="burndown-legend-item is-ideal">Ideal</span>
                    <span className="burndown-legend-item">Real (hasta hoy)</span>
                  </div>
                  {!chart.lastActual && (
                    <p className="page-subtitle">La línea real aparecerá cuando comience el sprint.</p>
                  )}
                </>
              ) : <div className="empty-state-box">El burndown estará disponible cuando el sprint tenga fechas y alcance definidos.</div>}
            </section>
            <section className="analytics-kpis">
              <div className="stat-box">
                <span>Velocidad promedio</span>
                <strong data-testid="velocity-value">{velocity.value}</strong>
                {velocity.hint && <small className="stat-hint">{velocity.hint}</small>}
              </div>
              <div className="stat-box"><span>Historias bloqueadas</span><strong>{metrics.blockedCount}</strong></div>
              <div className="stat-box">
                <span>Salud del sprint</span>
                <strong><span className={health.className} data-testid="sprint-health">{health.label}</span></strong>
              </div>
            </section>
          </div>
          {diagnosisError && <div className="app-error" role="alert">{diagnosisError}</div>}
          {diagnosis && renderDiagnosis(diagnosis, activeSprintSelection.name)}
        </>
      )}

      <section className="velocity-trend-section" data-testid="velocity-trend-section">
        <div className="velocity-trend-header">
          <div>
            <h2 className="analytics-section-title">Tendencia histórica del proyecto</h2>
            <p className="page-subtitle">
              Historial de velocidad de los sprints cerrados del proyecto para calibrar capacidad y generar retrospectivas con IA.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ai"
            data-testid="btn-project-retrospective"
            onClick={() => void runProjectRetrospective()}
            disabled={retrospectiveState.loading}
          >
            {retrospectiveState.loading ? 'Generando retrospectiva...' : 'Generar retrospectiva con IA'}
          </button>
        </div>

        {trendLoading && !trend ? (
          <div className="empty-state-box">Cargando tendencia del proyecto...</div>
        ) : trend?.velocityHistory && trend.velocityHistory.length > 0 ? (
          <>
            <div className="velocity-trend-summary">
              <div className="stat-box">
                <span>Velocidad media (reciente)</span>
                <strong>{trend.velocity} SP</strong>
                {trend.velocitySampleSize && (
                  <small className="stat-hint">Calculada sobre {trend.velocitySampleSize} sprint(s)</small>
                )}
              </div>
              <div className="stat-box">
                <span>Total completado histórico</span>
                <strong>{trend.completedPoints} SP</strong>
                <small className="stat-hint">De {trend.totalPoints} SP comprometidos</small>
              </div>
              <div className="stat-box">
                <span>Efectividad global</span>
                <strong>
                  {trend.totalPoints > 0
                    ? `${Math.round((trend.completedPoints / trend.totalPoints) * 100)}%`
                    : '100%'}
                </strong>
              </div>
            </div>

            <div className="velocity-history-table-wrapper">
              <table className="velocity-history-table" data-testid="velocity-history-table">
                <thead>
                  <tr>
                    <th>Sprint</th>
                    <th>Fecha cierre</th>
                    <th>Comprometidos</th>
                    <th>Completados</th>
                    <th>Efectividad</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.velocityHistory.map((item: VelocityHistoryEntry) => {
                    const eff = item.committedStoryPoints > 0
                      ? Math.round((item.completedStoryPoints / item.committedStoryPoints) * 100)
                      : 100;
                    return (
                      <tr key={item.sprintId}>
                        <td><strong>{item.sprintName}</strong></td>
                        <td>{item.completedDate ? new Date(item.completedDate).toLocaleDateString() : '-'}</td>
                        <td>{item.committedStoryPoints} SP</td>
                        <td>{item.completedStoryPoints} SP</td>
                        <td>
                          <span className={`compliance-tag ${eff >= 80 ? 'is-good' : 'is-warning'}`}>
                            {eff}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state-box">
            Aún no hay sprints completados en este proyecto. Al cerrar sprints se registrará la velocidad y la tendencia histórica.
          </div>
        )}

        {retrospectiveError && <div className="app-error" role="alert">{retrospectiveError}</div>}

        {retrospective && (
          <section className="ai-retrospective-card" data-testid="ai-retrospective-card" aria-live="polite">
            <h2>Retrospectiva del proyecto con IA</h2>
            <p>{retrospective.summary}</p>
            {retrospective.strengths.length > 0 && <h3>Fortalezas del equipo</h3>}
            <ul>
              {retrospective.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {retrospective.areasForImprovement.length > 0 && <h3>Áreas de mejora</h3>}
            <ul>
              {retrospective.areasForImprovement.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            {retrospective.actionableRecommendations.length > 0 && <h3>Acciones recomendadas</h3>}
            <ul>
              {retrospective.actionableRecommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <section className="work-log-section">
        <div className="work-log-heading">
          <div>
            <h2>Tiempo registrado</h2>
            <p>Registra horas reales por historia para que el equipo pueda revisar dónde se invierte el esfuerzo.</p>
          </div>
          <strong>{Number(workLogs.data?.projectWorkLogs?.totalHours || 0).toFixed(2)} h</strong>
        </div>
        <form className="work-log-form" onSubmit={(event) => void submitWorkLog(event)}>
          <select className="form-select" required value={issueId} onChange={(event) => setIssueId(event.target.value)} aria-label="Historia para registrar tiempo">
            <option value="">Selecciona una historia</option>
            {issues.map((issue) => <option key={issue.id} value={issue.id}>{issue.key} · {issue.title}</option>)}
          </select>
          <input className="form-input" type="number" min="0.25" max="24" step="0.25" required value={hours} onChange={(event) => setHours(event.target.value)} aria-label="Horas trabajadas" />
          <input className="form-input" maxLength={500} placeholder="¿En qué se trabajó? (opcional)" value={workNote} onChange={(event) => setWorkNote(event.target.value)} aria-label="Nota del registro de tiempo" />
          <button className="btn btn-primary" type="submit" disabled={!issueId || recordWorkState.loading}>{recordWorkState.loading ? 'Guardando...' : 'Registrar tiempo'}</button>
        </form>
        {workError && <p className="form-error" role="alert">{workError}</p>}
        {workLogs.error && <p className="form-error" role="alert">No se pudo cargar el tiempo registrado: {workLogs.error.message}</p>}
        {!!workLogs.data?.projectWorkLogs?.entries?.length && (
          <div className="work-log-list">
            {workLogs.data.projectWorkLogs.entries.map((entry: { id: string; issueKey: string; issueTitle: string; userName: string; hours: number; note: string; loggedAt: string }) => (
              <article key={entry.id}>
                <div><strong>{entry.issueKey}</strong> · {entry.issueTitle}<small>{entry.userName} · {new Date(entry.loggedAt).toLocaleString()}</small></div>
                <span>{entry.hours} h</span>
                {entry.note && <p>{entry.note}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
