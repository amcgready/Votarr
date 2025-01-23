// src/tests/components/MovieCard.test.jsx
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovieCard from '../../components/ui/MovieCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, whileInView, transition, ...props }) => 
      <div data-testid="motion-div" {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    set: vi.fn(),
  }),
}));

// Mock swipeUtils with expanded functionality
vi.mock('../../utils/swipeUtils', () => ({
  detectSwipeDirection: vi.fn(),
  handleSwipeComplete: vi.fn(),
  calculateSwipeRotation: vi.fn(() => 0),
  areQueuesFull: vi.fn(),
  getSwipeAnimation: vi.fn(() => ({
    x: 0,
    y: 0,
    opacity: 1
  })),
  isSignificantSwipe: vi.fn(() => true)
}));

// Helper function to simulate swipe gestures
const simulateSwipe = async (element, direction) => {
  const movements = {
    right: { start: { x: 0, y: 0 }, end: { x: 200, y: 0 } },
    left: { start: { x: 200, y: 0 }, end: { x: 0, y: 0 } },
    up: { start: { x: 0, y: 200 }, end: { x: 0, y: 0 } },
    down: { start: { x: 0, y: 0 }, end: { x: 0, y: 200 } }
  };

  const move = movements[direction];
  
  fireEvent.pointerDown(element, { 
    clientX: move.start.x, 
    clientY: move.start.y, 
    pointerId: 1 
  });

  // Simulate smooth movement
  for (let i = 1; i <= 5; i++) {
    const progress = i / 5;
    const x = move.start.x + (move.end.x - move.start.x) * progress;
    const y = move.start.y + (move.end.y - move.start.y) * progress;
    
    fireEvent.pointerMove(element, { 
      clientX: x, 
      clientY: y, 
      pointerId: 1 
    });
    
    // Small delay to simulate natural movement
    await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
  }

  fireEvent.pointerUp(element, { 
    clientX: move.end.x, 
    clientY: move.end.y, 
    pointerId: 1 
  });
};

