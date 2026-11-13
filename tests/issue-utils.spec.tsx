import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  normalizeType,
  normalizePriority,
  normalizeStatus,
  typeToId,
  priorityToId,
} from '../src/utils/issue-utils';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BacklogPage } from '../src/pages/BacklogPage';
import { BoardPage } from '../src/pages/BoardPage';

describe('issue-utils', () => {
  describe('normalizeType', () => {
    it('normalizes integer types correctly', () => {
      expect(normalizeType(1)).toBe('STORY');
      expect(normalizeType(2)).toBe('TASK');
      expect(normalizeType(3)).toBe('BUG');
      expect(normalizeType(4)).toBe('EPIC');
      expect(normalizeType(99)).toBe('TASK');
    });

    it('normalizes string types correctly', () => {
      expect(normalizeType('STORY')).toBe('STORY');
      expect(normalizeType('story')).toBe('STORY');
      expect(normalizeType('HISTORIA')).toBe('STORY');
      expect(normalizeType('TASK')).toBe('TASK');
      expect(normalizeType('tarea')).toBe('TASK');
      expect(normalizeType('BUG')).toBe('BUG');
      expect(normalizeType('bug')).toBe('BUG');
      expect(normalizeType('EPIC')).toBe('EPIC');
      expect(normalizeType('épica')).toBe('EPIC');
      expect(normalizeType('epica')).toBe('EPIC');
      expect(normalizeType('1')).toBe('STORY');
      expect(normalizeType('2')).toBe('TASK');
      expect(normalizeType('3')).toBe('BUG');
      expect(normalizeType('4')).toBe('EPIC');
      expect(normalizeType('UNKNOWN')).toBe('TASK');
      expect(normalizeType(null)).toBe('TASK');
      expect(normalizeType(undefined)).toBe('TASK');
    });
  });

  describe('normalizePriority', () => {
    it('normalizes integer priorities correctly', () => {
      expect(normalizePriority(1)).toBe('LOW');
      expect(normalizePriority(2)).toBe('MEDIUM');
      expect(normalizePriority(3)).toBe('HIGH');
      expect(normalizePriority(4)).toBe('CRITICAL');
      expect(normalizePriority(0)).toBe('MEDIUM');
    });

    it('normalizes string priorities correctly', () => {
      expect(normalizePriority('LOW')).toBe('LOW');
      expect(normalizePriority('baja')).toBe('LOW');
      expect(normalizePriority('MEDIUM')).toBe('MEDIUM');
      expect(normalizePriority('media')).toBe('MEDIUM');
      expect(normalizePriority('HIGH')).toBe('HIGH');
      expect(normalizePriority('alta')).toBe('HIGH');
      expect(normalizePriority('CRITICAL')).toBe('CRITICAL');
      expect(normalizePriority('crítica')).toBe('CRITICAL');
      expect(normalizePriority('critica')).toBe('CRITICAL');
      expect(normalizePriority('1')).toBe('LOW');
      expect(normalizePriority('2')).toBe('MEDIUM');
      expect(normalizePriority('3')).toBe('HIGH');
      expect(normalizePriority('4')).toBe('CRITICAL');
      expect(normalizePriority('OTHER')).toBe('MEDIUM');
      expect(normalizePriority(null)).toBe('MEDIUM');
      expect(normalizePriority(undefined)).toBe('MEDIUM');
    });
  });

  describe('normalizeStatus', () => {
    it('normalizes integer statuses correctly', () => {
      expect(normalizeStatus(1)).toBe('TODO');
      expect(normalizeStatus(2)).toBe('IN_PROGRESS');
      expect(normalizeStatus(3)).toBe('IN_REVIEW');
      expect(normalizeStatus(4)).toBe('DONE');
      expect(normalizeStatus(99)).toBe('TODO');
    });

    it('normalizes string statuses correctly', () => {
      expect(normalizeStatus('TODO')).toBe('TODO');
      expect(normalizeStatus('por hacer')).toBe('TODO');
      expect(normalizeStatus('IN_PROGRESS')).toBe('IN_PROGRESS');
      expect(normalizeStatus('en progreso')).toBe('IN_PROGRESS');
      expect(normalizeStatus('IN_REVIEW')).toBe('IN_REVIEW');
      expect(normalizeStatus('en revisión')).toBe('IN_REVIEW');
      expect(normalizeStatus('en revision')).toBe('IN_REVIEW');
      expect(normalizeStatus('DONE')).toBe('DONE');
      expect(normalizeStatus('listo')).toBe('DONE');
      expect(normalizeStatus('RANDOM')).toBe('TODO');
      expect(normalizeStatus(null)).toBe('TODO');
      expect(normalizeStatus(undefined)).toBe('TODO');
    });
  });

  describe('typeToId and priorityToId', () => {
    it('maps type to integer ID correctly', () => {
      expect(typeToId('STORY')).toBe(1);
      expect(typeToId('TASK')).toBe(2);
      expect(typeToId('BUG')).toBe(3);
      expect(typeToId('EPIC')).toBe(4);
      expect(typeToId(1)).toBe(1);
      expect(typeToId('Historia')).toBe(1);
      expect(typeToId('unknown')).toBe(2);
    });

    it('maps priority to integer ID correctly', () => {
      expect(priorityToId('LOW')).toBe(1);
      expect(priorityToId('MEDIUM')).toBe(2);
      expect(priorityToId('HIGH')).toBe(3);
      expect(priorityToId('CRITICAL')).toBe(4);
      expect(priorityToId(1)).toBe(1);
      expect(priorityToId('Alta')).toBe(3);
      expect(priorityToId('unknown')).toBe(2);
    });
  });
});

