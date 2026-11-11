import React, { useState } from 'react';

export interface Issue {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'STORY' | 'TASK' | 'BUG' | 'EPIC';
  storyPoints: number;
  sprintId?: string;
  acceptanceCriteria?: string;
}

export interface BacklogPageProps {
  issues: Issue[];
  sprints?: { id: string; name: string; status: string }[];
  loading?: boolean;
  onOpenCreateModal: () => void;
  onOpenAiDrawer: () => void;
  onAssignIssue?: (issueId: string, sprintId: string) => void;
}

export const BacklogPage: React.FC<BacklogPageProps> = ({
  issues,
  sprints = [],
  loading,
  onOpenCreateModal,
  onOpenAiDrawer,
  onAssignIssue,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredIssues = issues.filter((issue) => {
    const matchesType = filterType === 'ALL' || issue.type === filterType;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPoints = filteredIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

  return (
    <div className="main-content" data-testid="page-backlog">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Backlog del Producto</span>
            <span className="nav-badge-enterprise">MS1 • Go</span>
          </h1>
          <p className="page-subtitle">
            Gestión centralizada de requerimientos alimentada por el Microservicio MS1 (Go + PostgreSQL) y sincronizada vía gRPC con el BFF.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ai" onClick={onOpenAiDrawer} data-testid="backlog-btn-ai">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Desglosar Épica con IA
          </button>
          <button className="btn btn-primary" onClick={onOpenCreateModal} data-testid="backlog-btn-create">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Incidencia
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '320px' }}
          placeholder="Buscar por título o clave (ej. JIRA-101)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="backlog-search-input"
        />

        <select
          className="form-select"
          style={{ width: '190px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          data-testid="backlog-filter-select"
        >
          <option value="ALL">Todos los Tipos</option>
          <option value="STORY">Historias de Usuario</option>
          <option value="TASK">Tareas</option>
          <option value="BUG">Bugs</option>
          <option value="EPIC">Épicas</option>
        </select>

        {/* Quick-filter pill buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { label: 'Todos', val: 'ALL' },
            { label: 'Historias', val: 'STORY' },
            { label: 'Bugs', val: 'BUG' },
            { label: 'Tareas', val: 'TASK' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setFilterType(item.val)}
              className={`btn btn-sm ${filterType === item.val ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Total en Backlog:</span>
          <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {filteredIssues.length} incidencias
          </strong>
          <span className="points-pill">{totalPoints} SP</span>
        </span>
      </div>

      {/* Main card */}
      <div className="backlog-card">
        {loading ? (
          <div style={{ padding: '24px' }}>
            <div style={{ paddingBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Cargando incidencias desde el BFF GraphQL...
            </div>
            {/* Real proportional Skeletons according to Frontend Craft rules */}
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div className="skeleton-shimmer" style={{ width: '64px', height: '18px' }} />
                  <div className="skeleton-shimmer" style={{ width: '48px', height: '18px' }} />
                  <div className="skeleton-shimmer" style={{ width: `${140 + n * 40}px`, height: '18px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="skeleton-shimmer" style={{ width: '50px', height: '16px' }} />
                  <div className="skeleton-shimmer" style={{ width: '40px', height: '18px' }} />
                  <div className="skeleton-shimmer" style={{ width: '80px', height: '22px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              No hay incidencias que coincidan con el filtro actual.
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '360px' }}>
              Intente ajustar el término de búsqueda o seleccione otro tipo de incidencia.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(searchTerm || filterType !== 'ALL') && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchTerm(''); setFilterType('ALL'); }}
                >
                  Restablecer Filtros
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
                + Crear Incidencia
              </button>
            </div>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div key={issue.id || issue.key} className="issue-item" data-testid={`issue-row-${issue.key}`}>
              <div className="issue-left">
                <span className="issue-key">{issue.key}</span>
                <span className={`badge badge-${issue.type.toLowerCase()}`}>
                  {issue.type}
                </span>
                <span className="issue-title" title={issue.title}>{issue.title}</span>
              </div>
              <div className="issue-right">
                <span className={`priority-${issue.priority.toLowerCase()}`} title={`Prioridad: ${issue.priority}`}>
                  ● {issue.priority}
                </span>
                <span className="points-pill">{issue.storyPoints} SP</span>
                <span className="status-badge" style={{ minWidth: '95px', textAlign: 'center' }}>
                  {issue.status}
                </span>
                {onAssignIssue && sprints.length > 0 && (
                  <select
                    className="form-select issue-sprint-select"
                    aria-label={`Sprint de ${issue.key}`}
                    value={issue.sprintId || ''}
                    onChange={(event) => {
                      if (event.target.value) onAssignIssue(issue.id, event.target.value);
                    }}
                  >
                    <option value="">Backlog</option>
                    {sprints.filter((sprint) => sprint.status === 'PLANNED' || sprint.status === 'ACTIVE').map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
