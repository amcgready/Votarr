// src/tests/ui/skeleton.test.jsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  describe('Rendering', () => {
    test('renders correctly with default props', () => {
      render(<Skeleton data-testid="skeleton-default" />);
      const skeleton = screen.getByTestId('skeleton-default');
      expect(skeleton).toHaveClass('animate-pulse rounded-md bg-muted/10');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    test('accepts and applies custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton-custom" />);
      const skeleton = screen.getByTestId('skeleton-custom');
      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    test('spreads additional props to the div', () => {
      render(<Skeleton data-testid="skeleton-test" data-custom="test-value" />);
      const skeleton = screen.getByTestId('skeleton-test');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-custom', 'test-value');
    });
  });

  describe('Accessibility', () => {
    test('has appropriate ARIA attributes for loading state', () => {
      render(
        <Skeleton 
          aria-label="Loading content" 
          data-testid="skeleton-aria"
        />
      );
      const skeleton = screen.getByTestId('skeleton-aria');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
      expect(skeleton).toHaveAttribute('role', 'none');
    });
  });
});
