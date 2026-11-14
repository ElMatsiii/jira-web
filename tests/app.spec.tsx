import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const renderApp = () => render(
  <ApolloProvider client={createApolloClient('http://localhost/graphql')}>
    <App />
  </ApolloProvider>,
);

const selectProject = async () => {
  fireEvent.change(await screen.findByLabelText('Proyecto'), { target: { value: 'project-1' } });
  await screen.findByText('PLAT-1');
};

describe('App', () => {
  let mutations: Record<string, jest.Mock>;

  beforeEach(() => {
    window.localStorage.clear();
    mutations = {};
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
        GetSprints: {
          listSprints: [sprint, {
            id: 'sprint-2', name: 'Sprint 2', goal: 'Siguiente', status: 'PLANNED',
            startDate: '2026-11-16T00:00:00.000Z', endDate: '2026-11-30T23:59:59.000Z',
            totalStoryPoints: 0, completedStoryPoints: 0,
          }],
        },
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
      mutations[name] = mutations[name] || jest.fn().mockResolvedValue({ data: resultByName[name] });
      return [mutations[name], { loading: false, error: undefined }];
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

  it('creates a project and invites a member as workspace owner', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    renderApp();

    fireEvent.click(await screen.findByText('+ Proyecto'));
    fireEvent.change(screen.getByPlaceholderText('Nombre del proyecto'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByPlaceholderText('CLAVE'), { target: { value: 'new-1' } });
    fireEvent.click(screen.getByText('Crear'));
    await waitFor(() => expect(mutations.CreateProject).toHaveBeenCalledWith({
      variables: { input: { workspaceId: 'workspace-1', name: 'Nuevo', key: 'NEW1', description: '' } },
    }));

    fireEvent.change(screen.getByLabelText('Email del nuevo miembro'), { target: { value: 'member@example.com' } });
    fireEvent.click(screen.getByText('Invitar'));
    await waitFor(() => expect(mutations.AddWorkspaceMember).toHaveBeenCalledWith({
      variables: { input: { workspaceId: 'workspace-1', email: 'member@example.com' } },
    }));
  });

  it('creates an issue from the modal sending numeric type and priority', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    renderApp();
    await selectProject();

    fireEvent.click(screen.getByTestId('btn-create-issue'));
    fireEvent.change(screen.getByTestId('input-issue-title'), { target: { value: 'Corregir login' } });
    fireEvent.change(screen.getByTestId('select-issue-type'), { target: { value: 'BUG' } });
    fireEvent.change(screen.getByTestId('select-issue-priority'), { target: { value: 'CRITICAL' } });
    fireEvent.click(screen.getByTestId('btn-submit-issue'));

    await waitFor(() => expect(mutations.CreateIssue).toHaveBeenCalled());
    expect(mutations.CreateIssue.mock.calls[0][0].variables.input).toMatchObject({
      projectId: 'project-1', title: 'Corregir login', type: 3, priority: 4,
    });
  });

  it('asks the AI to segment a task and to improve a story from the issue modal', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    renderApp();
    await selectProject();

    fireEvent.click(screen.getByTestId('btn-create-issue'));
    fireEvent.change(screen.getByTestId('input-issue-title'), { target: { value: 'Pagos' } });
    fireEvent.click(screen.getByText('Sugerir criterios y estimación con IA'));
    await waitFor(() => expect(mutations.AiImproveStory).toHaveBeenCalledWith({
      variables: { input: { title: 'Pagos', description: '', type: 'STORY', projectId: 'project-1' } },
    }));

    fireEvent.click(screen.getByText('Segmentar en subtareas con IA'));
    await waitFor(() => expect(mutations.AiBreakdownTask).toHaveBeenCalledWith({
      variables: { input: { title: 'Pagos', description: '', projectId: 'project-1' } },
    }));
  });

  it('assigns an issue to a sprint and starts and completes sprints', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    renderApp();
    await selectProject();

    fireEvent.change(screen.getByLabelText('Sprint de PLAT-1'), { target: { value: 'sprint-2' } });
    await waitFor(() => expect(mutations.AssignIssuesToSprint).toHaveBeenCalledWith({
      variables: { input: { issueIds: ['issue-1'], sprintId: 'sprint-2' } },
    }));

    fireEvent.click(screen.getByTestId('tab-timeline'));
    fireEvent.click(screen.getByText('Iniciar sprint'));
    await waitFor(() => expect(mutations.StartSprint).toHaveBeenCalledWith({ variables: { id: 'sprint-2' } }));
    fireEvent.click(screen.getByText('Completar sprint'));
    await waitFor(() => expect(mutations.CompleteSprint).toHaveBeenCalledWith({ variables: { id: 'sprint-1' } }));
  });

  it('shows mutation errors in the alert banner and clears the session on logout', async () => {
    window.localStorage.setItem('jira-ai-token', 'test-token');
    renderApp();
    await selectProject();
    mutations.UpdateIssueStatus.mockRejectedValueOnce(new Error('Transición no permitida'));

    fireEvent.click(screen.getByTestId('tab-board'));
    fireEvent.click(screen.getByTestId('btn-advance-PLAT-1'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Transición no permitida');
    fireEvent.click(screen.getByText('Reintentar'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Salir'));
    expect(await screen.findByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(window.localStorage.getItem('jira-ai-token')).toBeNull();
  });

  it('creates AI-suggested stories keeping their type and priority', async () => {
    const createIssueMock = jest.fn().mockResolvedValue({ data: { createIssue: { id: 'issue-9' } } });
    const defaultUseMutation = apolloMocks.useMutation.getMockImplementation()!;
    apolloMocks.useMutation.mockImplementation((mutation: any) => {
      const name = mutation.definitions.find((d: any) => d.kind === 'OperationDefinition')?.name?.value;
      if (name === 'CreateIssue') return [createIssueMock, { loading: false, error: undefined }];
      if (name === 'AiDecomposeEpic') {
        return [jest.fn().mockResolvedValue({
          data: {
            aiDecomposeEpic: {
              epicTitle: 'Pagos',
              stories: [
                { title: 'Fallo en webhook', description: 'Bug', type: 'BUG', priority: 'HIGH', estimatedStoryPoints: 2, acceptanceCriteriaGherkin: 'Given' },
                { title: 'Épica hija', description: 'Epic', type: 'EPIC', estimatedStoryPoints: '8', acceptanceCriteriaGherkin: 'Given' },
              ],
            },
          },
        }), { loading: false, error: undefined }];
      }
      return defaultUseMutation(mutation);
    });
    window.localStorage.setItem('jira-ai-token', 'test-token');
    render(
      <ApolloProvider client={createApolloClient('http://localhost/graphql')}>
        <App />
      </ApolloProvider>,
    );

    fireEvent.change(await screen.findByLabelText('Proyecto'), { target: { value: 'project-1' } });
    fireEvent.click(screen.getByTestId('btn-ai-assistant'));
    fireEvent.change(screen.getByTestId('input-ai-epic-title'), { target: { value: 'Pagos' } });
    fireEvent.click(screen.getByTestId('btn-ai-decompose-submit'));

    const createButtons = await screen.findAllByText('Crear historia');
    fireEvent.click(createButtons[0]);
    await waitFor(() => expect(createIssueMock).toHaveBeenCalledTimes(1));
    fireEvent.click(createButtons[1]);
    await waitFor(() => expect(createIssueMock).toHaveBeenCalledTimes(2));

    expect(createIssueMock.mock.calls[0][0].variables.input).toMatchObject({ type: 3, priority: 3, storyPoints: 2 });
    expect(createIssueMock.mock.calls[1][0].variables.input).toMatchObject({ type: 4, priority: 2, storyPoints: 8 });
  });
});
