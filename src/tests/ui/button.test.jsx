// src/tests/ui/button.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/button';
import logger from '../../utils/logger';

describe('Button Component', () => {
  beforeEach(async () => {
    try {
      await logger.test('Button', 'Setting up test environment');
      vi.clearAllMocks();
      await logger.test('Button', 'Test environment setup complete');
    } catch (error) {
      await logger.error('Button setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Button', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Button cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders button with children correctly', async () => {
      try {
        await logger.test('Button', 'Testing basic render');
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
        await logger.test('Button', 'Basic render passed');
      } catch (error) {
        await logger.error('Button render failed', error);
        throw error;
      }
    });

    test('renders disabled state correctly', async () => {
      try {
        await logger.test('Button', 'Testing disabled state');
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        await logger.test('Button', 'Disabled state passed');
      } catch (error) {
        await logger.error('Button disabled state failed', error);
        throw error;
      }
    });

    test('applies variant classes correctly', async () => {
      try {
        await logger.test('Button', 'Testing variants');
        const { rerender } = render(<Button variant="default">Default</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-primary');

        rerender(<Button variant="destructive">Destructive</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-destructive');

        rerender(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button')).toHaveClass('border');

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

        await logger.test('Button', 'Variants passed');
      } catch (error) {
        await logger.error('Button variants failed', error);
        throw error;
      }
    });

    test('applies size classes correctly', async () => {
      try {
        await logger.test('Button', 'Testing sizes');
        const { rerender } = render(<Button size="default">Default</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-10 px-4 py-2');

        rerender(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-9 px-3');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-11 px-8');

        rerender(<Button size="icon">Icon</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-10 w-10');

        await logger.test('Button', 'Sizes passed');
      } catch (error) {
        await logger.error('Button sizes failed', error);
        throw error;
      }
    });
  });

  describe('Interactions', () => {
    test('calls onClick handler when clicked', async () => {
      try {
        await logger.test('Button', 'Testing click handler');
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
        
        await logger.test('Button', 'Click handler passed');
      } catch (error) {
        await logger.error('Button click handler failed', error);
        throw error;
      }
    });

    test('does not call onClick when disabled', async () => {
      try {
        await logger.test('Button', 'Testing disabled click handling');
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Click me</Button>);
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
        
        await logger.test('Button', 'Disabled click handling passed');
      } catch (error) {
        await logger.error('Button disabled click handling failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('forwards ref correctly', async () => {
      try {
        await logger.test('Button', 'Testing ref forwarding');
        const ref = { current: null };
        render(<Button ref={ref}>Click me</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        await logger.test('Button', 'Ref forwarding passed');
      } catch (error) {
        await logger.error('Button ref forwarding failed', error);
        throw error;
      }
    });

    test('supports aria-label', async () => {
      try {
        await logger.test('Button', 'Testing aria-label support');
        render(<Button aria-label="Close dialog">×</Button>);
        expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
        await logger.test('Button', 'Aria-label support passed');
      } catch (error) {
        await logger.error('Button aria-label support failed', error);
        throw error;
      }
    });
  });
});
