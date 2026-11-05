import React from 'react';
import { Issue } from './BacklogPage';

export interface BoardPageProps {
  issues: Issue[];
  loading?: boolean;
  onUpdateStatus: (issueId: string, newStatus: string) => Promise<void> | void;
}

const COLUMNS: { id: Issue['status']; title: string; color: string }[] = [
  { id: 'TODO', title: 'Por Hacer (To Do)', color: '#71717a' },
  { id: 'IN_PROGRESS', title: 'En Progreso (In Progress)', color: '#3b82f6' },
  { id: 'IN_REVIEW', title: 'En Revisión (In Review)', color: '#f59e0b' },
  { id: 'DONE', title: 'Listo (Done)', color: '#10b981' },
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
          <h1 className="page-title">
            <span>Tablero Scrum Activo</span>
            <span className="nav-badge-enterprise">Sprint #1</span>
          </h1>
          <p className="page-subtitle">
            Flujo ágil con sincronización bidireccional entre MS1 (Go), MS2 (NestJS) y eventos Kafka.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>
          <div style={{ paddingBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cargando tarjetas del tablero...
          </div>
          <div className="kanban-grid">
            {COLUMNS.map((col) => (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{col.title}</span>
                  <div className="skeleton-shimmer" style={{ width: '20px', height: '16px' }} />
                </div>
                {[1, 2].map((n) => (
                  <div key={n} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div className="skeleton-shimmer" style={{ width: '60px', height: '14px' }} />
                      <div className="skeleton-shimmer" style={{ width: '40px', height: '14px' }} />
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
                    <div className="skeleton-shimmer" style={{ width: '70%', height: '12px' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="kanban-grid">
          {COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.id);
            return (
              <div
                key={col.id}
                className="kanban-col"
                data-testid={`board-column-${col.id}`}
                style={{ borderTop: `3px solid ${col.color}` }}
              >
                <div className="kanban-col-header">
                  <span>{col.title}</span>
                  <span className="kanban-count">{colIssues.length}</span>
                </div>

                {colIssues.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 12px',
                      textAlign: 'center',
                      color: 'var(--text-subtle)',
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      border: '1px dashed var(--border-muted)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Sin incidencias
                  </div>
                ) : (
                  colIssues.map((issue) => {
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
                            ● {issue.priority}
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
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                              ✓ Listo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
