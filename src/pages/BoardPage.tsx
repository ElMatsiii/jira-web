import React from 'react';
import { Issue } from './BacklogPage';
import {
  normalizePriority,
  normalizeStatus,
  normalizeType,
} from '../utils/issue-utils';

export interface BoardPageProps {
  issues: Issue[];
  loading?: boolean;
  onUpdateStatus: (issueId: string, newStatus: string) => Promise<void> | void;
  sprintName?: string;
}

const COLUMNS: { id: string; title: string; color: string }[] = [
  { id: 'TODO', title: 'Por Hacer (To Do)', color: '#5F6B7E' },
  { id: 'IN_PROGRESS', title: 'En Progreso (In Progress)', color: '#0D172A' },
  { id: 'IN_REVIEW', title: 'En Revisión (In Review)', color: '#8C6A48' },
  { id: 'DONE', title: 'Listo (Done)', color: '#2E7D32' },
];

export const BoardPage: React.FC<BoardPageProps> = ({
  issues,
  loading,
  onUpdateStatus,
  sprintName,
}) => {
  const getNextStatus = (current: string): string | null => {
    const norm = normalizeStatus(current);
    switch (norm) {
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
            <span className="nav-badge-enterprise">{sprintName || 'Sin sprint activo'}</span>
          </h1>
          <p className="page-subtitle">
            Trabajo del sprint activo; mueve cada historia a través del flujo del equipo.
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
            const colIssues = (issues || []).filter((i) => normalizeStatus(i?.status) === col.id);
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
                    const normType = normalizeType(issue.type);
                    const normPriority = normalizePriority(issue.priority);
                    const displayKey = issue.key || 'INC';
                    const displayTitle = issue.title || 'Sin título';
                    const next = getNextStatus(issue.status);
                    return (
                      <div key={issue.id || displayKey} className="kanban-card" data-testid={`card-${displayKey}`}>
                        <div className="card-top">
                          <span className="issue-key">{displayKey}</span>
                          <span className={`badge badge-${normType.toLowerCase()}`}>
                            {normType}
                          </span>
                        </div>
                        <div className="card-title">{displayTitle}</div>
                        <div className="card-bottom">
                          <span className={`priority-${normPriority.toLowerCase()}`}>
                            ● {normPriority}
                          </span>
                          <span className="points-pill">{Number(issue.storyPoints) || 0} SP</span>
                          {next ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onUpdateStatus(issue.id, next)}
                              data-testid={`btn-advance-${displayKey}`}
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
