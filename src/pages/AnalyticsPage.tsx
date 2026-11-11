import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AI_DIAGNOSE_METRICS, GET_BURNDOWN_ANALYTICS, GET_PROJECT_WORK_LOGS, LOG_WORK } from '../graphql/client';

interface Sprint {
  id: string;
  name: string;
  goal: string;
}

interface BurndownData {
  sprintId: string;
  velocity: number;
  idealBurndown: number[];
  actualBurndown: number[];
  blockedCount: number;
  healthStatus: string;
}

interface Diagnosis {
  summary: string;
  rootCauses: string[];
  recommendations: string[];
  healthStatus: string;
}

interface AnalyticsPageProps {
  projectId: string;
  sprint: Sprint | null;
  issues: { id: string; key: string; title: string }[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projectId, sprint, issues }) => {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [issueId, setIssueId] = useState('');
  const [hours, setHours] = useState('1');
  const [workNote, setWorkNote] = useState('');
  const [workError, setWorkError] = useState('');
  const workLogs = useQuery(GET_PROJECT_WORK_LOGS, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: 'cache-and-network',
  });
  const [recordWork, recordWorkState] = useMutation(LOG_WORK);
  const { data, loading, error } = useQuery(GET_BURNDOWN_ANALYTICS, {
    variables: { sprintId: sprint?.id || '' },
    skip: !sprint,
    fetchPolicy: 'cache-and-network',
  });
  const [diagnose, diagnoseState] = useMutation(AI_DIAGNOSE_METRICS);
  const metrics: BurndownData | undefined = data?.getBurndownAnalytics;
  const ideal = metrics?.idealBurndown || [];
  const actual = metrics?.actualBurndown || [];
  const values = [...ideal, ...actual];
  const maxPoints = Math.max(...values, 1);
  const width = 560;
  const height = 240;
  const padding = 34;
  const getPoints = (series: number[]) => series.map((value, index) => {
    const x = padding + (index / Math.max(series.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (value / maxPoints) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const runDiagnosis = async () => {
    setDiagnosisError('');
    setDiagnosis(null);
    try {
      const result = await diagnose({
        variables: {
          input: { projectId, sprintId: sprint?.id, blockedIssuesCount: metrics?.blockedCount || 0 },
        },
      });
      setDiagnosis(result.data?.aiDiagnoseMetrics || null);
    } catch (requestError) {
      setDiagnosisError(requestError instanceof Error ? requestError.message : 'No se pudo analizar el sprint.');
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
        {sprint && (
          <button className="btn btn-ai" onClick={() => void runDiagnosis()} disabled={diagnoseState.loading || loading}>
            {diagnoseState.loading ? 'Analizando...' : 'Analizar sprint con IA'}
          </button>
        )}
      </header>
      {!sprint ? (
        <section className="empty-state-box">Crea e inicia un sprint en Cronograma para ver métricas y análisis.</section>
      ) : loading && !metrics ? (
        <section className="empty-state-box">Cargando métricas del sprint {sprint.name}...</section>
      ) : error ? (
        <section className="app-error" role="alert">No se pudieron cargar las métricas: {error.message}</section>
      ) : !metrics ? (
        <section className="empty-state-box">Todavía no hay datos analíticos para este sprint.</section>
      ) : (
        <>
          <div className="analytics-grid">
            <section className="chart-card">
              <h2 className="analytics-section-title">{sprint.name} · Burndown</h2>
              <p className="page-subtitle">{sprint.goal || 'Sin objetivo definido'}</p>
              {ideal.length > 1 && actual.length > 1 ? (
                <svg viewBox={`0 0 ${width} ${height}`} className="burndown-chart" role="img" aria-label="Gráfico de burndown del sprint">
                  <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3f3f46" />
                  <polyline fill="none" stroke="#71717a" strokeDasharray="4 4" strokeWidth="2" points={getPoints(ideal)} />
                  <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={getPoints(actual)} />
                </svg>
              ) : <div className="empty-state-box">El burndown estará disponible cuando se registren cambios de trabajo durante el sprint.</div>}
            </section>
            <section className="analytics-kpis">
              <div className="stat-box"><span>Velocidad promedio</span><strong>{metrics.velocity} SP / sprint</strong></div>
              <div className="stat-box"><span>Historias bloqueadas</span><strong>{metrics.blockedCount}</strong></div>
              <div className="stat-box"><span>Salud del sprint</span><strong>{metrics.healthStatus}</strong></div>
            </section>
          </div>
          {diagnosisError && <div className="app-error" role="alert">{diagnosisError}</div>}
          {diagnosis && (
            <section className="ai-diagnosis-card" aria-live="polite">
              <h2>Recomendaciones para {sprint.name}</h2>
              <p>{diagnosis.summary}</p>
              {!!diagnosis.rootCauses.length && <h3>Factores detectados</h3>}
              <ul>{diagnosis.rootCauses.map((item) => <li key={item}>{item}</li>)}</ul>
              {!!diagnosis.recommendations.length && <h3>Acciones sugeridas</h3>}
              <ul>{diagnosis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}
        </>
      )}
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
          <input className="form-input" type="number" min="0.01" max="24" step="0.25" required value={hours} onChange={(event) => setHours(event.target.value)} aria-label="Horas trabajadas" />
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
