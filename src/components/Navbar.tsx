import React from 'react';

export interface NavbarProps {
  currentTab: 'backlog' | 'board' | 'timeline' | 'analytics';
  onSelectTab: (tab: 'backlog' | 'board' | 'timeline' | 'analytics') => void;
  onOpenCreateModal: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  userName?: string;
  onLogout?: () => void;
  canCreateIssue?: boolean;
  projectName?: string;
  projectKey?: string;
  workspaceName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onToggleAiDrawer,
  isAiDrawerOpen,
  userName,
  onLogout,
  canCreateIssue = true,
  projectName,
  projectKey,
  workspaceName,
}) => {
  return (
    <>
      {/* Top Header / Cabecera Principal */}
      <header className="navbar" role="banner">
        <div className="nav-brand">
          <div className="nav-brand-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span>Jira <strong>AI</strong></span>
          <span className="nav-badge-enterprise">Agile Slate</span>
        </div>

        <div className="nav-actions">
          {/* Microservices Cluster Live Status */}
          <div className="status-indicator-pill" title="Microservicios en ejecución (Docker)">
            <span className="pulse-dot"></span>
            <span>BFF & Kafka Live</span>
          </div>

          <button
            className="btn btn-ai"
            onClick={onToggleAiDrawer}
            data-testid="btn-ai-assistant"
            aria-expanded={isAiDrawerOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Herramientas IA
          </button>

          <button
            className="btn btn-primary"
            onClick={onOpenCreateModal}
            disabled={!canCreateIssue}
            data-testid="btn-create-issue"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Crear Incidencia
          </button>

          {userName && (
            <div className="nav-user-profile">
              <div className="user-avatar-circle" aria-hidden="true">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <span className="nav-user-name">{userName}</span>
            </div>
          )}
          {onLogout && <button className="btn btn-outline btn-sm" onClick={onLogout}>Salir</button>}
        </div>
      </header>

      {/* Barra Lateral / Sidebar Shell */}
      <aside className="app-sidebar" aria-label="Navegación del espacio de trabajo">
        <div className="sidebar-project-header">
          <div className="project-badge-icon" aria-hidden="true">
            {projectKey ? projectKey.slice(0, 2) : 'AI'}
          </div>
          <div className="project-header-info">
            <span className="project-header-title">{projectName || 'Espacio de Trabajo'}</span>
            <span className="project-header-subtitle">{workspaceName || 'Espacio Ágil'}</span>
          </div>
        </div>

        <div className="sidebar-section-label">Vistas del Proyecto</div>

        <nav className="sidebar-nav" role="navigation" aria-label="Navegación principal">
          <button
            className={`sidebar-nav-item ${currentTab === 'backlog' ? 'active' : ''}`}
            onClick={() => onSelectTab('backlog')}
            data-testid="tab-backlog"
          >
            <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>Backlog</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'board' ? 'active' : ''}`}
            onClick={() => onSelectTab('board')}
            data-testid="tab-board"
          >
            <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <span>Tablero Scrum</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'timeline' ? 'active' : ''}`}
            onClick={() => onSelectTab('timeline')}
            data-testid="tab-timeline"
          >
            <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Cronograma</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('analytics')}
            data-testid="tab-analytics"
          >
            <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Métricas</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-pill">
            <span className="sidebar-pill-dot"></span>
            <span>Agile Slate</span>
          </div>
        </div>
      </aside>
    </>
  );
};
