import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AIAssistantDrawer } from '../src/components/AIAssistantDrawer';

const STORIES = [
  {
    title: 'Integrar pasarela',
    description: 'Como comprador quiero pagar con tarjeta',
    type: 'STORY',
    priority: 'CRITICAL',
    estimatedStoryPoints: 8,
    acceptanceCriteriaGherkin: 'Scenario: pago aprobado\nGiven una tarjeta válida\nThen el pedido queda pagado',
  },
  {
    title: 'Webhooks idempotentes',
    description: 'Procesar eventos una sola vez',
    type: 'TASK',
    priority: 'HIGH',
    estimatedStoryPoints: 5,
    acceptanceCriteriaGherkin: 'Scenario: evento duplicado',
  },
  {
    title: 'Reintentos con backoff',
    description: 'Reintentar cobros fallidos',
    type: 'BUG',
    estimatedStoryPoints: 3,
    acceptanceCriteriaGherkin: 'Scenario: fallo temporal',
  },
];

const renderDrawer = (props: Partial<React.ComponentProps<typeof AIAssistantDrawer>> = {}) => {
  const onClose = jest.fn();
  const onDecomposeEpic = jest.fn().mockResolvedValue({ epicTitle: 'Pagos con tarjeta', stories: STORIES });
  const onCreateStory = jest.fn().mockResolvedValue(undefined);
  render(
    <AIAssistantDrawer isOpen onClose={onClose} onDecomposeEpic={onDecomposeEpic} onCreateStory={onCreateStory} {...props} />,
  );
  return { onClose, onDecomposeEpic, onCreateStory };
};

const generate = async () => {
  fireEvent.change(screen.getByTestId('input-ai-epic-title'), { target: { value: 'Pagos con tarjeta' } });
  fireEvent.change(screen.getByTestId('input-ai-epic-desc'), { target: { value: 'checkout' } });
  fireEvent.click(screen.getByTestId('btn-ai-decompose-submit'));
  await screen.findByTestId('ai-story-card-0');
};

