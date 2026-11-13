import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '../src/components/Navbar';
import { CreateIssueModal } from '../src/components/CreateIssueModal';
import { AIAssistantDrawer } from '../src/components/AIAssistantDrawer';

describe('Web Components Suite', () => {
  describe('Navbar Component', () => {
    it('should render navigation links and brand title', () => {
      const onSelectTab = jest.fn();
      const onOpenCreateModal = jest.fn();
      const onToggleAiDrawer = jest.fn();

      render(
        <Navbar
          currentTab="backlog"
          onSelectTab={onSelectTab}
          onOpenCreateModal={onOpenCreateModal}
          onToggleAiDrawer={onToggleAiDrawer}
          isAiDrawerOpen={false}
        />
      );

      expect(screen.getByText(/Jira/i)).toBeInTheDocument();
      expect(screen.getByTestId('tab-backlog')).toHaveClass('active');
      expect(screen.getByTestId('tab-board')).not.toHaveClass('active');

      fireEvent.click(screen.getByTestId('tab-board'));
      expect(onSelectTab).toHaveBeenCalledWith('board');

      fireEvent.click(screen.getByTestId('tab-analytics'));
      expect(onSelectTab).toHaveBeenCalledWith('analytics');

      fireEvent.click(screen.getByTestId('btn-create-issue'));
      expect(onOpenCreateModal).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('btn-ai-assistant'));
      expect(onToggleAiDrawer).toHaveBeenCalledTimes(1);
    });
  });

  describe('CreateIssueModal Component', () => {
    it('should not render anything when isOpen is false', () => {
      const { container } = render(
        <CreateIssueModal isOpen={false} onClose={jest.fn()} onCreate={jest.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should allow filling form and submitting a new issue', async () => {
      const onClose = jest.fn();
      const onCreate = jest.fn();

      render(<CreateIssueModal isOpen={true} onClose={onClose} onCreate={onCreate} />);

      expect(screen.getByText('Crear Nueva Incidencia')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('input-issue-title'), {
        target: { value: 'Nueva historia de autenticación' },
      });
      fireEvent.change(screen.getByTestId('input-issue-desc'), {
        target: { value: 'Detalles de seguridad' },
      });
      fireEvent.change(screen.getByTestId('select-issue-type'), {
        target: { value: 'BUG' },
      });
      fireEvent.change(screen.getByTestId('select-issue-priority'), {
        target: { value: 'CRITICAL' },
      });
      fireEvent.change(screen.getByTestId('input-issue-points'), {
        target: { value: '5' },
      });

      fireEvent.click(screen.getByTestId('btn-submit-issue'));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          title: 'Nueva historia de autenticación',
          description: 'Detalles de seguridad',
          type: 'BUG',
          priority: 'CRITICAL',
          storyPoints: 5,
          acceptanceCriteria: '',
        });
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should close when cancel or close button is clicked or Escape pressed', () => {
      const onClose = jest.fn();
      render(<CreateIssueModal isOpen={true} onClose={onClose} onCreate={jest.fn()} />);

      fireEvent.click(screen.getByText('Cancelar'));
      expect(onClose).toHaveBeenCalledTimes(1);

      // Fibonacci chip selection
      fireEvent.click(screen.getByText('8'));
      expect(screen.getByTestId('input-issue-points')).toHaveValue(8);

      // Escape key event
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('should allow AI segmentation and opening a second customizable recuadro up to maximum 6', async () => {
      const onBreakdownTask = jest.fn().mockResolvedValue({
        parentTitle: 'crear la base de la pagina web',
        subtasks: [
          {
            title: 'Crear frontend base',
            description: 'Vistas React y temas',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 3,
            acceptanceCriteriaGherkin: 'Given front When loads Then ok',
          },
          {
            title: 'Crear backend API',
            description: 'Servicios Go y endpoints',
            type: 'TASK',
            priority: 'HIGH',
            estimatedStoryPoints: 5,
            acceptanceCriteriaGherkin: 'Given back When ping Then 200',
          },
        ],
      });

      render(
        <CreateIssueModal
          isOpen={true}
          onClose={jest.fn()}
          onCreate={jest.fn()}
          onBreakdownTask={onBreakdownTask}
        />
      );

      // Fill primary task title
      fireEvent.change(screen.getByTestId('input-issue-title'), {
        target: { value: 'crear la base de la pagina web' },
      });

      // Click "Segmentar en subtareas con IA"
      fireEvent.click(screen.getByText('Segmentar en subtareas con IA'));

      await waitFor(() => {
        expect(onBreakdownTask).toHaveBeenCalledWith({
          title: 'crear la base de la pagina web',
          description: '',
        });
        expect(screen.getByText('Crear frontend base')).toBeInTheDocument();
        expect(screen.getByText('Crear backend API')).toBeInTheDocument();
      });

      // Accept first subtask -> opens second recuadro in simultaneous grid!
      const openButtons = screen.getAllByText('+ Abrir recuadro');
      fireEvent.click(openButtons[0]);

      // Now we should have 2 recuadros active simultaneously in the grid
      expect(screen.getByText(/2 \/ 6 recuadros/)).toBeInTheDocument();
      // Both the original card and the new accepted card are simultaneously visible in the grid
      expect(screen.getByDisplayValue('crear la base de la pagina web')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Crear frontend base')).toBeInTheDocument();

      // Add blank drafts until reaching max 6
      for (let i = 2; i < 6; i++) {
        const addBtn = screen.getByText(new RegExp(`\\+ Nuevo recuadro \\(${i}/6\\)`));
        fireEvent.click(addBtn);
      }
      expect(screen.getByText(/6 \/ 6 recuadros/)).toBeInTheDocument();

      // Attempting to add beyond 6 is blocked
      expect(screen.queryByText(/\+ Nuevo recuadro/)).not.toBeInTheDocument();
    });
  });

  describe('AIAssistantDrawer Component', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <AIAssistantDrawer isOpen={false} onClose={jest.fn()} onDecomposeEpic={jest.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should populate inputs when clicking a quick suggestion template', () => {
      const onClose = jest.fn();
      render(
        <AIAssistantDrawer isOpen={true} onClose={onClose} onDecomposeEpic={jest.fn()} />
      );

      fireEvent.click(screen.getByText('Pagos Stripe'));
      expect(screen.getByTestId('input-ai-epic-title')).toHaveValue('Pagos Stripe & Suscripciones');

      // Escape key event
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle epic decomposition and render generated stories', async () => {
      const onClose = jest.fn();
      const onDecomposeEpic = jest.fn().mockResolvedValue({
        epicTitle: 'Pagos Stripe',
        stories: [
          {
            title: 'Configurar Webhooks',
            description: 'Recibir eventos de pago confirmados',
            estimatedStoryPoints: 5,
            acceptanceCriteriaGherkin: 'Given un pago exitoso When se dispara el webhook Then marcar factura como pagada',
          },
        ],
      });

      render(
        <AIAssistantDrawer isOpen={true} onClose={onClose} onDecomposeEpic={onDecomposeEpic} />
      );

      fireEvent.change(screen.getByTestId('input-ai-epic-title'), {
        target: { value: 'Pagos Stripe' },
      });
      fireEvent.change(screen.getByTestId('input-ai-epic-desc'), {
        target: { value: 'Integración completa' },
      });

      fireEvent.click(screen.getByTestId('btn-ai-decompose-submit'));

      await waitFor(() => {
        expect(onDecomposeEpic).toHaveBeenCalledWith('Pagos Stripe', 'Integración completa');
        expect(screen.getByText('Configurar Webhooks')).toBeInTheDocument();
        expect(screen.getByText('5 SP')).toBeInTheDocument();
      });
    });

    it('should display error message if AI decomposition fails', async () => {
      const onDecomposeEpic = jest.fn().mockRejectedValue(new Error('Conexión fallida'));

      render(
        <AIAssistantDrawer isOpen={true} onClose={jest.fn()} onDecomposeEpic={onDecomposeEpic} />
      );

      fireEvent.change(screen.getByTestId('input-ai-epic-title'), {
        target: { value: 'Épica con error' },
      });
      fireEvent.click(screen.getByTestId('btn-ai-decompose-submit'));

      await waitFor(() => {
        expect(screen.getByText('Conexión fallida')).toBeInTheDocument();
      });
    });
  });
});
