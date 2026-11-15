import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ProjectMembersPanel } from '../src/components/ProjectMembersPanel';
import { IssueDetailPanel, formatDateTime } from '../src/components/IssueDetailPanel';
import { BacklogPage } from '../src/pages/BacklogPage';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return { ...actual, useQuery: jest.fn(), useMutation: jest.fn() };
});

const apolloMocks = jest.requireMock('@apollo/client') as { useQuery: jest.Mock; useMutation: jest.Mock };

const MEMBERS = [
  { id: 'u1', name: 'Olga', email: 'olga@example.com', role: 'OWNER', invited: false },
  { id: 'u2', name: 'Gabi', email: 'gabi@example.com', role: 'MEMBER', invited: true },
];

let queryResult: Record<string, unknown>;
let addMember: jest.Mock;
let removeMember: jest.Mock;
let refetch: jest.Mock;

beforeEach(() => {
  refetch = jest.fn().mockResolvedValue({});
  queryResult = { data: { projectMembers: MEMBERS }, loading: false, error: undefined };
  addMember = jest.fn().mockResolvedValue({ data: { addProjectMember: { id: 'u3', name: 'Beto', invited: true } } });
  removeMember = jest.fn().mockResolvedValue({ data: { removeProjectMember: true } });
  apolloMocks.useQuery.mockImplementation(() => ({ ...queryResult, refetch }));
  apolloMocks.useMutation.mockImplementation((mutation: any) => {
    const name = mutation.definitions.find((d: any) => d.kind === 'OperationDefinition')?.name?.value;
    return [name === 'AddProjectMember' ? addMember : removeMember, { loading: false }];
  });
});

