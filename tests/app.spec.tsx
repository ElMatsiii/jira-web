import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../src/App';
import { createApolloClient } from '../src/graphql/client';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: jest.fn(),
    useMutation: jest.fn(),
  };
});

const apolloMocks = jest.requireMock('@apollo/client') as {
  useQuery: jest.Mock;
  useMutation: jest.Mock;
};

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    apolloMocks.useQuery.mockImplementation((query: any) => {
      const operation = query.definitions.find((definition: any) => definition.kind === 'OperationDefinition');
      const name = operation?.name?.value;
      const project = { id: 'project-1', workspaceId: 'workspace-1', name: 'Plataforma', key: 'PLAT', description: '' };
      const sprint = {
        id: 'sprint-1', name: 'Sprint 1', goal: 'Entrega inicial', status: 'ACTIVE',
        startDate: '2026-11-01T00:00:00.000Z', endDate: '2026-11-15T23:59:59.000Z',
        totalStoryPoints: 5, completedStoryPoints: 0,
      };
      const issue = {
        id: 'issue-1', key: 'PLAT-1', title: 'Crear tablero', description: 'Tablero del equipo',
        status: 'TODO', priority: 'MEDIUM', type: 'STORY', storyPoints: 5, sprintId: 'sprint-1',
      };
      const dataByName: Record<string, unknown> = {
        Me: { me: { id: 'user-1', name: 'Ana', email: 'ana@example.com' }, myWorkspaces: [{ id: 'workspace-1', name: 'Equipo Ana', role: 'OWNER' }] },
        WorkspaceProjects: { workspaceProjects: [project] },
        GetBacklog: { listIssues: [issue] },
        GetSprints: { listSprints: [sprint] },
        GetBurndownAnalytics: { getBurndownAnalytics: { sprintId: 'sprint-1', velocity: 5, idealBurndown: [5, 0], actualBurndown: [5, 2], blockedCount: 0, healthStatus: 'HEALTHY' } },
        ProjectWorkLogs: { projectWorkLogs: { totalHours: 0, entries: [] } },
      };
      return { data: dataByName[name] || null, loading: false, error: undefined, refetch: jest.fn().mockResolvedValue({}) };
    });
    apolloMocks.useMutation.mockImplementation((mutation: any) => {
      const operation = mutation.definitions.find((definition: any) => definition.kind === 'OperationDefinition');
      const name = operation?.name?.value;
      const resultByName: Record<string, unknown> = {
        Register: { register: { token: 'new-token', user: { id: 'user-1', name: 'Ana', email: 'ana@example.com' } } },
        Login: { login: { token: 'new-token', user: { id: 'user-1', name: 'Ana', email: 'ana@example.com' } } },
        CreateProject: { createProject: { id: 'project-2', workspaceId: 'workspace-1', name: 'Nuevo', key: 'NEW', description: '' } },
        CreateIssue: { createIssue: { id: 'issue-2', key: 'PLAT-2', title: 'Nueva historia' } },
        UpdateIssueStatus: { updateIssueStatus: { id: 'issue-1', status: 'IN_PROGRESS' } },
        CreateSprint: { createSprint: { id: 'sprint-2', name: 'Sprint 2', status: 'PLANNED' } },
        StartSprint: { startSprint: { id: 'sprint-1', status: 'ACTIVE' } },
        CompleteSprint: { completeSprint: { id: 'sprint-1', status: 'COMPLETED' } },
        AiDecomposeEpic: { aiDecomposeEpic: { epicTitle: 'Épica', stories: [] } },
        AiImproveStory: { aiImproveStory: { storyPoints: 3, acceptanceCriteriaGherkin: 'Given... Then...' } },
        AiBreakdownTask: { aiBreakdownTask: { parentTitle: 'Tarea', subtasks: [] } },
        AddWorkspaceMember: { addWorkspaceMember: { id: 'user-2', email: 'member@example.com' } },
      };
      return [jest.fn().mockResolvedValue({ data: resultByName[name] }), { loading: false, error: undefined }];
    });
  });

  it('requires an account before showing private project data', () => {
    render(
      <ApolloProvider client={createApolloClient('http://localhost/graphql')}>
        <App />
      </ApolloProvider>,
    );

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.queryByTestId('page-backlog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Crear una cuenta nueva'));
    expect(screen.getByText('Crea tu espacio de trabajo')).toBeInTheDocument();
  });

  it('creates a local account and loads the authenticated workspace', async () => {
    render(
      <ApolloProvider client={createApolloClient('http://localhost/graphql')}>
        <App />
      </ApolloProvider>,
    );
    fireEvent.click(screen.getByText('Crear una cuenta nueva'));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'secure-password' } });
    fireEvent.click(screen.getByText('Crear cuenta'));
    expect(await screen.findByLabelText('Proyecto')).toBeInTheDocument();
    expect(window.localStorage.getItem('jira-ai-token')).toBe('new-token');
  });

  it('createApolloClient should configure a GraphQL client', () => {
    const client = createApolloClient('http://test-server:4000/graphql');
    expect(client).toBeDefined();
    expect(client.link).toBeDefined();
  });

  it('lets an authenticated user select a project, create work, and navigate project views', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    render(
      <ApolloProvider client={createApolloClient('http://localhost/graphql')}>
        <App />
      </ApolloProvider>,
    );

    const projectSelect = await screen.findByLabelText('Proyecto');
    fireEvent.change(projectSelect, { target: { value: 'project-1' } });
    expect(await screen.findByText('PLAT-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-board'));
    expect(screen.getByTestId('page-board')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-advance-PLAT-1'));

    fireEvent.click(screen.getByTestId('tab-timeline'));
    expect(screen.getByTestId('page-timeline')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Sprint 1'), { target: { value: 'Sprint 2' } });
    fireEvent.click(screen.getByText('Crear sprint'));

    fireEvent.click(screen.getByTestId('tab-analytics'));
    expect(screen.getByTestId('page-analytics')).toBeInTheDocument();
  });
});
