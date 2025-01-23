// src/tests/ui/badge.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/badge';
import logger from '../../utils/logger';

describe('Badge Component', () => {
  beforeEach(async () => {
    try {
      await logger.test('Badge', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('Badge setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Badge', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Badge cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders children correctly', async () => {
      try {
        await logger.test('Badge', 'Testing basic render');
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
        await logger.test('Badge', 'Basic render passed');
      } catch (error) {
        await logger.error('Badge render failed', error);
        throw error;
      }
    });

    test('applies variant classes correctly', async () => {
      try {
        await logger.test('Badge', 'Testing variants');
        const { rerender } = render(<Badge variant="default">Default</Badge>);
        expect(screen.getByText('Default')).toHaveClass('bg-primary');

        rerender(<Badge variant="secondary">Secondary</Badge>);
        expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');

        rerender(<Badge variant="destructive">Destructive</Badge>);
        expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');

        rerender(<Badge variant="outline">Outline</Badge>);
        expect(screen.getByText('Outline')).toHaveClass('border');

        await logger.test('Badge', 'Variants passed');
      } catch (error) {
        await logger.error('Badge variants failed', error);
        throw error;
      }
    });

    test('applies custom className correctly', async () => {
      try {
        await logger.test('Badge', 'Testing custom class');
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
        await logger.test('Badge', 'Custom class passed');
      } catch (error) {
        await logger.error('Badge custom class failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct role', async () => {
      try {
        await logger.test('Badge', 'Testing accessibility role');
        render(<Badge>Status</Badge>);
        expect(screen.getByText('Status')).toHaveAttribute('role', 'status');
        await logger.test('Badge', 'Accessibility role passed');
      } catch (error) {
        await logger.error('Badge accessibility role failed', error);
        throw error;
      }
    });
  });
});
