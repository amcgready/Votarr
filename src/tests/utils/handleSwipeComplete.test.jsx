// src/tests/utils/handleSwipeComplete.test.js

import { describe, test, expect, vi } from 'vitest';
import { handleSwipeComplete } from '@/components/ui/MovieCard';

describe('handleSwipeComplete', () => {
  const mockMovie = { title: 'Test Movie' };
  let mainQueue, maybeQueue, onSwipe, onQueuesFull;

  beforeEach(() => {
    mainQueue = [];
    maybeQueue = [];
    onSwipe = vi.fn();
    onQueuesFull = vi.fn();
  });

  test('calls onSwipe with "right" and adds to mainQueue', () => {
    handleSwipeComplete('right', mockMovie, mainQueue, maybeQueue, onSwipe, onQueuesFull);
    expect(onSwipe).toHaveBeenCalledWith('right', mockMovie);
    expect(mainQueue).toContain(mockMovie);
  });

  test('calls onSwipe with "left" and does not add to mainQueue or maybeQueue', () => {
    handleSwipeComplete('left', mockMovie, mainQueue, maybeQueue, onSwipe, onQueuesFull);
    expect(onSwipe).toHaveBeenCalledWith('left', mockMovie);
    expect(mainQueue).toHaveLength(0);
    expect(maybeQueue).toHaveLength(0);
  });

  test('calls onSwipe with "up" and adds to maybeQueue', () => {
    handleSwipeComplete('up', mockMovie, mainQueue, maybeQueue, onSwipe, onQueuesFull);
    expect(onSwipe).toHaveBeenCalledWith('up', mockMovie);
    expect(maybeQueue).toContain(mockMovie);
  });

  test('calls onQueuesFull if mainQueue and maybeQueue reach capacity', () => {
    mainQueue = [1, 2, 3, 4];
    maybeQueue = [5, 6];
    handleSwipeComplete('right', mockMovie, mainQueue, maybeQueue, onSwipe, onQueuesFull);
    expect(onQueuesFull).toHaveBeenCalledWith(mainQueue, maybeQueue);
  });
});

