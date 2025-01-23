// src/tests/ui/progress.test.jsx

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Progress } from '../../components/ui/progress';
import logger from '../../utils/logger';

// Improved mock that better matches Radix UI's behavior
vi.mock('@radix-ui/react-progress', () => ({
  Root: ({
    children,
    value,
    className,
    role,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': now,
    'aria-label': label,
    ...props
  }) => (
    <div
      data-testid="progress-root"
      className={className}
      role={role}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-label={label}
      {...props}
    >
      {children}
    </div>
  ),
  Indicator: ({ className, style, children }) => (
    <div
      data-testid="progress-indicator"
      className={className}
      style={style}
    >
      {children}
    </div>
  ),
}));

vi.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

describe('Progress Component', () => {
  beforeEach(async () => {
    try {
      await logger.test('Progress', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('Progress setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Progress', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Progress cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders progress bar with correct value', async () => {
      try {
        await logger.test('Progress', 'Testing basic render');
        render(<Progress value={50} />);
        
        const progressRoot = screen.getByTestId('progress-root');
        const indicator = screen.getByTestId('progress-indicator');
        
        expect(progressRoot).toBeInTheDocument();
        expect(progressRoot).toHaveAttribute('aria-valuenow', '50');
        expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
        
        await logger.test('Progress', 'Basic render passed');
      } catch (error) {
        await logger.error('Progress render failed', error);
        throw error;
      }
    });

    test('handles undefined value correctly', async () => {
      try {
        await logger.test('Progress', 'Testing undefined value');
        render(<Progress />);
        
        const progressRoot = screen.getByTestId('progress-root');
        expect(progressRoot).toHaveAttribute('aria-valuenow', '0');
        
        await logger.test('Progress', 'Undefined value passed');
      } catch (error) {
        await logger.error('Progress undefined value failed', error);
        throw error;
      }
    });

    test('applies custom className correctly', async () => {
      try {
        await logger.test('Progress', 'Testing custom class');
        render(<Progress className="custom-progress" />);
        
        const progressRoot = screen.getByTestId('progress-root');
        expect(progressRoot).toHaveClass('custom-progress');
        expect(progressRoot).toHaveClass('relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-secondary');
        
        await logger.test('Progress', 'Custom class passed');
      } catch (error) {
        await logger.error('Progress custom class failed', error);
        throw error;
      }
    });
  });

  describe('Value Updates', () => {
    test('updates indicator position when value changes', async () => {
      try {
        await logger.test('Progress', 'Testing value updates');
        const { rerender } = render(<Progress value={25} />);
        
        let indicator = screen.getByTestId('progress-indicator');
        expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' });

        rerender(<Progress value={75} />);
        await waitFor(() => {
          indicator = screen.getByTestId('progress-indicator');
          expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
        });
        
        await logger.test('Progress', 'Value updates passed');
      } catch (error) {
        await logger.error('Progress value updates failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', async () => {
      try {
        await logger.test('Progress', 'Testing accessibility attributes');
        render(<Progress value={50} aria-label="Custom Progress" />);
        
        const progressRoot = screen.getByTestId('progress-root');
        expect(progressRoot).toHaveAttribute('role', 'progressbar');
        expect(progressRoot).toHaveAttribute('aria-valuemin', '0');
        expect(progressRoot).toHaveAttribute('aria-valuemax', '100');
        expect(progressRoot).toHaveAttribute('aria-valuenow', '50');
        expect(progressRoot).toHaveAttribute('aria-label', 'Custom Progress');
        
        await logger.test('Progress', 'Accessibility attributes passed');
      } catch (error) {
        await logger.error('Progress accessibility attributes failed', error);
        throw error;
      }
    });
  });
});