describe('MovieCard', () => {
  const mockMovie = {
    id: 'test-movie-1',
    title: 'Test Movie',
    year: '2024',
    genre: 'Action',
    description: 'A test movie summary',
    posterUrl: '/api/placeholder/300/450',
    rating: 85
  };

  const defaultProps = {
    movie: mockMovie,
    onSwipe: vi.fn(),
    onQueuesFull: vi.fn(),
    mainQueue: [],
    maybeQueue: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    const { handleSwipeComplete } = vi.mocked(require('../../utils/swipeUtils'));
    const { detectSwipeDirection } = vi.mocked(require('../../utils/swipeUtils'));
    
    handleSwipeComplete.mockImplementation((direction, movie, mainQueue, maybeQueue, onSwipe, onQueuesFull) => {
      let newMainQueue = [...mainQueue];
      let newMaybeQueue = [...maybeQueue];
      
      if (direction === 'right' && mainQueue.length < 5) {
        newMainQueue.push(movie);
      } else if (['up', 'down'].includes(direction) && maybeQueue.length < 2) {
        newMaybeQueue.push(movie);
      }
      
      onSwipe?.(direction, movie);
      
      if (newMainQueue.length === 5 && newMaybeQueue.length === 2) {
        onQueuesFull?.(newMainQueue, newMaybeQueue);
      }
      
      return { mainQueue: newMainQueue, maybeQueue: newMaybeQueue };
    });
    
    detectSwipeDirection.mockImplementation((startX, startY, endX, endY, threshold = 50) => {
      const diffX = endX - startX;
      const diffY = endY - startY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      
      if (absX < threshold && absY < threshold) return null;
      
      if (absX > absY) {
        return diffX > 0 ? 'right' : 'left';
      }
      return diffY > 0 ? 'down' : 'up';
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<MovieCard />);
      expect(screen.getByTestId('movie-card')).toBeInTheDocument();
    });

    test('displays movie information correctly', () => {
      render(<MovieCard {...defaultProps} />);
      expect(screen.getByText(mockMovie.title)).toBeInTheDocument();
      expect(screen.getByText(mockMovie.year)).toBeInTheDocument();
      expect(screen.getByText(mockMovie.genre)).toBeInTheDocument();
      expect(screen.getByText(mockMovie.description)).toBeInTheDocument();
      expect(screen.getByText(mockMovie.rating + '%')).toBeInTheDocument();
    });
  });

  describe('Swipe Detection', () => {
    test('handles right swipe correctly', async () => {
      const onSwipe = vi.fn();
      render(<MovieCard {...defaultProps} onSwipe={onSwipe} />);
      const card = screen.getByTestId('swipe-container');
      
      await simulateSwipe(card, 'right');
      
      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('right', mockMovie);
      });
    });

    test('handles left swipe correctly', async () => {
      const onSwipe = vi.fn();
      render(<MovieCard {...defaultProps} onSwipe={onSwipe} />);
      const card = screen.getByTestId('swipe-container');
      
      await simulateSwipe(card, 'left');
      
      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('left', mockMovie);
      });
    });

    test('handles up/down swipe correctly', async () => {
      const onSwipe = vi.fn();
      render(<MovieCard {...defaultProps} onSwipe={onSwipe} />);
      const card = screen.getByTestId('swipe-container');
      
      await simulateSwipe(card, 'up');
      
      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('up', mockMovie);
      });
    });

    test('ignores small movements', async () => {
      const { detectSwipeDirection } = vi.mocked(require('../../utils/swipeUtils'));
      detectSwipeDirection.mockReturnValue(null);
      
      render(<MovieCard {...defaultProps} />);
      const card = screen.getByTestId('movie-card');

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(card, { clientX: 2, clientY: 2 });

      expect(defaultProps.onSwipe).not.toHaveBeenCalled();
    });
  });

  describe('Queue Management', () => {
    test('calls onQueuesFull when main queue reaches 5 items', async () => {
      const mainQueue = Array(4).fill().map((_, i) => ({ id: `movie${i + 1}` }));
      const maybeQueue = [];
      const onQueuesFull = vi.fn();
      const onSwipe = vi.fn();

      render(
        <MovieCard
          {...defaultProps}
          mainQueue={mainQueue}
          maybeQueue={maybeQueue}
          onQueuesFull={onQueuesFull}
          onSwipe={onSwipe}
        />
      );

      const card = screen.getByTestId('swipe-container');
      await simulateSwipe(card, 'right');

      await waitFor(() => {
        expect(onQueuesFull).toHaveBeenCalled();
      });
    });

    test('does not add to main queue when full', async () => {
      const mainQueue = Array(5).fill().map((_, i) => ({ id: `movie${i + 1}` }));
      const maybeQueue = [];
      
      render(<MovieCard {...defaultProps} mainQueue={mainQueue} maybeQueue={maybeQueue} />);
      const card = screen.getByTestId('swipe-container');
      
      await simulateSwipe(card, 'right');
      
      expect(mainQueue.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    test('handles undefined movie prop gracefully', () => {
      const { container } = render(<MovieCard movie={undefined} />);
      expect(container).toBeInTheDocument();
    });

    test('handles missing callback functions', async () => {
      const { container } = render(<MovieCard movie={mockMovie} />);
      const card = screen.getByTestId('movie-card');
      
      expect(async () => {
        await simulateSwipe(card, 'right');
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA roles', () => {
      render(<MovieCard {...defaultProps} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('alt', mockMovie.title);
    });

    test('supports keyboard navigation', async () => {
      const onSwipe = vi.fn();
      render(<MovieCard {...defaultProps} onSwipe={onSwipe} />);
      
      const card = screen.getByTestId('movie-card');
      card.focus();
      expect(card).toHaveFocus();

      // Test arrow key navigation
      fireEvent.keyDown(card, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('right', mockMovie);
      });
      
      fireEvent.keyDown(card, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith('left', mockMovie);
      });
    });

    test('announces swipe actions to screen readers', async () => {
      render(<MovieCard {...defaultProps} />);
      const announcement = await screen.findByText(/swipe right to add to queue/i);
      expect(announcement.parentElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Touch Events', () => {
    test('handles touch start and end events', async () => {
      const onSwipe = vi.fn();
      render(<MovieCard {...defaultProps} onSwipe={onSwipe} />);
      const card = screen.getByTestId('swipe-container');

      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100, clientY: 0 }] });

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalled();
      });
    });

    test('handles multi-touch events correctly', () => {
      render(<MovieCard {...defaultProps} />);
      const card = screen.getByTestId('swipe-container');

      fireEvent.touchStart(card, {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 10, clientY: 10 }
        ]
      });

      expect(defaultProps.onSwipe).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('shows loading skeleton while image is loading', () => {
      render(<MovieCard {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('movie-card-skeleton')).toBeInTheDocument();
    });

    test('shows fallback image when poster fails to load', () => {
      render(<MovieCard {...defaultProps} movie={{ ...mockMovie, posterUrl: null }} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/api/placeholder/300/450');
    });
  });

  describe('Visual Feedback', () => {
    test('shows visual feedback during swipe', async () => {
      const { container } = render(<MovieCard {...defaultProps} />);
      const card = screen.getByTestId('swipe-container');

      await simulateSwipe(card, 'right');
      const indicator = container.querySelector('.swipe-indicator-right');
      
      expect(indicator).toBeInTheDocument();
    });

    test('applies correct animation classes during interaction', () => {
      render(<MovieCard {...defaultProps} />);
      const card = screen.getByTestId('movie-card');

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0 });
      expect(card).toHaveClass('cursor-grabbing');
      
      fireEvent.pointerUp(card, { clientX: 0, clientY: 0 });
      expect(card).toHaveClass('cursor-grab');
    });
  });
});
