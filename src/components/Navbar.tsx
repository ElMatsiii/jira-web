import React from 'react';

export interface NavbarProps {
  currentTab: 'backlog' | 'board' | 'analytics';
  onSelectTab: (tab: 'backlog' | 'board' | 'analytics') => void;
  onOpenCreateModal: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onToggleAiDrawer,
  isAiDrawerOpen,
}) => {
  return (
    <header className="navbar" role="banner">
      <div className="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#0052cc" />
          <path d="M12 4L4 12L12 20L20 12L12 4Z" fill="#ffffff" />
        </svg>
        <span>Jira <strong>AI</strong></span>
      </div>

      <nav className="nav-links" role="navigation">
        <button
          className={`nav-btn ${currentTab === 'backlog' ? 'active' : ''}`}
          onClick={() => onSelectTab('backlog')}
          data-testid="tab-backlog"
        >
          📋 Backlog
        </button>
        <button
          className={`nav-btn ${currentTab === 'board' ? 'active' : ''}`}
          onClick={() => onSelectTab('board')}
          data-testid="tab-board"
        >
          📌 Tablero Scrum
        </button>
        <button
          className={`nav-btn ${currentTab === 'analytics' ? 'active' : ''}`}
          onClick={() => onSelectTab('analytics')}
          data-testid="tab-analytics"
        >
          📈 Métricas & Burndown
        </button>
      </nav>

      <div className="nav-actions">
        <button
          className="btn btn-ai"
          onClick={onToggleAiDrawer}
          data-testid="btn-ai-assistant"
          aria-expanded={isAiDrawerOpen}
        >
          ✨ Scrum Master IA
        </button>
        <button
          className="btn btn-primary"
          onClick={onOpenCreateModal}
          data-testid="btn-create-issue"
        >
          + Crear Incidencia
        </button>
      </div>
    </header>
  );
};
