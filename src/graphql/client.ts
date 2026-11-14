import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id name email }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { id name email }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me { id name email }
    myWorkspaces { id name role }
  }
`;

export const GET_WORKSPACE_PROJECTS = gql`
  query WorkspaceProjects($workspaceId: String!) {
    workspaceProjects(workspaceId: $workspaceId) {
      id
      workspaceId
      name
      key
      description
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      workspaceId
      name
      key
      description
    }
  }
`;

export const ADD_WORKSPACE_MEMBER = gql`
  mutation AddWorkspaceMember($input: AddWorkspaceMemberInput!) {
    addWorkspaceMember(input: $input) { id name email }
  }
`;

export const GET_SPRINTS = gql`
  query GetSprints($projectId: String!) {
    listSprints(projectId: $projectId) {
      id name goal status startDate endDate totalStoryPoints completedStoryPoints
    }
  }
`;

export const GET_PROJECT_WORK_LOGS = gql`
  query ProjectWorkLogs($projectId: String!) {
    projectWorkLogs(projectId: $projectId) {
      totalHours
      entries { id issueId issueKey issueTitle userName hours note loggedAt }
    }
  }
`;

export const LOG_WORK = gql`
  mutation LogWork($input: LogWorkInput!) {
    logWork(input: $input) { id issueId hours note loggedAt }
  }
`;

export const START_SPRINT = gql`
  mutation StartSprint($id: ID!) {
    startSprint(id: $id) { id status }
  }
`;

export const COMPLETE_SPRINT = gql`
  mutation CompleteSprint($id: ID!) {
    completeSprint(id: $id) { id status }
  }
`;

export const GET_BACKLOG = gql`
  query GetBacklog($projectId: String!) {
    listIssues(projectId: $projectId) {
      id
      key
      title
      description
      status
      priority
      type
      storyPoints
      sprintId
      assigneeId
      acceptanceCriteria
    }
  }
`;

export const GET_BURNDOWN_ANALYTICS = gql`
  query GetBurndownAnalytics($sprintId: String!) {
    getBurndownAnalytics(sprintId: $sprintId) {
      sprintId
      velocity
      idealBurndown
      actualBurndown
      blockedCount
      healthStatus
    }
  }
`;

export const CREATE_ISSUE = gql`
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      id
      key
      title
      status
      storyPoints
      priority
      type
    }
  }
`;

export const UPDATE_ISSUE_STATUS = gql`
  mutation UpdateIssueStatus($input: UpdateIssueStatusInput!) {
    updateIssueStatus(input: $input) {
      id
      status
    }
  }
`;

export const ASSIGN_ISSUES_TO_SPRINT = gql`
  mutation AssignIssuesToSprint($input: AssignIssuesToSprintInput!) {
    assignIssuesToSprint(input: $input) { id sprintId }
  }
`;

export const CREATE_SPRINT = gql`
  mutation CreateSprint($input: CreateSprintInput!) {
    createSprint(input: $input) {
      id
      name
      goal
      status
    }
  }
`;

export const AI_DECOMPOSE_EPIC = gql`
  mutation AiDecomposeEpic($input: DecomposeEpicInput!) {
    aiDecomposeEpic(input: $input) {
      epicTitle
      stories {
        title
        description
        type
        estimatedStoryPoints
        acceptanceCriteriaGherkin
      }
    }
  }
`;

export const AI_DIAGNOSE_METRICS = gql`
  mutation AiDiagnoseMetrics($input: DiagnoseMetricsInput!) {
    aiDiagnoseMetrics(input: $input) {
      sprintId healthStatus summary rootCauses recommendations
    }
  }
`;

export const AI_IMPROVE_STORY = gql`
  mutation AiImproveStory($input: ImproveStoryInput!) {
    aiImproveStory(input: $input) {
      storyPoints
      confidence
      reasoning
      complexityFactors
      acceptanceCriteriaGherkin
    }
  }
`;

export const AI_BREAKDOWN_TASK = gql`
  mutation AiBreakdownTask($input: BreakdownTaskInput!) {
    aiBreakdownTask(input: $input) {
      parentTitle
      subtasks {
        title
        description
        type
        priority
        estimatedStoryPoints
        acceptanceCriteriaGherkin
      }
    }
  }
`;

export function createApolloClient(customUri?: string) {
  const uri = customUri || (typeof window !== 'undefined' && (window as any).__GRAPHQL_URL__) || 'http://localhost:4000/graphql';
  const fetchFn = (typeof window !== 'undefined' && window.fetch) || (typeof global !== 'undefined' && (global as any).fetch) || (globalThis as any).fetch || (() => Promise.resolve(new Response()));
  const authLink = setContext((_, { headers }) => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('jira-ai-token') : null;
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });
  return new ApolloClient({
    link: authLink.concat(new HttpLink({ uri, fetch: fetchFn as any })),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
