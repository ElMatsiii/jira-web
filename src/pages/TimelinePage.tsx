import React, { useState } from 'react';
import {
  DEFAULT_SPRINT_WEEKS,
  SPRINT_DURATION_WEEKS,
  isEndOnOrAfterStart,
  sprintEndDate,
  todayLocal,
} from '../utils/date-utils';

interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

interface TimelinePageProps {
  sprints: Sprint[];
  loading: boolean;
  onCreateSprint: (input: { name: string; goal: string; startDate: string; endDate: string }) => Promise<unknown>;
  onStartSprint: (id: string) => Promise<unknown>;
  onCompleteSprint: (id: string) => Promise<unknown>;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  sprints,
  loading,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
}) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [weeks, setWeeks] = useState<number>(DEFAULT_SPRINT_WEEKS);
  const [startDate, setStartDate] = useState(() => todayLocal());
  const [endDate, setEndDate] = useState(() => sprintEndDate(todayLocal(), DEFAULT_SPRINT_WEEKS));
  const [submitting, setSubmitting] = useState(false);

  const datesValid = isEndOnOrAfterStart(startDate, endDate);
  const endIsManual = datesValid && endDate !== sprintEndDate(startDate, weeks);
  const dateError = startDate && endDate && !datesValid
    ? 'La fecha de fin no puede ser anterior a la fecha de inicio.'
    : '';

  // Picking a start date or a duration recalculates the end; the end stays editable afterwards.
  const changeStart = (value: string) => {
    setStartDate(value);
    const computed = sprintEndDate(value, weeks);
    if (computed) setEndDate(computed);
  };

  const changeWeeks = (value: number) => {
    setWeeks(value);
    const computed = sprintEndDate(startDate, value);
    if (computed) setEndDate(computed);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!datesValid) return;
    setSubmitting(true);
    try {
      await onCreateSprint({ name, goal, startDate, endDate });
      setName('');
      setGoal('');
    } catch {
      // The parent shows the error banner; keep the form values so the user can retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="main-content" data-testid="page-timeline">
      <header className="page-header">
        <div>
          <h1 className="page-title">Planificación y cronograma</h1>
          <p className="page-subtitle">Planifica las fechas, objetivos y capacidad de cada sprint del proyecto.</p>
        </div>
      </header>
      <section className="timeline-create-card">
        <h2>Planificar sprint</h2>
        <form className="timeline-form" onSubmit={submit}>
          <label className="form-group">
            <span className="form-label">Nombre</span>
            <input className="form-input" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Sprint 1" />
          </label>
          <label className="form-group">
            <span className="form-label">Objetivo del sprint</span>
            <input className="form-input" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Resultado que el equipo quiere lograr" />
          </label>
          <label className="form-group">
            <span className="form-label">Inicio</span>
            <input className="form-input" type="date" required value={startDate} onChange={(event) => changeStart(event.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Duración</span>
            <select className="form-select" value={weeks} onChange={(event) => changeWeeks(Number(event.target.value))}>
              {SPRINT_DURATION_WEEKS.map((option) => (
                <option key={option} value={option}>{option === 1 ? '1 semana' : `${option} semanas`}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Fin</span>
            <input
              className="form-input"
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-invalid={Boolean(dateError)}
              aria-describedby="sprint-dates-hint"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting || !name.trim() || !datesValid}>
            {submitting ? 'Guardando...' : 'Crear sprint'}
          </button>
        </form>
        <p
          id="sprint-dates-hint"
          className={dateError ? 'form-error timeline-dates-hint' : 'timeline-dates-hint'}
          role={dateError ? 'alert' : undefined}
        >
          {dateError
            || (endIsManual
              ? 'Fecha de fin ajustada manualmente; cambia el inicio o la duración para recalcularla.'
              : 'La fecha de fin se calcula a partir del inicio y la duración; puedes ajustarla a mano.')}
        </p>
      </section>
      <section className="timeline-list">
        <h2>Sprints del proyecto</h2>
        {loading ? <p>Cargando cronograma...</p> : sprints.length === 0 ? (
          <div className="empty-state-box">Todavía no hay sprints. Crea el primero para planificar el trabajo.</div>
        ) : sprints.map((sprint) => (
          <article className="timeline-sprint" key={sprint.id}>
            <div className="timeline-track" aria-hidden="true"><span className={`timeline-dot status-${sprint.status.toLowerCase()}`} /></div>
            <div className="timeline-sprint-content">
              <div className="timeline-sprint-heading">
                <div>
                  <h3>{sprint.name}</h3>
                  <span className={`sprint-status status-${sprint.status.toLowerCase()}`}>{sprint.status}</span>
                </div>
                <span className="points-pill">{sprint.completedStoryPoints}/{sprint.totalStoryPoints} SP</span>
              </div>
              <p>{sprint.goal || 'Sin objetivo definido'}</p>
              <div className="timeline-dates">
                <time dateTime={sprint.startDate}>{new Date(sprint.startDate).toLocaleDateString()}</time>
                <span>→</span>
                <time dateTime={sprint.endDate}>{new Date(sprint.endDate).toLocaleDateString()}</time>
              </div>
              {sprint.status === 'PLANNED' && <button className="btn btn-primary btn-sm" onClick={() => void onStartSprint(sprint.id)}>Iniciar sprint</button>}
              {sprint.status === 'ACTIVE' && <button className="btn btn-secondary btn-sm" onClick={() => void onCompleteSprint(sprint.id)}>Completar sprint</button>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};
