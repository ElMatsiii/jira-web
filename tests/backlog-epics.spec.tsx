import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BacklogPage } from '../src/pages/BacklogPage';
import { formatVelocity } from '../src/pages/AnalyticsPage';

const ISSUES = [
  { id: 's1', key: 'WEB-2', title: 'Login con email', status: 'TODO', priority: 'HIGH', type: 'STORY', storyPoints: 3, parentId: 'e1' },
  { id: 'e1', key: 'WEB-1', title: 'Autenticación', status: 'TODO', priority: 'MEDIUM', type: 'EPIC', storyPoints: 0 },
  { id: 'b1', key: 'WEB-3', title: 'Error al recordar sesión', status: 'TODO', priority: 'LOW', type: 'BUG', storyPoints: 1, parentId: 'e1' },
  { id: 'l1', key: 'WEB-4', title: 'Footer', status: 'DONE', priority: 'LOW', type: 'TASK', storyPoints: 1 },
];

const renderBacklog = () =>
  render(<BacklogPage issues={ISSUES} onOpenCreateModal={jest.fn()} onOpenAiDrawer={jest.fn()} />);

const rowKeys = () => screen.getAllByTestId(/^issue-row-/).map((row) => row.getAttribute('data-testid'));

describe('BacklogPage epics', () => {
  it('lists the issues of each epic under it', () => {
    renderBacklog();

    expect(rowKeys()).toEqual(['issue-row-WEB-1', 'issue-row-WEB-2', 'issue-row-WEB-3', 'issue-row-WEB-4']);
    expect(screen.getByTestId('epic-children-WEB-1')).toHaveTextContent('2 historias');
    expect(screen.getByTestId('issue-row-WEB-2')).toHaveClass('issue-item', 'is-epic-child');
    expect(screen.getByTestId('issue-row-WEB-4')).not.toHaveClass('is-epic-child');
  });

  it('shows the epic key on an issue whose epic is hidden by the filter', () => {
    renderBacklog();

    fireEvent.change(screen.getByTestId('backlog-filter-select'), { target: { value: 'STORY' } });

    expect(rowKeys()).toEqual(['issue-row-WEB-2']);
    const row = screen.getByTestId('issue-row-WEB-2');
    expect(row).not.toHaveClass('is-epic-child');
    expect(within(row).getByText('Épica WEB-1')).toBeInTheDocument();
  });

  it('uses the singular for an epic with one issue', () => {
    render(<BacklogPage issues={ISSUES.slice(0, 2)} onOpenCreateModal={jest.fn()} onOpenAiDrawer={jest.fn()} />);
    expect(screen.getByTestId('epic-children-WEB-1')).toHaveTextContent('1 historia');
  });
});

describe('formatVelocity', () => {
  it('describes the closed sprints behind the average', () => {
    expect(formatVelocity(0, 0)).toEqual({ value: 'Sin sprints cerrados', hint: 'Se calculará al cerrar el primer sprint.' });
    expect(formatVelocity(12, 1)).toEqual({ value: '12 SP / sprint', hint: 'Promedio de 1 sprint cerrado' });
    expect(formatVelocity(12, 3)).toEqual({ value: '12 SP / sprint', hint: 'Promedio de 3 sprints cerrados' });
    expect(formatVelocity(12, null)).toEqual({ value: '12 SP / sprint', hint: '' });
    expect(formatVelocity(12, undefined)).toEqual({ value: '12 SP / sprint', hint: '' });
  });
});
