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
}) => {
  return (
    <header className="navbar" role="banner">
      <div className="nav-brand">
        <div className="nav-brand-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span>Jira <strong>AI</strong></span>
        <span className="nav-badge-enterprise">Enterprise</span>
      </div>

      <nav className="nav-links" role="navigation" aria-label="Navegación principal">
        <button
          className={`nav-btn ${currentTab === 'backlog' ? 'active' : ''}`}
          onClick={() => onSelectTab('backlog')}
          data-testid="tab-backlog"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Backlog
        </button>
        <button
          className={`nav-btn ${currentTab === 'board' ? 'active' : ''}`}
          onClick={() => onSelectTab('board')}
          data-testid="tab-board"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Tablero Scrum
        </button>
        <button
          className={`nav-btn ${currentTab === 'timeline' ? 'active' : ''}`}
          onClick={() => onSelectTab('timeline')}
          data-testid="tab-timeline"
        >
          Cronograma
        </button>
        <button
          className={`nav-btn ${currentTab === 'analytics' ? 'active' : ''}`}
          onClick={() => onSelectTab('analytics')}
          data-testid="tab-analytics"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Métricas
        </button>
      </nav>

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
        {userName && <span className="nav-user-name">{userName}</span>}
        {onLogout && <button className="btn btn-secondary btn-sm" onClick={onLogout}>Salir</button>}
      </div>
    </header>
  );
};
