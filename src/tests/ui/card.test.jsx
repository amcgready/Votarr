// src/tests/ui/card.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import logger from '../../utils/logger';

describe('Card Components', () => {
  beforeEach(async () => {
    try {
      await logger.test('Card', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('Card setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Card', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Card cleanup failed', error);
    }
  });

  describe('Card Component', () => {
    test('renders with correct structure', async () => {
      try {
        await logger.test('Card', 'Testing basic render');
        render(
          <Card>
            <CardHeader>
              <CardTitle>Title</CardTitle>
              <CardDescription>Description</CardDescription>
            </CardHeader>
            <CardContent>Content</CardContent>
            <CardFooter>Footer</CardFooter>
          </Card>
        );

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.getByText('Footer')).toBeInTheDocument();
        
        await logger.test('Card', 'Basic render passed');
      } catch (error) {
        await logger.error('Card render failed', error);
        throw error;
      }
    });

    test('applies custom className to all components', async () => {
      try {
        await logger.test('Card', 'Testing custom classes');
        render(
          <Card className="custom-card">
            <CardHeader className="custom-header">
              <CardTitle className="custom-title">Title</CardTitle>
              <CardDescription className="custom-desc">Description</CardDescription>
            </CardHeader>
            <CardContent className="custom-content">Content</CardContent>
            <CardFooter className="custom-footer">Footer</CardFooter>
          </Card>
        );

        expect(screen.getByText('Title').parentElement.parentElement).toHaveClass('custom-card');
        expect(screen.getByText('Title').parentElement).toHaveClass('custom-header');
        expect(screen.getByText('Title')).toHaveClass('custom-title');
        expect(screen.getByText('Description')).toHaveClass('custom-desc');
        expect(screen.getByText('Content')).toHaveClass('custom-content');
        expect(screen.getByText('Footer')).toHaveClass('custom-footer');
        
        await logger.test('Card', 'Custom classes passed');
      } catch (error) {
        await logger.error('Card custom classes failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA roles and attributes', async () => {
      try {
        await logger.test('Card', 'Testing accessibility attributes');
        render(
          <Card role="region" aria-label="Test Card">
            <CardHeader>
              <CardTitle>Accessible Title</CardTitle>
            </CardHeader>
          </Card>
        );

        expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Test Card');
        expect(screen.getByText('Accessible Title')).toHaveAttribute('role', 'heading');
        
        await logger.test('Card', 'Accessibility attributes passed');
      } catch (error) {
        await logger.error('Card accessibility attributes failed', error);
        throw error;
      }
    });
  });
});
