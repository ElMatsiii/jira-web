import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

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

export const GET_SPRINT_BOARD = gql`
  query GetSprintBoard($projectId: String!, $sprintId: String) {
    listIssues(projectId: $projectId, sprintId: $sprintId) {
      id
      key
      title
      status
      priority
      storyPoints
      assigneeId
    }
    listSprints(projectId: $projectId) {
      id
      name
      goal
      status
      totalStoryPoints
      completedStoryPoints
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

export const AI_PLAN_SPRINT = gql`
  mutation AiPlanSprint($input: PlanSprintInput!) {
    aiPlanSprint(input: $input) {
      sprintGoal
      allocatedStoryPoints
      recommendedIssueIds
      riskAssessment
    }
  }
`;

export const AI_DIAGNOSE_METRICS = gql`
  mutation AiDiagnoseMetrics($input: DiagnoseMetricsInput!) {
    aiDiagnoseMetrics(input: $input) {
      sprintId
      healthStatus
      summary
      rootCauses
      recommendations
    }
  }
`;

export function createApolloClient(customUri?: string) {
  const uri = customUri || (typeof window !== 'undefined' && (window as any).__GRAPHQL_URL__) || 'http://localhost:4000/graphql';
  const fetchFn = (typeof window !== 'undefined' && window.fetch) || (typeof global !== 'undefined' && (global as any).fetch) || (globalThis as any).fetch || (() => Promise.resolve(new Response()));
  return new ApolloClient({
    link: new HttpLink({ uri, fetch: fetchFn as any }),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