describe('ErrorBoundary', () => {
  const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test Render Error');
    }
    return <div>Normal Content</div>;
  };

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('renders friendly fallback UI when error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No se pudo renderizar la vista')).toBeInTheDocument();
    expect(screen.getByText('Test Render Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('handles reintentar button click', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const retryBtn = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryBtn);
    expect(screen.getByText('No se pudo renderizar la vista')).toBeInTheDocument();
  });
});

describe('Backlog and Board resilience with raw backend numbers', () => {
  it('renders backlog successfully when issues contain raw integers for type and priority', () => {
    const rawIssues: any[] = [
      {
        id: 'raw-1',
        key: 'PROJ-1',
        title: 'Backend created issue',
        type: 1, // integer from MS1
        priority: 2, // integer from MS1
        status: 'TODO',
        storyPoints: 3,
      },
      {
        id: 'raw-2',
        key: 'PROJ-2',
        title: 'Another task',
        type: 2,
        priority: 3,
        status: 1, // raw integer status
        storyPoints: 5,
      },
    ];

    render(
      <BacklogPage
        issues={rawIssues}
        onOpenCreateModal={jest.fn()}
        onOpenAiDrawer={jest.fn()}
      />
    );

    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Backend created issue')).toBeInTheDocument();
    expect(screen.getByText('STORY')).toBeInTheDocument();
    expect(screen.getByText('● MEDIUM')).toBeInTheDocument();

    expect(screen.getByText('PROJ-2')).toBeInTheDocument();
    expect(screen.getByText('TASK')).toBeInTheDocument();
    expect(screen.getByText('● HIGH')).toBeInTheDocument();
  });

  it('renders board successfully when issues contain raw integers for type and priority', () => {
    const rawIssues: any[] = [
      {
        id: 'raw-1',
        key: 'PROJ-1',
        title: 'Board issue',
        type: 1,
        priority: 2,
        status: 'TODO',
        storyPoints: 3,
      },
    ];

    render(
      <BoardPage
        issues={rawIssues}
        onUpdateStatus={jest.fn()}
        sprintName="Sprint 1"
      />
    );

    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Board issue')).toBeInTheDocument();
    expect(screen.getByText('STORY')).toBeInTheDocument();
    expect(screen.getByText('● MEDIUM')).toBeInTheDocument();
  });
});
