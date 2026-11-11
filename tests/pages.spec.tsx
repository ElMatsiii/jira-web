import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BacklogPage } from '../src/pages/BacklogPage';
import { BoardPage } from '../src/pages/BoardPage';
import { AnalyticsPage } from '../src/pages/AnalyticsPage';
import { Issue } from '../src/pages/BacklogPage';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: jest.fn().mockReturnValue({
      data: { getBurndownAnalytics: {
        sprintId: 'sprint-1', velocity: 32, idealBurndown: [40, 32, 24, 16, 8, 0],
        actualBurndown: [40, 36, 28, 20, 12, 0], blockedCount: 0, healthStatus: 'ON_TRACK',
      } },
      loading: false,
      error: undefined,
    }),
    useMutation: jest.fn().mockReturnValue([jest.fn(), { loading: false }]),
  };
});

const INITIAL_ISSUES: Issue[] = [
  { id: 'issue-1', key: 'JIRA-101', title: 'Autenticación con OAuth2 y JWT', status: 'DONE', priority: 'HIGH', type: 'STORY', storyPoints: 5 },
  { id: 'issue-2', key: 'JIRA-102', title: 'Migración a PostgreSQL con índices optimizados', status: 'IN_PROGRESS', priority: 'MEDIUM', type: 'TASK', storyPoints: 3 },
  { id: 'issue-3', key: 'JIRA-103', title: 'Fix: Timeout en el consumidor de Kafka', status: 'IN_REVIEW', priority: 'CRITICAL', type: 'BUG', storyPoints: 2 },
  { id: 'issue-4', key: 'JIRA-104', title: 'Épica: Motor de Estimación con Gemini 2.0 Flash', status: 'TODO', priority: 'HIGH', type: 'EPIC', storyPoints: 8 },
];

describe('Web Pages Suite', () => {
  describe('BacklogPage', () => {
    it('should render list of issues with key, status, and filter options', () => {
      const onOpenCreate = jest.fn();
      const onOpenAi = jest.fn();

      render(
        <BacklogPage
          issues={INITIAL_ISSUES}
          loading={false}
          onOpenCreateModal={onOpenCreate}
          onOpenAiDrawer={onOpenAi}
        />
      );

      expect(screen.getByText('Backlog del Producto')).toBeInTheDocument();
      expect(screen.getByText('JIRA-101')).toBeInTheDocument();
      expect(screen.getByText('Autenticación con OAuth2 y JWT')).toBeInTheDocument();

      // Test search filter
      fireEvent.change(screen.getByTestId('backlog-search-input'), {
        target: { value: 'PostgreSQL' },
      });
      expect(screen.getByText('JIRA-102')).toBeInTheDocument();
      expect(screen.queryByText('JIRA-101')).not.toBeInTheDocument();

      // Test type filter
      fireEvent.change(screen.getByTestId('backlog-search-input'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('backlog-filter-select'), { target: { value: 'BUG' } });
      expect(screen.getByText('JIRA-103')).toBeInTheDocument();
      expect(screen.queryByText('JIRA-101')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('backlog-btn-create'));
      expect(onOpenCreate).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('backlog-btn-ai'));
      expect(onOpenAi).toHaveBeenCalled();

      // Quick filter pills
      fireEvent.click(screen.getByText('Historias'));
      expect(screen.getByText('JIRA-101')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Todos'));
      expect(screen.getByText('JIRA-103')).toBeInTheDocument();
    });

    it('should show empty state when search finds no results', () => {
      render(
        <BacklogPage
          issues={INITIAL_ISSUES}
          loading={false}
          onOpenCreateModal={jest.fn()}
          onOpenAiDrawer={jest.fn()}
        />
      );

      fireEvent.change(screen.getByTestId('backlog-search-input'), {
        target: { value: 'Inexistente 99999' },
      });
      expect(screen.getByText(/No hay incidencias que coincidan/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText('Restablecer Filtros'));
      expect(screen.getByText('JIRA-101')).toBeInTheDocument();
    });

    it('should show loading indicator when loading is true', () => {
      render(
        <BacklogPage
          issues={[]}
          loading={true}
          onOpenCreateModal={jest.fn()}
          onOpenAiDrawer={jest.fn()}
        />
      );
      expect(screen.getByText(/Cargando incidencias/i)).toBeInTheDocument();
    });
  });

  describe('BoardPage', () => {
    it('should render 4 Scrum Kanban columns and allow advancing card status', () => {
      const onUpdateStatus = jest.fn();

      render(
        <BoardPage
          issues={INITIAL_ISSUES}
          loading={false}
          onUpdateStatus={onUpdateStatus}
        />
      );

      expect(screen.getByTestId('board-column-TODO')).toBeInTheDocument();
      expect(screen.getByTestId('board-column-IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByTestId('board-column-IN_REVIEW')).toBeInTheDocument();
      expect(screen.getByTestId('board-column-DONE')).toBeInTheDocument();

      // JIRA-104 is in TODO, clicking advance should call with IN_PROGRESS
      const advanceBtn = screen.getByTestId('btn-advance-JIRA-104');
      fireEvent.click(advanceBtn);
      expect(onUpdateStatus).toHaveBeenCalledWith('issue-4', 'IN_PROGRESS');

      // JIRA-101 is in DONE, should show Listo
      expect(screen.getByText('✓ Listo')).toBeInTheDocument();
    });

    it('should show loading indicator on Board when loading is true', () => {
      render(
        <BoardPage
          issues={[]}
          loading={true}
          onUpdateStatus={jest.fn()}
        />
      );
      expect(screen.getByText(/Cargando tarjetas del tablero/i)).toBeInTheDocument();
    });
  });

  describe('AnalyticsPage', () => {
    it('should render live sprint metrics without fabricated fallback values', () => {
      render(<AnalyticsPage projectId="project-1" sprint={{ id: 'sprint-1', name: 'Sprint 1', goal: 'Deliver MVP' }} issues={[]} />);

      expect(screen.getByText('Rendimiento del proyecto')).toBeInTheDocument();
      expect(screen.getByText('32 SP / sprint')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByLabelText('Gráfico de burndown del sprint')).toBeInTheDocument();
    });

    it('should prompt to create an active sprint rather than show demo metrics', () => {
      render(<AnalyticsPage projectId="project-1" sprint={null} issues={[]} />);
      expect(screen.getByText(/Crea e inicia un sprint/i)).toBeInTheDocument();
    });
  });
});
