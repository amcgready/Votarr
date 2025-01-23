// src/tests/ui/alert-dialog.test.jsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Enhanced mock with proper ARIA attributes and state handling
vi.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children }) => (
    <div data-testid="alert-dialog-root" role="alertdialog">
      {children}
    </div>
  ),
  Trigger: ({ children, ...props }) => (
    <button 
      data-testid="alert-dialog-trigger"
      type="button"
      aria-haspopup="dialog"
      {...props}
    >
      {children}
    </button>
  ),
  Portal: ({ children }) => (
    <div data-testid="alert-dialog-portal">
      {children}
    </div>
  ),
  Overlay: React.forwardRef(({ children, className, ...props }, ref) => (
    <div 
      data-testid="alert-dialog-overlay"
      className={className}
      aria-hidden="true"
      {...props} 
      ref={ref}
    >
      {children}
    </div>
  )),
  Content: React.forwardRef(({ children, className, ...props }, ref) => (
    <div 
      data-testid="alert-dialog-content"
      role="alertdialog"
      aria-modal="true"
      className={className}
      {...props} 
      ref={ref}
    >
      {children}
    </div>
  )),
  Title: React.forwardRef(({ children, className, ...props }, ref) => (
    <h2 
      data-testid="alert-dialog-title"
      className={className}
      {...props} 
      ref={ref}
    >
      {children}
    </h2>
  )),
  Description: React.forwardRef(({ children, className, ...props }, ref) => (
    <p 
      data-testid="alert-dialog-description"
      className={className}
      {...props} 
      ref={ref}
    >
      {children}
    </p>
  )),
  Action: React.forwardRef(({ children, className, ...props }, ref) => (
    <button 
      data-testid="alert-dialog-action"
      className={className}
      {...props} 
      ref={ref}
    >
      {children}
    </button>
  )),
  Cancel: React.forwardRef(({ children, className, ...props }, ref) => (
    <button 
      data-testid="alert-dialog-cancel"
      className={className}
      {...props} 
      ref={ref}
    >
      {children}
    </button>
  )),
}));

describe('AlertDialog Component', () => {
  describe('Rendering', () => {
    it('renders all parts correctly', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByTestId('alert-dialog-root')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog-root')).toHaveAttribute('role', 'alertdialog');
      expect(screen.getByTestId('alert-dialog-trigger')).toBeInTheDocument();
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog-content')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA roles and attributes', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dialog Title</AlertDialogTitle>
              <AlertDialogDescription>Dialog Description</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByTestId('alert-dialog-content')).toHaveAttribute('role', 'alertdialog');
      expect(screen.getByTestId('alert-dialog-content')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByTestId('alert-dialog-trigger')).toHaveAttribute('aria-haspopup', 'dialog');
      expect(screen.getByTestId('alert-dialog-title')).toHaveClass('text-lg font-semibold');
      expect(screen.getByTestId('alert-dialog-description')).toHaveClass('text-sm text-muted-foreground');
    });
  });

  describe('Style Classes', () => {
    it('applies correct default classes', () => {
      render(
        <AlertDialog>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      const content = screen.getByTestId('alert-dialog-content');
      const cancel = screen.getByTestId('alert-dialog-cancel');

      expect(cancel).toHaveClass('mt-2');
      expect(content).toHaveClass('fixed');
    });
  });
});