describe('ProjectMembersPanel', () => {
  const renderPanel = (canManage = true, onClose = jest.fn()) => {
    render(<ProjectMembersPanel projectId="p1" projectName="Portal" canManage={canManage} onClose={onClose} />);
    return onClose;
  };

  it('lists the members with their role, and only invited ones can be removed', () => {
    renderPanel();

    const owner = screen.getByTestId('project-member-olga@example.com');
    expect(within(owner).getByText('Propietario')).toBeInTheDocument();
    expect(within(owner).getByText('Acceso a todo el espacio')).toBeInTheDocument();
    expect(within(owner).queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
    const guest = screen.getByTestId('project-member-gabi@example.com');
    expect(within(guest).getByText('Miembro')).toBeInTheDocument();
    expect(within(guest).getByRole('button', { name: 'Quitar a Gabi del proyecto' })).toBeInTheDocument();
  });

  it('invites by email and refreshes the list', async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Email de la persona a invitar'), { target: { value: ' beto@example.com ' } });
    fireEvent.click(screen.getByText('Invitar'));

    await waitFor(() => expect(addMember).toHaveBeenCalledWith({ variables: { input: { projectId: 'p1', email: 'beto@example.com' } } }));
    expect(await screen.findByText('Beto ahora tiene acceso a Portal.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it('explains when the person already reaches every project', async () => {
    addMember.mockResolvedValueOnce({ data: { addProjectMember: { id: 'u1', name: 'Olga', invited: false } } });
    renderPanel();

    fireEvent.change(screen.getByLabelText('Email de la persona a invitar'), { target: { value: 'olga@example.com' } });
    fireEvent.click(screen.getByText('Invitar'));

    expect(await screen.findByText('Olga ya tiene acceso a todos los proyectos del espacio.')).toBeInTheDocument();
  });

  it('shows the BFF message when inviting or removing fails', async () => {
    addMember.mockRejectedValueOnce(new Error('El usuario debe crear una cuenta antes de que puedas agregarlo.'));
    removeMember.mockRejectedValueOnce(new Error('Esa persona no es miembro de este proyecto.'));
    renderPanel();

    fireEvent.change(screen.getByLabelText('Email de la persona a invitar'), { target: { value: 'nadie@example.com' } });
    fireEvent.click(screen.getByText('Invitar'));
    expect(await screen.findByText('El usuario debe crear una cuenta antes de que puedas agregarlo.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar a Gabi del proyecto' }));
    expect(await screen.findByText('Esa persona no es miembro de este proyecto.')).toBeInTheDocument();
  });

  it('removes an invited member', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar a Gabi del proyecto' }));

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith({ variables: { input: { projectId: 'p1', userId: 'u2' } } }));
    expect(await screen.findByText('Gabi ya no tiene acceso a Portal.')).toBeInTheDocument();
  });

  it('is read-only for a MEMBER, shows loading and errors, and closes from the backdrop', () => {
    queryResult = { data: undefined, loading: true, error: undefined };
    const onClose = renderPanel(false);
    expect(screen.queryByLabelText('Email de la persona a invitar')).not.toBeInTheDocument();
    expect(screen.getByText('Cargando miembros...')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('project-members-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows why the list could not be loaded', () => {
    queryResult = { data: undefined, loading: false, error: new Error('No tienes acceso a este proyecto.') };
    renderPanel(false);
    expect(screen.getByText('No se pudo cargar la lista: No tienes acceso a este proyecto.')).toBeInTheDocument();
  });
});

describe('IssueDetailPanel', () => {
  const ISSUE = {
    id: 'i1', key: 'WEB-2', title: 'Login', description: 'Con email', acceptanceCriteria: 'Scenario: entra',
    status: 'IN_PROGRESS', priority: 'HIGH', type: 'STORY', storyPoints: 3, reporterName: 'Gabi', createdAt: '2026-11-15T12:00:00.000Z',
  };

  it('shows texts, author, date, epic and hours', () => {
    queryResult = {
      data: { issueWorkLogs: { totalHours: 2.5, entries: [{ id: 'l1', userName: 'Olga', hours: 2.5, note: 'Pair', loggedAt: '2026-11-15T13:00:00.000Z' }] } },
      loading: false,
    };
    render(<IssueDetailPanel projectId="p1" issue={ISSUE} epic={{ key: 'WEB-1', title: 'Autenticación' }} onClose={jest.fn()} />);

    expect(apolloMocks.useQuery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ variables: { projectId: 'p1', issueId: 'i1' } }));
    expect(screen.getByText('Gabi')).toBeInTheDocument();
    // toLocaleString may use special spaces, so the cell is compared as raw text.
    expect(screen.getByText('Creada').nextElementSibling?.textContent).toBe(formatDateTime(ISSUE.createdAt));
    expect(screen.getByTestId('issue-detail-epic')).toHaveTextContent('WEB-1 · Autenticación');
    expect(screen.getByText('Con email')).toBeInTheDocument();
    expect(screen.getByText('Scenario: entra')).toBeInTheDocument();
    expect(screen.getByTestId('issue-detail-hours')).toHaveTextContent('2.50 h');
    expect(screen.getByText('Pair')).toBeInTheDocument();
  });

  it('says what is missing and closes with Esc or the backdrop', () => {
    queryResult = { data: { issueWorkLogs: { totalHours: 0, entries: [] } }, loading: false };
    const onClose = jest.fn();
    render(
      <IssueDetailPanel
        projectId="p1"
        issue={{ ...ISSUE, description: '', acceptanceCriteria: '', reporterName: null, createdAt: 'not a date' }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Desconocido')).toBeInTheDocument();
    expect(screen.getByText('Sin fecha')).toBeInTheDocument();
    expect(screen.getByTestId('issue-detail-epic')).toHaveTextContent('Sin épica');
    expect(screen.getByText('Sin descripción.')).toBeInTheDocument();
    expect(screen.getByText('Sin criterios de aceptación.')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay horas registradas.')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('issue-detail-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows loading and errors of the hours', () => {
    queryResult = { data: undefined, loading: true };
    const first = render(<IssueDetailPanel projectId="p1" issue={ISSUE} onClose={jest.fn()} />);
    expect(screen.getByText('Cargando horas...')).toBeInTheDocument();
    first.unmount();

    queryResult = { data: undefined, loading: false, error: new Error('La historia seleccionada no pertenece a este proyecto.') };
    render(<IssueDetailPanel projectId="p1" issue={ISSUE} onClose={jest.fn()} />);
    expect(screen.getByText('No se pudieron cargar las horas: La historia seleccionada no pertenece a este proyecto.')).toBeInTheDocument();
  });

  it('formats dates defensively', () => {
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime('x')).toBe('');
  });
});

describe('BacklogPage selection and author', () => {
  const ISSUES = [
    { id: 'i1', key: 'WEB-1', title: 'Login', status: 'TODO', priority: 'HIGH', type: 'STORY', storyPoints: 3, reporterName: 'Gabi' },
  ];

  it('shows the author and opens the detail with a click or Enter, but not from the sprint select', () => {
    const onSelectIssue = jest.fn();
    render(
      <BacklogPage
        issues={ISSUES}
        sprints={[{ id: 's1', name: 'Sprint 1', status: 'PLANNED' }]}
        onOpenCreateModal={jest.fn()}
        onOpenAiDrawer={jest.fn()}
        onAssignIssue={jest.fn()}
        onSelectIssue={onSelectIssue}
      />,
    );
    const row = screen.getByRole('button', { name: 'Ver detalle de WEB-1' });
    expect(within(row).getByText('Gabi')).toHaveClass('issue-author');

    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: 'a' });
    fireEvent.click(screen.getByLabelText('Sprint de WEB-1'));

    expect(onSelectIssue).toHaveBeenCalledTimes(2);
    expect(onSelectIssue).toHaveBeenCalledWith('i1');
  });

  it('rows are plain (not buttons) without a selection handler', () => {
    render(<BacklogPage issues={ISSUES} onOpenCreateModal={jest.fn()} onOpenAiDrawer={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Ver detalle de WEB-1' })).not.toBeInTheDocument();
  });
});
