import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BacklogPage } from '../src/pages/BacklogPage';
import { BoardPage } from '../src/pages/BoardPage';
import { AnalyticsPage } from '../src/pages/AnalyticsPage';
import { INITIAL_ISSUES, INITIAL_BURNDOWN } from '../src/App';

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
  });

  describe('AnalyticsPage', () => {
    it('should render Burndown Chart SVG, KPI stats, and health badge', () => {
      render(<AnalyticsPage data={INITIAL_BURNDOWN} loading={false} />);

      expect(screen.getByText('Métricas de Sprint & Burndown Chart')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-health-status')).toHaveTextContent('✓ EN TIEMPO (ON TRACK)');
      expect(screen.getByTestId('kpi-velocity')).toHaveTextContent('32');
      expect(screen.getByTestId('kpi-blocked')).toHaveTextContent('0');

      expect(screen.getByTestId('chart-line-ideal')).toBeInTheDocument();
      expect(screen.getByTestId('chart-line-actual')).toBeInTheDocument();
    });

    it('should render fallback values when data is null', () => {
      render(<AnalyticsPage data={null} loading={false} />);
      expect(screen.getByText('Métricas de Sprint & Burndown Chart')).toBeInTheDocument();
    });
  });
});
