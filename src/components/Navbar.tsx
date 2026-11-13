import React from 'react';

export interface NavbarProps {
  currentTab: 'backlog' | 'board' | 'timeline' | 'analytics';
  onSelectTab: (tab: 'backlog' | 'board' | 'timeline' | 'analytics') => void;
  onOpenCreateModal: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  canCreateIssue?: boolean;
  userName?: string;
  onLogout?: () => void;
  projectKey?: string;
  projectName?: string;
  workspaceName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onToggleAiDrawer,
  isAiDrawerOpen,
  canCreateIssue = true,
  userName,
  onLogout,
  projectKey,
  projectName,
  workspaceName,
}) => {
  return (
    <>
      {/* Cabecera Superior / Top Header Shell */}
      <header className="navbar" role="banner">
        <div className="nav-brand">
          <div className="nav-brand-icon" aria-hidden="true">
            Δ
          </div>
          <span>Project Aurora <strong>Jira AI</strong></span>
          <span className="nav-badge-enterprise">Crema & Navy</span>
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
            {projectKey ? projectKey.slice(0, 2) : 'AU'}
          </div>
          <div className="project-header-info">
            <span className="project-header-title">{projectName || 'Espacio de Trabajo'}</span>
            <span className="project-header-subtitle">{workspaceName || 'Entrega Continua'}</span>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="sidebar-pill-dot"></span>
              <span>Project Aurora</span>
            </div>
            <span style={{ fontSize: '10px' }}>v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
};
