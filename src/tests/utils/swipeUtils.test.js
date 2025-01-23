// src/tests/utils/swipeUtils.test.js
import { detectSwipeDirection, handleSwipeComplete, areQueuesFull } from '@/utils/swipeUtils';
import { describe, test, expect, vi } from 'vitest';

describe('detectSwipeDirection', () => {
  describe('Horizontal Swipes', () => {
    test('detects right swipe when movement exceeds threshold', () => {
      expect(detectSwipeDirection(0, 0, 100, 10, 50)).toBe('right');
    });

    test('detects left swipe when movement exceeds threshold', () => {
      expect(detectSwipeDirection(100, 0, 0, 10, 50)).toBe('left');
    });

    test('returns null for small horizontal movements', () => {
      expect(detectSwipeDirection(0, 0, 30, 10, 50)).toBeNull();
    });
  });

  describe('Vertical Swipes', () => {
    test('detects up swipe when movement exceeds threshold', () => {
      expect(detectSwipeDirection(0, 100, 10, 0, 50)).toBe('up');
    });

    test('detects down swipe when movement exceeds threshold', () => {
      expect(detectSwipeDirection(0, 0, 10, 100, 50)).toBe('down');
    });

    test('returns null for small vertical movements', () => {
      expect(detectSwipeDirection(0, 0, 10, 30, 50)).toBeNull();
    });
  });

  describe('Diagonal Swipes', () => {
    test('prioritizes horizontal movement when horizontal > vertical', () => {
      expect(detectSwipeDirection(0, 0, 100, 50, 50)).toBe('right');
    });

    test('prioritizes vertical movement when vertical > horizontal', () => {
      expect(detectSwipeDirection(0, 0, 50, 100, 50)).toBe('down');
    });
  });

  describe('Edge Cases', () => {
    test('handles equal horizontal and vertical movement', () => {
      expect(detectSwipeDirection(0, 0, 100, 100, 50)).toBe('down');
    });

    test('handles negative coordinates', () => {
      expect(detectSwipeDirection(0, 0, -100, -10, 50)).toBe('left');
    });

    test('handles zero movement', () => {
      expect(detectSwipeDirection(0, 0, 0, 0, 50)).toBeNull();
    });
  });
});

describe('handleSwipeComplete', () => {
  const movie = { id: 1, title: 'Test Movie' };
  const onSwipe = vi.fn();
  const onQueuesFull = vi.fn();

  beforeEach(() => {
    onSwipe.mockClear();
    onQueuesFull.mockClear();
  });

  test('adds movie to mainQueue on right swipe', () => {
    const { mainQueue, maybeQueue } = handleSwipeComplete(
      'right',
      movie,
      [],
      [],
      onSwipe,
      onQueuesFull
    );

    expect(mainQueue).toHaveLength(1);
    expect(mainQueue[0]).toBe(movie);
    expect(maybeQueue).toHaveLength(0);
    expect(onSwipe).toHaveBeenCalledWith('right', movie);
  });

  test('adds movie to maybeQueue on up/down swipe', () => {
    const { mainQueue, maybeQueue } = handleSwipeComplete(
      'up',
      movie,
      [],
      [],
      onSwipe,
      onQueuesFull
    );

    expect(mainQueue).toHaveLength(0);
    expect(maybeQueue).toHaveLength(1);
    expect(maybeQueue[0]).toBe(movie);
    expect(onSwipe).toHaveBeenCalledWith('up', movie);
  });

  test('does not add to any queue on left swipe', () => {
    const { mainQueue, maybeQueue } = handleSwipeComplete(
      'left',
      movie,
      [],
      [],
      onSwipe,
      onQueuesFull
    );

    expect(mainQueue).toHaveLength(0);
    expect(maybeQueue).toHaveLength(0);
    expect(onSwipe).toHaveBeenCalledWith('left', movie);
  });

  test('calls onQueuesFull when both queues reach capacity', () => {
    const fullMainQueue = Array(4).fill({ id: 'old' });
    const fullMaybeQueue = [{ id: 'maybe1' }];

    const { mainQueue, maybeQueue } = handleSwipeComplete(
      'right',
      movie,
      fullMainQueue,
      fullMaybeQueue,
      onSwipe,
      onQueuesFull
    );

    // Add one more to maybeQueue to make it full
    const result = handleSwipeComplete(
      'up',
      { id: 'maybe2' },
      mainQueue,
      maybeQueue,
      onSwipe,
      onQueuesFull
    );

    expect(result.mainQueue).toHaveLength(5);
    expect(result.maybeQueue).toHaveLength(2);
    expect(onQueuesFull).toHaveBeenCalledWith(result.mainQueue, result.maybeQueue);
  });
});

describe('areQueuesFull', () => {
  test('returns true when both queues are at capacity', () => {
    const mainQueue = Array(5).fill({});
    const maybeQueue = Array(2).fill({});
    expect(areQueuesFull(mainQueue, maybeQueue)).toBe(true);
  });

  test('returns false when queues are not at capacity', () => {
    const mainQueue = Array(4).fill({});
    const maybeQueue = Array(1).fill({});
    expect(areQueuesFull(mainQueue, maybeQueue)).toBe(false);
  });

  test('handles undefined queues', () => {
    expect(areQueuesFull(undefined, undefined)).toBe(false);
  });
});
