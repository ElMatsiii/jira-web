import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { CreateIssueModal } from '../src/components/CreateIssueModal';

const css = readFileSync(join(__dirname, '..', 'src', 'index.css'), 'utf8');
/** Body of the first rule whose selector list is exactly `selector`. */
const ruleBody = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

const renderModal = () => {
  const onClose = jest.fn();
  const onCreate = jest.fn().mockResolvedValue(undefined);
  render(<CreateIssueModal isOpen onClose={onClose} onCreate={onCreate} />);
  return { onClose, onCreate };
};

describe('CreateIssueModal responsive layout', () => {
  it('uses the wide single-card dialog with a two-column form', () => {
    renderModal();

    const dialog = screen.getByTestId('create-issue-dialog');
    expect(dialog).toHaveClass('create-issue-dialog', 'is-single');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(screen.queryByTestId('create-issue-grid')).not.toBeInTheDocument();

    const layout = screen.getByTestId('issue-form-layout');
    const main = layout.querySelector('.issue-form-main') as HTMLElement;
    const side = layout.querySelector('.issue-form-side') as HTMLElement;
    // Left column: title, description, criteria. Right column: type, priority, story points.
    expect(within(main).getByTestId('input-issue-title')).toBeInTheDocument();
    expect(within(main).getByTestId('input-issue-desc')).toBeInTheDocument();
    expect(within(main).getByLabelText('Criterios de aceptación')).toBeInTheDocument();
    expect(within(side).getByTestId('select-issue-type')).toBeInTheDocument();
    expect(within(side).getByTestId('select-issue-priority')).toBeInTheDocument();
    expect(within(side).getByTestId('input-issue-points')).toBeInTheDocument();
    expect(within(main).getByTestId('input-issue-desc')).toHaveAttribute('rows', '4');
  });

  it('switches to the responsive grid inside the scrollable body when there are several recuadros', () => {
    renderModal();
    fireEvent.click(screen.getByText('+ Nuevo recuadro (1/8)'));
    fireEvent.click(screen.getByText('+ Nuevo recuadro (2/8)'));

    expect(screen.getByTestId('create-issue-dialog')).toHaveClass('is-multi');
    const grid = screen.getByTestId('create-issue-grid');
    expect(screen.getByTestId('create-issue-body')).toContainElement(grid);
    expect(within(grid).getAllByRole('button', { name: /Descartar recuadro \d/ })).toHaveLength(3);
    expect(screen.getByText('3 / 8 recuadros')).toBeInTheDocument();
    expect(screen.getByTestId('input-issue-desc-1')).toHaveAttribute('rows', '2');
  });

  it('returns to the single-card layout when only one recuadro remains', () => {
    renderModal();
    fireEvent.click(screen.getByText('+ Nuevo recuadro (1/8)'));
    expect(screen.getByTestId('create-issue-dialog')).toHaveClass('is-multi');

    fireEvent.click(screen.getByRole('button', { name: 'Descartar recuadro 2' }));

    expect(screen.getByTestId('create-issue-dialog')).toHaveClass('is-single');
    expect(screen.queryByTestId('create-issue-grid')).not.toBeInTheDocument();
  });

  it('keeps the header actions available in both modes and hides "+ Nuevo recuadro" at the limit of 8', () => {
    const { onClose } = renderModal();
    for (let i = 1; i < 8; i += 1) fireEvent.click(screen.getByText(`+ Nuevo recuadro (${i}/8)`));

    expect(screen.queryByText(/\+ Nuevo recuadro/)).not.toBeInTheDocument();
    expect(screen.getByText('8 / 8 recuadros')).toHaveClass('modal-grid-counter-badge', 'limit');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits a draft from the grid with its own values', async () => {
    const { onCreate } = renderModal();
    fireEvent.click(screen.getByText('+ Nuevo recuadro (1/8)'));
    fireEvent.change(screen.getByTestId('input-issue-title-1'), { target: { value: 'Segunda' } });
    fireEvent.change(screen.getByTestId('select-issue-priority-1'), { target: { value: 'HIGH' } });
    fireEvent.click(screen.getByTestId('btn-submit-issue-1'));

    await screen.findByText('1 / 8 recuadros');
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Segunda', priority: 'HIGH', type: 'TASK' }));
  });
});

describe('CreateIssueModal CSS', () => {
  it('sizes the dialog by mode and scrolls inside the body', () => {
    expect(ruleBody('.create-issue-dialog.is-single')).toMatch(/max-width:\s*980px/);
    expect(ruleBody('.create-issue-dialog.is-multi')).toMatch(/max-width:\s*1560px/);
    expect(ruleBody('.create-issue-body')).toMatch(/overflow-y:\s*auto/);
  });

  it('uses an auto-fill grid for several cards and two columns for a single form', () => {
    expect(ruleBody('.create-issue-grid')).toMatch(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(340px,\s*1fr\)\)/);
    expect(ruleBody('.issue-form-layout')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.7fr\)\s+minmax\(220px,\s*1fr\)/);
    expect(ruleBody('.create-issue-grid .issue-form-layout')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it('keeps the caret and the text pointer visible on the cream theme', () => {
    expect(ruleBody('html')).toMatch(/color-scheme:\s*light/);
    const textFieldRule = css.match(/input:not\(\[type='checkbox'\]\)[^{]*textarea\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(textFieldRule).toMatch(/caret-color:\s*var\(--text-main\)/);
    // Custom navy (#0D172A) I-beam with cream outline, falling back to the native text cursor.
    expect(textFieldRule).toMatch(/cursor:\s*url\("data:image\/svg\+xml,[^"]*%230D172A[^"]*"\)\s*8 12,\s*text;/);
    expect(css).not.toMatch(/caret-color:\s*(#fff|#ffffff|white|transparent)/i);
  });

  it('no longer ships the fixed 3x2 grid rules nor undefined color tokens', () => {
    expect(css).not.toMatch(/\.modal-grid-container/);
    expect(css).not.toMatch(/\.modal-overlay\.grid-mode/);
    expect(css).not.toMatch(/var\(--secondary-brand\)/);
  });
});
