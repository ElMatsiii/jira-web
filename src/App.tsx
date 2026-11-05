import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Navbar } from './components/Navbar';
import { CreateIssueModal } from './components/CreateIssueModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { BacklogPage, Issue } from './pages/BacklogPage';
import { BoardPage } from './pages/BoardPage';
import { AnalyticsPage, BurndownData } from './pages/AnalyticsPage';
import {
  GET_BACKLOG,
  CREATE_ISSUE,
  UPDATE_ISSUE_STATUS,
  AI_DECOMPOSE_EPIC,
  GET_BURNDOWN_ANALYTICS,
} from './graphql/client';

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'issue-1',
    key: 'JIRA-101',
    title: 'Autenticación con OAuth2 y JWT',
    description: 'Implementar flujo de inicio de sesión seguro en el backend',
    status: 'DONE',
    priority: 'HIGH',
    type: 'STORY',
    storyPoints: 5,
  },
  {
    id: 'issue-2',
    key: 'JIRA-102',
    title: 'Migración a PostgreSQL con índices optimizados',
    description: 'Mejorar el tiempo de consulta en la tabla de incidencias',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    type: 'TASK',
    storyPoints: 3,
  },
  {
    id: 'issue-3',
    key: 'JIRA-103',
    title: 'Fix: Timeout en el consumidor de Kafka',
    description: 'Corregir el retraso en el procesamiento de eventos de métricas',
    status: 'IN_REVIEW',
    priority: 'CRITICAL',
    type: 'BUG',
    storyPoints: 2,
  },
  {
    id: 'issue-4',
    key: 'JIRA-104',
    title: 'Épica: Motor de Estimación con Gemini 2.0 Flash',
    description: 'Integrar el servidor MCP con el LLM en la nube',
    status: 'TODO',
    priority: 'HIGH',
    type: 'EPIC',
    storyPoints: 8,
  },
];

export const INITIAL_BURNDOWN: BurndownData = {
  sprintId: 'sprint-active-1',
  velocity: 32,
  idealBurndown: [40, 32, 24, 16, 8, 0],
  actualBurndown: [40, 36, 28, 20, 12, 0],
  blockedCount: 0,
  healthStatus: 'ON_TRACK',
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'backlog' | 'board' | 'analytics'>('backlog');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [localIssues, setLocalIssues] = useState<Issue[]>(INITIAL_ISSUES);

  // GraphQL hooks with resilient fallbacks
  const { data: backlogData, loading: backlogLoading } = useQuery(GET_BACKLOG, {
    variables: { projectId: 'a0000000-0000-0000-0000-000000000001' },
    onError: () => {
      // Fallback silently to local state when BFF is offline during development
    },
  });

  const { data: analyticsData } = useQuery(GET_BURNDOWN_ANALYTICS, {
    variables: { sprintId: 'b0000000-0000-0000-0000-000000000001' },
    onError: () => {},
  });

  const [createIssueMutation] = useMutation(CREATE_ISSUE);
  const [updateIssueStatusMutation] = useMutation(UPDATE_ISSUE_STATUS);
  const [aiDecomposeEpicMutation] = useMutation(AI_DECOMPOSE_EPIC);

  // Combine GraphQL data or fallback to local issues
  const issues: Issue[] = backlogData?.listIssues?.length
    ? backlogData.listIssues
    : localIssues;

  const burndown: BurndownData = analyticsData?.getBurndownAnalytics || INITIAL_BURNDOWN;

  const handleCreateIssue = async (newIssue: {
    title: string;
    description: string;
    type: string;
    priority: string;
    storyPoints: number;
  }) => {
    try {
      await createIssueMutation({
        variables: {
          input: {
            projectId: 'a0000000-0000-0000-0000-000000000001',
            ...newIssue,
          },
        },
      });
    } catch {
      // Fallback local update
      const key = `JIRA-${100 + localIssues.length + 1}`;
      const created: Issue = {
        id: `issue-local-${Date.now()}`,
        key,
        title: newIssue.title,
        description: newIssue.description,
        type: newIssue.type as any,
        priority: newIssue.priority as any,
        storyPoints: newIssue.storyPoints,
        status: 'TODO',
      };
      setLocalIssues((prev) => [created, ...prev]);
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    try {
      await updateIssueStatusMutation({
        variables: {
          input: {
            issueId,
            status: newStatus,
          },
        },
      });
    } catch {
      // Fallback local update
      setLocalIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus as any } : i))
      );
    }
  };

  const handleDecomposeEpic = async (epicTitle: string, epicDescription: string) => {
    try {
      const res = await aiDecomposeEpicMutation({
        variables: {
          input: {
            epicTitle,
            epicDescription,
          },
        },
      });
      return res.data?.aiDecomposeEpic;
    } catch {
      // Fallback rule-based estimation if offline
      return {
        epicTitle,
        stories: [
          {
            title: `Configurar arquitectura base para ${epicTitle}`,
            description: `Definición de modelos de datos, endpoints e interfaces iniciales para ${epicTitle}.`,
            type: 'STORY',
            estimatedStoryPoints: 5,
            acceptanceCriteriaGherkin: `Given el sistema inicializado\nWhen se invoca el módulo de ${epicTitle}\nThen responde dentro de SLA < 200ms`,
          },
          {
            title: `Implementar validaciones y reglas de negocio de ${epicTitle}`,
            description: `Manejo de errores, control de excepciones y auditoría de eventos.`,
            type: 'STORY',
            estimatedStoryPoints: 3,
            acceptanceCriteriaGherkin: `Given datos incompletos\nWhen se envían al servicio\nThen retorna código 400 Bad Request con detalles`,
          },
        ],
      };
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
      />

      {currentTab === 'backlog' && (
        <BacklogPage
          issues={issues}
          loading={backlogLoading && !localIssues.length}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        />
      )}

      {currentTab === 'board' && (
        <BoardPage
          issues={issues}
          loading={backlogLoading && !localIssues.length}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {currentTab === 'analytics' && (
        <AnalyticsPage data={burndown} />
      )}

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateIssue}
      />

      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onDecomposeEpic={handleDecomposeEpic}
      />
    </div>
  );
};

export default App;