describe('AIAssistantDrawer story review', () => {
  it('collapses the epic form after generating and lets the user expand it again', async () => {
    renderDrawer();
    await generate();

    expect(screen.queryByTestId('input-ai-epic-title')).not.toBeInTheDocument();
    const summary = screen.getByTestId('ai-epic-summary');
    expect(summary).toHaveTextContent('Pagos con tarjeta');

    fireEvent.click(within(summary).getByText('Editar épica'));
    expect(screen.getByTestId('input-ai-epic-title')).toHaveValue('Pagos con tarjeta');
    expect(screen.getByTestId('btn-ai-decompose-submit')).toHaveTextContent('Volver a generar historias');

    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.getByTestId('ai-epic-summary')).toBeInTheDocument();
  });

  it('shows compact cards with title, type, priority and points, without the long texts', async () => {
    renderDrawer();
    await generate();

    const card = screen.getByTestId('ai-story-card-0');
    expect(card).toHaveTextContent('Integrar pasarela');
    expect(within(card).getByText('STORY')).toHaveClass('badge', 'badge-story');
    expect(screen.getByTestId('ai-story-priority-0')).toHaveTextContent('CRITICAL');
    expect(within(card).getByText('8 SP')).toHaveClass('points-pill');
    expect(card).not.toHaveTextContent('Como comprador quiero pagar con tarjeta');
    expect(card).not.toHaveTextContent('Given una tarjeta válida');
    expect(screen.getByTestId('ai-story-priority-2')).toHaveTextContent('MEDIUM');
    expect(screen.getByText('Historias propuestas (3)')).toBeInTheDocument();
  });

  it('creates a single story and marks its card as created', async () => {
    const { onCreateStory } = renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-1')).getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(onCreateStory).toHaveBeenCalledTimes(1));
    expect(onCreateStory).toHaveBeenCalledWith(STORIES[1]);
    const card = screen.getByTestId('ai-story-card-1');
    expect(await within(card).findByText('✓ Creada en el backlog')).toBeInTheDocument();
    expect(card).toHaveClass('is-created');
    expect(within(card).queryByRole('button', { name: 'Crear' })).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-ai-create-all')).toHaveTextContent('Crear todas (2)');
  });

  it('discards a story without creating it', async () => {
    const { onCreateStory } = renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Descartar'));

    expect(screen.queryByText('Integrar pasarela')).not.toBeInTheDocument();
    expect(screen.getByText('Historias propuestas (2)')).toBeInTheDocument();
    expect(onCreateStory).not.toHaveBeenCalled();
  });

  it('creates every remaining story in order with "Crear todas"', async () => {
    const { onCreateStory } = renderDrawer();
    await generate();
    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Descartar'));

    fireEvent.click(screen.getByTestId('btn-ai-create-all'));

    await waitFor(() => expect(onCreateStory).toHaveBeenCalledTimes(2));
    expect(onCreateStory.mock.calls.map(([story]) => story.title)).toEqual(['Webhooks idempotentes', 'Reintentos con backoff']);
    await waitFor(() => expect(screen.queryByTestId('btn-ai-create-all')).not.toBeInTheDocument());
    expect(screen.getByText(/2 creadas/)).toBeInTheDocument();
  });

  it('stops "Crear todas" at the first failure and shows the error', async () => {
    const onCreateStory = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Proyecto no encontrado'));
    renderDrawer({ onCreateStory });
    await generate();

    fireEvent.click(screen.getByTestId('btn-ai-create-all'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Proyecto no encontrado');
    expect(onCreateStory).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('btn-ai-create-all')).toHaveTextContent('Crear todas (2)');
    expect(within(screen.getByTestId('ai-story-card-1')).getByRole('button', { name: 'Crear' })).not.toBeDisabled();
  });

  it('opens the detail with full texts, saves edits back to the card', async () => {
    const { onCreateStory } = renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    const detail = screen.getByTestId('ai-story-detail');
    expect(within(detail).getByLabelText('Descripción')).toHaveValue(STORIES[0].description);
    expect(within(detail).getByLabelText('Criterios de aceptación (Gherkin)')).toHaveValue(STORIES[0].acceptanceCriteriaGherkin);

    fireEvent.change(within(detail).getByLabelText('Título'), { target: { value: 'Integrar pasarela Stripe' } });
    fireEvent.change(within(detail).getByLabelText('Descripción'), { target: { value: 'Descripción revisada' } });
    fireEvent.click(within(detail).getByText('Guardar cambios'));

    expect(screen.queryByTestId('ai-story-detail')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-story-card-0')).toHaveTextContent('Integrar pasarela Stripe');
    expect(onCreateStory).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    expect(within(screen.getByTestId('ai-story-detail')).getByLabelText('Descripción')).toHaveValue('Descripción revisada');
  });

  it('creates the edited version with "Guardar y crear"', async () => {
    const { onCreateStory } = renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-2')).getByText('Ver detalle'));
    const detail = screen.getByTestId('ai-story-detail');
    fireEvent.change(within(detail).getByLabelText('Criterios de aceptación (Gherkin)'), { target: { value: 'Scenario: editado' } });
    fireEvent.click(within(detail).getByText('Guardar y crear'));

    await waitFor(() => expect(onCreateStory).toHaveBeenCalledWith({ ...STORIES[2], acceptanceCriteriaGherkin: 'Scenario: editado' }));
    expect(await within(screen.getByTestId('ai-story-card-2')).findByText('✓ Creada en el backlog')).toBeInTheDocument();
  });

  it('keeps an empty title from overwriting the original', async () => {
    renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Guardar cambios'));

    expect(screen.getByTestId('ai-story-card-0')).toHaveTextContent('Integrar pasarela');
  });

  it('Esc closes the detail first and the drawer second; clicking outside the detail closes only the detail', async () => {
    const { onClose } = renderDrawer();
    await generate();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('ai-story-detail')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    fireEvent.click(screen.getByTestId('ai-story-detail-overlay'));
    expect(screen.queryByTestId('ai-story-detail')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByTestId('ai-story-detail')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('only allows reviewing and discarding when there is no create handler', async () => {
    renderDrawer({ onCreateStory: undefined });
    await generate();

    expect(screen.queryByRole('button', { name: 'Crear' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-ai-create-all')).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId('ai-story-card-0')).getByText('Ver detalle'));
    expect(screen.queryByText('Guardar y crear')).not.toBeInTheDocument();
  });

  it('says so when the AI returns no stories', async () => {
    renderDrawer({ onDecomposeEpic: jest.fn().mockResolvedValue({ epicTitle: 'Vacía', stories: [] }) });
    fireEvent.change(screen.getByTestId('input-ai-epic-title'), { target: { value: 'Vacía' } });
    fireEvent.click(screen.getByTestId('btn-ai-decompose-submit'));

    expect(await screen.findByText('No quedan historias propuestas para esta épica.')).toBeInTheDocument();
    expect(screen.getByText('Historias propuestas (0)')).toBeInTheDocument();
  });
});
