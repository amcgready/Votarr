// src/tests/integration/StateManagement.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { RealtimeProvider, useRealtime } from '@/contexts/RealtimeContext';
import { VotingProvider, useVoting } from '@/contexts/VotingContext';
import { mockSessionData, mockQueues } from '../fixtures/testData';

describe('State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test('manages voting state across components', async () => {
    const wrapper = ({ children }) => (
      <RealtimeProvider>
        <VotingProvider>{children}</VotingProvider>
      </RealtimeProvider>
    );

    const { result } = renderHook(() => useVoting(), { wrapper });

    await act(async () => {
      result.current.updateQueue(mockQueues.mainQueue, mockQueues.maybeQueue);
    });

    expect(result.current.mainQueue).toEqual(mockQueues.mainQueue);
    expect(result.current.maybeQueue).toEqual(mockQueues.maybeQueue);
  });

  test('synchronizes session state across realtime updates', async () => {
    const wrapper = ({ children }) => (
      <RealtimeProvider>
        <VotingProvider>{children}</VotingProvider>
      </RealtimeProvider>
    );

    const { result } = renderHook(() => useRealtime(), { wrapper });

    await act(async () => {
      result.current.updateSessionState(mockSessionData);
    });

    expect(result.current.sessionState).toEqual(mockSessionData);
  });
});
