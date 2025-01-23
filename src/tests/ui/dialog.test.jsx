// src/tests/ui/dialog.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import logger from '../../utils/logger';

// Mock RadixUI's Dialog primitive
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }) => (
    <div data-testid="dialog-root" data-open={open} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
  ),
  Trigger: ({ children }) => <button data-testid="dialog-trigger">{children}</button>,
  Portal: ({ children }) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children }) => <div data-testid="dialog-overlay">{children}</div>,
  Content: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  Title: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
  Description: ({ children }) => <p data-testid="dialog-description">{children}</p>,
  Close: ({ children }) => <button data-testid="dialog-close">{children}</button>,
}));

describe('Dialog Component', () => {
  beforeEach(async () => {
    try {
      await logger.test('Dialog', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('Dialog setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Dialog', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Dialog cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders all dialog components correctly', async () => {
      try {
        await logger.test('Dialog', 'Testing basic render');
        render(
          <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Title</DialogTitle>
                <DialogDescription>Test Description</DialogDescription>
              </DialogHeader>
              <div>Content</div>
            </DialogContent>
          </Dialog>
        );

        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        
        await logger.test('Dialog', 'Basic render passed');
      } catch (error) {
        await logger.error('Dialog render failed', error);
        throw error;
      }
    });

    test('applies custom classes correctly', async () => {
      try {
        await logger.test('Dialog', 'Testing custom classes');
        render(
          <Dialog>
            <DialogContent className="custom-content">
              <DialogHeader className="custom-header">
                <DialogTitle className="custom-title">Title</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        );

        expect(screen.getByTestId('dialog-content')).toHaveClass('custom-content');
        expect(screen.getByText('Title')).toHaveClass('custom-title');
        
        await logger.test('Dialog', 'Custom classes passed');
      } catch (error) {
        await logger.error('Dialog custom classes failed', error);
        throw error;
      }
    });
  });

  describe('Interactions', () => {
    test('opens and closes dialog correctly', async () => {
      try {
        await logger.test('Dialog', 'Testing open/close functionality');
        const onOpenChange = vi.fn();
        
        render(
          <Dialog onOpenChange={onOpenChange}>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>Content</DialogContent>
          </Dialog>
        );

        fireEvent.click(screen.getByText('Open'));
        expect(onOpenChange).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByTestId('dialog-overlay'));
        expect(onOpenChange).toHaveBeenCalledWith(false);
        
        await logger.test('Dialog', 'Open/close functionality passed');
      } catch (error) {
        await logger.error('Dialog open/close functionality failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA roles and attributes', async () => {
      try {
        await logger.test('Dialog', 'Testing accessibility attributes');
        render(
          <Dialog>
            <DialogTrigger aria-label="Open dialog">Open</DialogTrigger>
            <DialogContent>
              <DialogTitle>Accessible Title</DialogTitle>
            </DialogContent>
          </Dialog>
        );

        expect(screen.getByTestId('dialog-trigger')).toHaveAttribute('aria-label', 'Open dialog');
        expect(screen.getByTestId('dialog-content')).toHaveAttribute('role', 'dialog');
        expect(screen.getByTestId('dialog-title')).toHaveAttribute('role', 'heading');
        
        await logger.test('Dialog', 'Accessibility attributes passed');
      } catch (error) {
        await logger.error('Dialog accessibility attributes failed', error);
        throw error;
      }
    });
  });
});
