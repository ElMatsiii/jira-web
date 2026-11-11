import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TimelinePage } from '../src/pages/TimelinePage';

describe('TimelinePage', () => {
  it('creates a sprint and exposes controls for planned and active sprints', async () => {
    const onCreateSprint = jest.fn().mockResolvedValue({});
    const onStartSprint = jest.fn().mockResolvedValue({});
    const onCompleteSprint = jest.fn().mockResolvedValue({});
    render(
      <TimelinePage
        loading={false}
        sprints={[
          { id: 'planned', name: 'Sprint planificado', goal: 'Preparar entrega', status: 'PLANNED', startDate: '2026-11-12', endDate: '2026-11-26', totalStoryPoints: 0, completedStoryPoints: 0 },
          { id: 'active', name: 'Sprint activo', goal: 'Entregar MVP', status: 'ACTIVE', startDate: '2026-11-01', endDate: '2026-11-15', totalStoryPoints: 12, completedStoryPoints: 4 },
        ]}
        onCreateSprint={onCreateSprint}
        onStartSprint={onStartSprint}
        onCompleteSprint={onCompleteSprint}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint futuro' } });
    fireEvent.change(screen.getByPlaceholderText('Resultado que el equipo quiere lograr'), { target: { value: 'Cerrar funcionalidades' } });
    fireEvent.click(screen.getByText('Crear sprint'));
    await waitFor(() => expect(onCreateSprint).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Sprint futuro',
      goal: 'Cerrar funcionalidades',
    })));

    fireEvent.click(screen.getByText('Iniciar sprint'));
    fireEvent.click(screen.getByText('Completar sprint'));
    expect(onStartSprint).toHaveBeenCalledWith('planned');
    expect(onCompleteSprint).toHaveBeenCalledWith('active');
  });

  it('shows loading and empty states', () => {
    const handlers = { onCreateSprint: jest.fn(), onStartSprint: jest.fn(), onCompleteSprint: jest.fn() };
    const { rerender } = render(<TimelinePage loading sprints={[]} {...handlers} />);
    expect(screen.getByText('Cargando cronograma...')).toBeInTheDocument();
    rerender(<TimelinePage loading={false} sprints={[]} {...handlers} />);
    expect(screen.getByText(/Todavía no hay sprints/)).toBeInTheDocument();
  });
});
