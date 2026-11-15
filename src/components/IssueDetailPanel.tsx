import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ISSUE_WORK_LOGS } from '../graphql/client';
import { normalizePriority, normalizeStatus, normalizeType } from '../utils/issue-utils';

export interface IssueDetail {
  id: string;
  key: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  status: unknown;
  priority: unknown;
  type: unknown;
  storyPoints: number;
  reporterName?: string | null;
  createdAt?: string | null;
}

export interface IssueDetailPanelProps {
  projectId: string;
  issue: IssueDetail;
  /** The issue's epic, when it has one in the backlog. */
  epic?: { key: string; title: string } | null;
  onClose: () => void;
}

interface WorkLogEntry {
  id: string;
  userName: string;
  hours: number;
  note: string;
  loggedAt: string;
}

/** Formats an ISO date for the detail panel; empty when the date is missing or invalid. */
export const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

/** Read-only view of an issue: texts, author, creation date, epic and the hours logged on it. */
export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({ projectId, issue, epic, onClose }) => {
  const workLogs = useQuery(GET_ISSUE_WORK_LOGS, {
    variables: { projectId, issueId: issue.id },
    fetchPolicy: 'cache-and-network',
  });
  const summary: { totalHours: number; entries: WorkLogEntry[] } | undefined = workLogs.data?.issueWorkLogs;
  const type = normalizeType(issue.type);
  const priority = normalizePriority(issue.priority);
  const createdAt = formatDateTime(issue.createdAt);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      data-testid="issue-detail-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-card issue-detail-panel" role="dialog" aria-modal="true" aria-labelledby="issue-detail-heading">
        <header className="modal-header">
          <h2 id="issue-detail-heading" className="panel-heading">
            <span className="issue-key">{issue.key}</span> {issue.title}
          </h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cerrar detalle">✕</button>
        </header>

        <div className="ai-story-meta">
          <span className={`badge badge-${type.toLowerCase()}`}>{type}</span>
          <span className={`priority-${priority.toLowerCase()}`}>● {priority}</span>
          <span className="points-pill">{Number(issue.storyPoints) || 0} SP</span>
          <span className="status-badge">{normalizeStatus(issue.status)}</span>
        </div>

        <dl className="issue-detail-facts">
          <dt>Autor</dt>
          <dd>{issue.reporterName || 'Desconocido'}</dd>
          <dt>Creada</dt>
          <dd>{createdAt || 'Sin fecha'}</dd>
          <dt>Épica</dt>
          <dd data-testid="issue-detail-epic">{epic ? `${epic.key} · ${epic.title}` : 'Sin épica'}</dd>
        </dl>

        <h3 className="issue-detail-section">Descripción</h3>
        <p className="issue-detail-text">{issue.description || 'Sin descripción.'}</p>

        <h3 className="issue-detail-section">Criterios de aceptación</h3>
        {issue.acceptanceCriteria
          ? <pre className="issue-detail-criteria">{issue.acceptanceCriteria}</pre>
          : <p className="issue-detail-text">Sin criterios de aceptación.</p>}

        <h3 className="issue-detail-section">
          Horas registradas
          {summary && <strong data-testid="issue-detail-hours"> · {Number(summary.totalHours || 0).toFixed(2)} h</strong>}
        </h3>
        {workLogs.loading && !summary && <p className="issue-detail-text">Cargando horas...</p>}
        {workLogs.error && <p className="form-error" role="alert">No se pudieron cargar las horas: {workLogs.error.message}</p>}
        {summary && !summary.entries.length && <p className="issue-detail-text">Todavía no hay horas registradas.</p>}
        {!!summary?.entries.length && (
          <ul className="issue-detail-logs">
            {summary.entries.map((entry) => (
              <li key={entry.id}>
                <span>{entry.userName} · {formatDateTime(entry.loggedAt)}</span>
                <strong>{entry.hours} h</strong>
                {entry.note && <p>{entry.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
