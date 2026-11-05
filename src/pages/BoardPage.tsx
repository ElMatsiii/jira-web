import React from 'react';
import { Issue } from './BacklogPage';

export interface BoardPageProps {
  issues: Issue[];
  loading?: boolean;
  onUpdateStatus: (issueId: string, newStatus: string) => Promise<void> | void;
}

const COLUMNS: { id: Issue['status']; title: string }[] = [
  { id: 'TODO', title: 'Por Hacer (To Do)' },
  { id: 'IN_PROGRESS', title: 'En Progreso (In Progress)' },
  { id: 'IN_REVIEW', title: 'En Revisión (In Review)' },
  { id: 'DONE', title: 'Listo (Done)' },
];

export const BoardPage: React.FC<BoardPageProps> = ({
  issues,
  loading,
  onUpdateStatus,
}) => {
  const getNextStatus = (current: Issue['status']): Issue['status'] | null => {
    switch (current) {
      case 'TODO': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'IN_REVIEW';
      case 'IN_REVIEW': return 'DONE';
      default: return null;
    }
  };

  return (
    <div className="main-content" data-testid="page-board">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tablero Scrum Activo</h1>
          <p className="page-subtitle">
            Flujo ágil con sincronización bidireccional entre MS1 (Go), MS2 (NestJS) y eventos Kafka.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando tarjetas del tablero...
        </div>
      ) : (
        <div className="kanban-grid">
          {COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.id);
            return (
              <div key={col.id} className="kanban-col" data-testid={`board-column-${col.id}`}>
                <div className="kanban-col-header">
                  <span>{col.title}</span>
                  <span className="kanban-count">{colIssues.length}</span>
                </div>

                {colIssues.map((issue) => {
                  const next = getNextStatus(issue.status);
                  return (
                    <div key={issue.id || issue.key} className="kanban-card" data-testid={`card-${issue.key}`}>
                      <div className="card-top">
                        <span className="issue-key">{issue.key}</span>
                        <span className={`badge badge-${issue.type.toLowerCase()}`}>
                          {issue.type}
                        </span>
                      </div>
                      <div className="card-title">{issue.title}</div>
                      <div className="card-bottom">
                        <span className={`priority-${issue.priority.toLowerCase()}`}>
                          {issue.priority}
                        </span>
                        <span className="points-pill">{issue.storyPoints} SP</span>
                        {next ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onUpdateStatus(issue.id, next)}
                            data-testid={`btn-advance-${issue.key}`}
                            title={`Mover a ${next}`}
                          >
                            Avanzar →
                          </button>
                        ) : (
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Listo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
