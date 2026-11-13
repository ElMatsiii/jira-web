import React, { useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { CreateIssueModal } from './components/CreateIssueModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { BacklogPage, Issue } from './pages/BacklogPage';
import { BoardPage } from './pages/BoardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TimelinePage } from './pages/TimelinePage';
import {
  ADD_WORKSPACE_MEMBER,
  ASSIGN_ISSUES_TO_SPRINT,
  AI_DECOMPOSE_EPIC,
  AI_IMPROVE_STORY,
  AI_BREAKDOWN_TASK,
  COMPLETE_SPRINT,
  CREATE_ISSUE,
  CREATE_PROJECT,
  CREATE_SPRINT,
  GET_BACKLOG,
  GET_ME,
  GET_SPRINTS,
  GET_WORKSPACE_PROJECTS,
  START_SPRINT,
  UPDATE_ISSUE_STATUS,
} from './graphql/client';

type Tab = 'backlog' | 'board' | 'timeline' | 'analytics';
interface Workspace { id: string; name: string; role: string }
interface Project { id: string; workspaceId: string; name: string; key: string; description: string }
interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

export const App: React.FC = () => {
  const client = useApolloClient();
  const [token, setToken] = useState(() => window.localStorage.getItem('jira-ai-token'));
  const [tab, setTab] = useState<Tab>('backlog');
  const [workspaceId, setWorkspaceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const meQuery = useQuery(GET_ME, { skip: !token, fetchPolicy: 'cache-and-network' });
  const workspaces: Workspace[] = meQuery.data?.myWorkspaces || [];
  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
  useEffect(() => {
    if (!workspaceId && workspaces.length) setWorkspaceId(workspaces[0].id);
    if (workspaceId && !workspaces.some((workspace) => workspace.id === workspaceId)) {
      setWorkspaceId(workspaces[0]?.id || '');
      setProjectId('');
    }
  }, [workspaceId, workspaces]);

  const projectsQuery = useQuery(GET_WORKSPACE_PROJECTS, {
    variables: { workspaceId },
    skip: !token || !workspaceId,
    fetchPolicy: 'cache-and-network',
  });
  const projects: Project[] = projectsQuery.data?.workspaceProjects || [];
  useEffect(() => {
    if (projectId && !projects.some((project) => project.id === projectId)) setProjectId('');
  }, [projectId, projects]);
  const project = projects.find((item) => item.id === projectId);

  const issuesQuery = useQuery(GET_BACKLOG, {
    variables: { projectId },
    skip: !token || !projectId,
    fetchPolicy: 'cache-and-network',
  });
  const sprintsQuery = useQuery(GET_SPRINTS, {
    variables: { projectId },
    skip: !token || !projectId,
    fetchPolicy: 'cache-and-network',
  });
  const issues: Issue[] = issuesQuery.data?.listIssues || [];
  const sprints: Sprint[] = sprintsQuery.data?.listSprints || [];
  const activeSprint = useMemo(() => sprints.find((sprint) => sprint.status === 'ACTIVE'), [sprints]);
  const sprintIssues = activeSprint ? issues.filter((issue) => issue.sprintId === activeSprint.id) : [];

  const [createProject] = useMutation(CREATE_PROJECT);
  const [addMember] = useMutation(ADD_WORKSPACE_MEMBER);
  const [createIssue] = useMutation(CREATE_ISSUE);
  const [updateIssueStatus] = useMutation(UPDATE_ISSUE_STATUS);
  const [assignIssuesToSprint] = useMutation(ASSIGN_ISSUES_TO_SPRINT);
  const [createSprint] = useMutation(CREATE_SPRINT);
  const [startSprint] = useMutation(START_SPRINT);
  const [completeSprint] = useMutation(COMPLETE_SPRINT);
  const [decomposeEpic] = useMutation(AI_DECOMPOSE_EPIC);
  const [improveStory] = useMutation(AI_IMPROVE_STORY);
  const [breakdownTask] = useMutation(AI_BREAKDOWN_TASK);

  const logout = async () => {
    window.localStorage.removeItem('jira-ai-token');
    setToken(null);
    setWorkspaceId('');
    setProjectId('');
    await client.clearStore();
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setErrorMessage('');
    try {
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'La operación no pudo completarse.');
      throw error;
    }
  };

  if (!token) return <AuthPage onAuthenticated={setToken} />;
  if (meQuery.error) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>No se pudo validar la sesión</h1>
          <p>{meQuery.error.message}. Inicia sesión nuevamente cuando el servidor esté disponible.</p>
          <button className="btn btn-primary" onClick={logout}>Iniciar sesión</button>
        </div>
      </main>
    );
  }
  if (meQuery.loading && !meQuery.data) {
    return <main className="auth-page"><div className="auth-card">Cargando tu espacio de trabajo...</div></main>;
  }

  const handleCreateProject = () => runAction(async () => {
    const response = await createProject({
      variables: { input: { workspaceId, name: projectName, key: projectKey.toUpperCase(), description: '' } },
    });
    const created: Project = response.data.createProject;
    await projectsQuery.refetch();
    setProjectId(created.id);
    setProjectName('');
    setProjectKey('');
    setShowProjectForm(false);
  });

  const handleAddMember = () => runAction(async () => {
    await addMember({ variables: { input: { workspaceId, email: memberEmail } } });
    setMemberEmail('');
  });

  const handleCreateIssue = (newIssue: {
    title: string; description: string; type: string; priority: string; storyPoints: number;
    acceptanceCriteria: string;
  }) => runAction(async () => {
    const type = ({ STORY: 1, TASK: 2, BUG: 3, EPIC: 4 } as Record<string, number>)[newIssue.type];
    const priority = ({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as Record<string, number>)[newIssue.priority];
    await createIssue({
      variables: {
        input: { projectId, ...newIssue, type, priority },
      },
    });
    await issuesQuery.refetch();
  });

  const handleUpdateStatus = (id: string, status: string) => runAction(async () => {
    await updateIssueStatus({ variables: { input: { id, status } } });
    await issuesQuery.refetch();
  });

  const handleAssignIssue = (id: string, sprintId: string) => runAction(async () => {
    await assignIssuesToSprint({ variables: { input: { issueIds: [id], sprintId } } });
    await issuesQuery.refetch();
    await sprintsQuery.refetch();
  });

  const handleCreateSprint = (input: { name: string; goal: string; startDate: string; endDate: string }) =>
    runAction(async () => {
      await createSprint({
        variables: {
          input: {
            projectId,
            name: input.name,
            goal: input.goal,
            startDate: new Date(`${input.startDate}T00:00:00`).toISOString(),
            endDate: new Date(`${input.endDate}T23:59:59`).toISOString(),
          },
        },
      });
      await sprintsQuery.refetch();
    });

  const handleStartSprint = (id: string) => runAction(async () => {
    await startSprint({ variables: { id } });
    await sprintsQuery.refetch();
  });

  const handleCompleteSprint = (id: string) => runAction(async () => {
    await completeSprint({ variables: { id } });
    await sprintsQuery.refetch();
  });

  const handleDecomposeEpic = async (epicTitle: string, epicDescription: string) => {
    const response = await decomposeEpic({
      variables: {
        input: { projectId, projectKey: project?.key, epicTitle, epicDescription },
      },
    });
    return response.data?.aiDecomposeEpic;
  };

  const handleImproveStory = async (input: { title: string; description: string; type: string }) => {
    const response = await improveStory({
      variables: { input: { ...input, projectId } },
    });
    const suggestion = response.data?.aiImproveStory;
    if (!suggestion) throw new Error('El agente no devolvió una propuesta para esta historia.');
    return suggestion;
  };

  const handleBreakdownTask = async (input: { title: string; description?: string }) => {
    const response = await breakdownTask({
      variables: { input: { ...input, projectId } },
    });
    const result = response.data?.aiBreakdownTask;
    if (!result) throw new Error('El agente no devolvió subtareas para esta incidencia.');
    return result;
  };

  const handleCreateSuggestedStory = (story: {
    title: string;
    description: string;
    type: string;
    estimatedStoryPoints: number;
    acceptanceCriteriaGherkin: string;
  }) => runAction(async () => {
    const type = story.type === 'TASK' ? 2 : 1;
    await createIssue({
      variables: {
        input: {
          projectId,
          title: story.title,
          description: story.description,
          type,
          priority: 2,
          storyPoints: story.estimatedStoryPoints,
          acceptanceCriteria: story.acceptanceCriteriaGherkin,
        },
      },
    });
    await issuesQuery.refetch();
  });

  const queryError = issuesQuery.error || sprintsQuery.error || projectsQuery.error;

  return (
    <div className="app-layout">
      <Navbar
        currentTab={tab}
        onSelectTab={setTab}
        onOpenCreateModal={() => setIssueModalOpen(true)}
        onToggleAiDrawer={() => setAiDrawerOpen((open) => !open)}
        isAiDrawerOpen={aiDrawerOpen}
        userName={meQuery.data?.me?.name}
        onLogout={logout}
        canCreateIssue={Boolean(projectId)}
        projectName={project?.name}
        projectKey={project?.key}
        workspaceName={activeWorkspace?.name}
      />
      <div className="app-main-viewport">
        <section className="project-toolbar">
          <label>
            <span>Espacio</span>
            <select className="form-select" value={workspaceId} onChange={(event) => { setWorkspaceId(event.target.value); setProjectId(''); }}>
              {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role}</option>)}
            </select>
          </label>
          <label>
            <span>Proyecto</span>
            <select className="form-select" value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={!projects.length}>
              <option value="">Selecciona un proyecto</option>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.key} · {item.name}</option>)}
            </select>
          </label>
          {['OWNER', 'ADMIN'].includes(activeWorkspace?.role || '') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProjectForm((shown) => !shown)} disabled={!workspaceId}>+ Proyecto</button>
          )}
          {['OWNER', 'ADMIN'].includes(activeWorkspace?.role || '') && (
            <form className="member-form" onSubmit={(event) => { event.preventDefault(); void handleAddMember(); }}>
              <input className="form-input" type="email" placeholder="Agregar miembro por email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} aria-label="Email del nuevo miembro" />
              <button className="btn btn-secondary btn-sm" type="submit" disabled={!memberEmail.trim()}>Invitar</button>
            </form>
          )}
        </section>
        {showProjectForm && (
          <form className="project-create-form" onSubmit={(event) => { event.preventDefault(); void handleCreateProject(); }}>
            <input className="form-input" placeholder="Nombre del proyecto" required value={projectName} onChange={(event) => setProjectName(event.target.value)} />
            <input className="form-input project-key-input" placeholder="CLAVE" required maxLength={10} value={projectKey} onChange={(event) => setProjectKey(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={!projectName.trim() || projectKey.length < 2}>Crear</button>
          </form>
        )}
        {(errorMessage || queryError) && (
          <div className="app-error" role="alert">
            {errorMessage || queryError?.message}
            <button type="button" onClick={() => { setErrorMessage(''); void issuesQuery.refetch(); void sprintsQuery.refetch(); }}>Reintentar</button>
          </div>
        )}
        {!projectId ? (
          <main className="main-content empty-project-state">
            <h1>{projects.length ? 'Selecciona un proyecto' : 'Crea el primer proyecto de tu equipo'}</h1>
            <p>Los proyectos, historias y actividad son compartidos con los miembros de este espacio de trabajo.</p>
            {!projects.length && <button className="btn btn-primary" onClick={() => setShowProjectForm(true)}>Crear proyecto</button>}
          </main>
        ) : (
          <>
            {tab === 'backlog' && (
              <BacklogPage
                issues={issues}
                sprints={sprints}
                loading={issuesQuery.loading && !issuesQuery.data}
                onOpenCreateModal={() => setIssueModalOpen(true)}
                onOpenAiDrawer={() => setAiDrawerOpen(true)}
                onAssignIssue={handleAssignIssue}
              />
            )}
            {tab === 'board' && (
              <BoardPage
                issues={sprintIssues}
                loading={issuesQuery.loading && !issuesQuery.data}
                onUpdateStatus={handleUpdateStatus}
                sprintName={activeSprint?.name}
              />
            )}
            {tab === 'timeline' && (
              <TimelinePage
                sprints={sprints}
                loading={sprintsQuery.loading && !sprintsQuery.data}
                onCreateSprint={handleCreateSprint}
                onStartSprint={handleStartSprint}
                onCompleteSprint={handleCompleteSprint}
              />
            )}
            {tab === 'analytics' && (
              <AnalyticsPage
                projectId={projectId}
                sprint={activeSprint || null}
                issues={issues}
              />
            )}
          </>
        )}
      </div>
      <CreateIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onCreate={handleCreateIssue}
        onImprove={handleImproveStory}
        onBreakdownTask={projectId ? handleBreakdownTask : undefined}
      />
      {projectId && (
        <AIAssistantDrawer
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          onDecomposeEpic={handleDecomposeEpic}
          onCreateStory={handleCreateSuggestedStory}
        />
      )}
    </div>
  );
};

export default App;
