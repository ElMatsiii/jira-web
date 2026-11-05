import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../src/App';
import { createApolloClient } from '../src/graphql/client';

// Mock Apollo useQuery and useMutation
jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: jest.fn().mockReturnValue({
      data: null,
      loading: false,
      error: null,
    }),
    useMutation: jest.fn().mockReturnValue([
      jest.fn().mockRejectedValue(new Error('GraphQL mock rejection to trigger local state')),
      { loading: false, error: null },
    ]),
  };
});

describe('App Integration Suite', () => {
  it('should render App and switch tabs smoothly', () => {
    render(<App />);

    // Initially in Backlog tab
    expect(screen.getByTestId('page-backlog')).toBeInTheDocument();

    // Switch to Board
    fireEvent.click(screen.getByTestId('tab-board'));
    expect(screen.getByTestId('page-board')).toBeInTheDocument();

    // Switch to Analytics
    fireEvent.click(screen.getByTestId('tab-analytics'));
    expect(screen.getByTestId('page-analytics')).toBeInTheDocument();

    // Switch back to Backlog
    fireEvent.click(screen.getByTestId('tab-backlog'));
    expect(screen.getByTestId('page-backlog')).toBeInTheDocument();
  });

  it('should open and close Create Issue modal and AI drawer', async () => {
    render(<App />);

    // Open create modal
    fireEvent.click(screen.getByTestId('btn-create-issue'));
    expect(screen.getByTestId('create-issue-modal')).toBeInTheDocument();

    // Create a local issue
    fireEvent.change(screen.getByTestId('input-issue-title'), {
      target: { value: 'Nueva Tarea Local' },
    });
    fireEvent.click(screen.getByTestId('btn-submit-issue'));

    await waitFor(() => {
      expect(screen.queryByTestId('create-issue-modal')).not.toBeInTheDocument();
      expect(screen.getByText('Nueva Tarea Local')).toBeInTheDocument();
    });

    // Toggle AI drawer
    fireEvent.click(screen.getByTestId('btn-ai-assistant'));
    expect(screen.getByTestId('ai-drawer')).toBeInTheDocument();
  });

  it('createApolloClient should configure client with default or custom URI', () => {
    const client = createApolloClient('http://test-server:4000/graphql');
    expect(client).toBeDefined();
    expect(client.link).toBeDefined();
  });
});
