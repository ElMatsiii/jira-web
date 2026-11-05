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
}

export interface BacklogPageProps {
  issues: Issue[];
  loading?: boolean;
  onOpenCreateModal: () => void;
  onOpenAiDrawer: () => void;
}

export const BacklogPage: React.FC<BacklogPageProps> = ({
  issues,
  loading,
  onOpenCreateModal,
  onOpenAiDrawer,
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Backlog del Producto</h1>
          <p className="page-subtitle">
            Gestión centralizada de requerimientos alimentada por el Microservicio MS1 (Go + PostgreSQL).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ai" onClick={onOpenAiDrawer} data-testid="backlog-btn-ai">
            ✨ Desglosar Épica con IA
          </button>
          <button className="btn btn-primary" onClick={onOpenCreateModal} data-testid="backlog-btn-create">
            + Nueva Incidencia
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '300px' }}
          placeholder="Buscar por título o clave (ej. JIRA-101)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="backlog-search-input"
        />
        <select
          className="form-select"
          style={{ maxWidth: '180px' }}
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
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Total en Backlog: <strong>{filteredIssues.length} incidencias</strong> ({totalPoints} Story Points)
        </span>
      </div>

      <div className="backlog-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando incidencias desde el BFF GraphQL...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay incidencias que coincidan con el filtro actual.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div key={issue.id || issue.key} className="issue-item" data-testid={`issue-row-${issue.key}`}>
              <div className="issue-left">
                <span className="issue-key">{issue.key}</span>
                <span className={`badge badge-${issue.type.toLowerCase()}`}>
                  {issue.type}
                </span>
                <span className="issue-title">{issue.title}</span>
              </div>
              <div className="issue-right">
                <span className={`priority-${issue.priority.toLowerCase()}`}>
                  {issue.priority}
                </span>
                <span className="points-pill">{issue.storyPoints} SP</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '90px', textAlign: 'right' }}>
                  {issue.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
