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

  it('keeps the form values and re-enables submit when sprint creation fails', async () => {
    const onCreateSprint = jest.fn().mockRejectedValue(new Error('Fechas inválidas'));
    render(
      <TimelinePage loading={false} sprints={[]} onCreateSprint={onCreateSprint} onStartSprint={jest.fn()} onCompleteSprint={jest.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint roto' } });
    fireEvent.click(screen.getByText('Crear sprint'));

    await waitFor(() => expect(onCreateSprint).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Crear sprint')).not.toBeDisabled());
    expect(screen.getByPlaceholderText('Sprint 1')).toHaveValue('Sprint roto');
  });

  describe('sprint duration', () => {
    const handlers = () => ({ onCreateSprint: jest.fn().mockResolvedValue({}), onStartSprint: jest.fn(), onCompleteSprint: jest.fn() });
    const startInput = () => screen.getByLabelText('Inicio');
    const endInput = () => screen.getByLabelText('Fin');
    const durationSelect = () => screen.getByLabelText('Duración');

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'nextTick', 'setImmediate', 'queueMicrotask'] });
      jest.setSystemTime(new Date(2026, 10, 16, 9, 0)); // Monday 2026-11-16, local time
    });

    afterEach(() => jest.useRealTimers());

    it('defaults to 2 weeks from today with the end computed inclusively', () => {
      render(<TimelinePage loading={false} sprints={[]} {...handlers()} />);

      expect(durationSelect()).toHaveValue('2');
      expect(Array.from((durationSelect() as HTMLSelectElement).options).map((o) => o.text))
        .toEqual(['1 semana', '2 semanas', '3 semanas', '4 semanas']);
      expect(startInput()).toHaveValue('2026-11-16');
      expect(endInput()).toHaveValue('2026-11-29');
    });

    it('recalculates the end when the start date or the duration changes', () => {
      render(<TimelinePage loading={false} sprints={[]} {...handlers()} />);

      fireEvent.change(startInput(), { target: { value: '2026-12-01' } });
      expect(endInput()).toHaveValue('2026-12-14');

      fireEvent.change(durationSelect(), { target: { value: '4' } });
      expect(endInput()).toHaveValue('2026-12-28');

      fireEvent.change(durationSelect(), { target: { value: '1' } });
      expect(endInput()).toHaveValue('2026-12-07');
    });

    it('keeps the end editable by hand and recalculates again when start or duration change', () => {
      render(<TimelinePage loading={false} sprints={[]} {...handlers()} />);

      fireEvent.change(endInput(), { target: { value: '2026-11-25' } });
      expect(endInput()).toHaveValue('2026-11-25');
      expect(screen.getByText(/Fecha de fin ajustada manualmente/)).toBeInTheDocument();

      fireEvent.change(durationSelect(), { target: { value: '3' } });
      expect(endInput()).toHaveValue('2026-12-06');
      expect(screen.queryByText(/ajustada manualmente/)).not.toBeInTheDocument();
    });

    it('rejects an end before the start and does not submit', () => {
      const props = handlers();
      render(<TimelinePage loading={false} sprints={[]} {...props} />);
      fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint 9' } });

      fireEvent.change(endInput(), { target: { value: '2026-11-10' } });

      expect(screen.getByRole('alert')).toHaveTextContent('La fecha de fin no puede ser anterior a la fecha de inicio.');
      expect(endInput()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Crear sprint')).toBeDisabled();
      fireEvent.submit(screen.getByText('Crear sprint').closest('form') as HTMLFormElement);
      expect(props.onCreateSprint).not.toHaveBeenCalled();
    });

    it('sends the chosen start and computed end to onCreateSprint', async () => {
      const props = handlers();
      render(<TimelinePage loading={false} sprints={[]} {...props} />);
      fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint 9' } });
      fireEvent.change(startInput(), { target: { value: '2026-11-23' } });
      fireEvent.change(durationSelect(), { target: { value: '3' } });

      fireEvent.click(screen.getByText('Crear sprint'));

      await waitFor(() => expect(props.onCreateSprint).toHaveBeenCalledWith({
        name: 'Sprint 9', goal: '', startDate: '2026-11-23', endDate: '2026-12-13', capacityStoryPoints: 0,
      }));
    });

    it('keeps the current end while the start field is temporarily empty', () => {
      render(<TimelinePage loading={false} sprints={[]} {...handlers()} />);
      fireEvent.change(startInput(), { target: { value: '' } });
      expect(endInput()).toHaveValue('2026-11-29');
      expect(screen.getByText('Crear sprint')).toBeDisabled();
    });
  });

  it('shows loading and empty states', () => {
    const handlers = { onCreateSprint: jest.fn(), onStartSprint: jest.fn(), onCompleteSprint: jest.fn() };
    const { rerender } = render(<TimelinePage loading sprints={[]} {...handlers} />);
    expect(screen.getByText('Cargando cronograma...')).toBeInTheDocument();
    rerender(<TimelinePage loading={false} sprints={[]} {...handlers} />);
    expect(screen.getByText(/Todavía no hay sprints/)).toBeInTheDocument();
  });

  it('records capacity in story points and displays overcapacity warning', async () => {
    const onCreateSprint = jest.fn().mockResolvedValue({});
    render(
      <TimelinePage
        loading={false}
        sprints={[
          {
            id: 'over',
            name: 'Sprint Sobrecargado',
            goal: 'Mucho alcance',
            status: 'PLANNED',
            startDate: '2026-11-12',
            endDate: '2026-11-26',
            totalStoryPoints: 45,
            completedStoryPoints: 0,
            capacityStoryPoints: 30,
          },
        ]}
        onCreateSprint={onCreateSprint}
        onStartSprint={jest.fn()}
        onCompleteSprint={jest.fn()}
      />,
    );

    expect(screen.getByText('Alcance (45 SP) supera la capacidad (30 SP)')).toBeInTheDocument();
    expect(screen.getByText('0/45 SP · Cap: 30 SP')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint con Capacidad' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 30'), { target: { value: '35' } });
    fireEvent.click(screen.getByText('Crear sprint'));

    await waitFor(() => {
      expect(onCreateSprint).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sprint con Capacidad', capacityStoryPoints: 35 }),
      );
    });
  });

  it('restricts sprint management when canManageSprints is false', () => {
    render(
      <TimelinePage
        loading={false}
        canManageSprints={false}
        sprints={[
          {
            id: 's1',
            name: 'Sprint 1',
            goal: 'Goal',
            status: 'PLANNED',
            startDate: '2026-11-12',
            endDate: '2026-11-26',
            totalStoryPoints: 10,
            completedStoryPoints: 0,
          },
        ]}
        onCreateSprint={jest.fn()}
        onStartSprint={jest.fn()}
        onCompleteSprint={jest.fn()}
      />,
    );

    expect(screen.getByText(/Solo el OWNER o un ADMIN del proyecto pueden crear, iniciar o completar sprints/)).toBeInTheDocument();
    expect(screen.queryByText('Crear sprint')).not.toBeInTheDocument();
    expect(screen.queryByText('Iniciar sprint')).not.toBeInTheDocument();
  });
});
