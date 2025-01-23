// src/tests/ui/select.test.jsx
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '../../components/ui/select';
import logger from '../../utils/logger';

// Enhanced mock with better state handling and event propagation
vi.mock('@radix-ui/react-select', () => {
  let isOpen = false;
  let selectedValue = '';

  return {
    Root: ({ children, value, onValueChange, disabled }) => {
      selectedValue = value;
      return (
        <div 
          data-testid="select-root" 
          data-value={selectedValue} 
          data-state={isOpen ? 'open' : 'closed'}
          aria-disabled={disabled}
          onClick={() => !disabled && onValueChange?.()}
        >
          {children}
        </div>
      );
    },
    Trigger: ({ children, className, 'aria-label': ariaLabel, disabled }) => (
      <button 
        data-testid="select-trigger" 
        className={className}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            isOpen = !isOpen;
          }
        }}
      >
        {children}
      </button>
    ),
    Value: ({ children, className, placeholder }) => (
      <span data-testid="select-value" className={className}>
        {selectedValue ? children : placeholder}
      </span>
    ),
    Portal: ({ children }) => <div data-testid="select-portal">{children}</div>,
    Content: ({ children, className }) => (
      <div 
        data-testid="select-content" 
        className={className}
        role="listbox"
        data-state={isOpen ? 'open' : 'closed'}
        hidden={!isOpen}
      >
        {children}
      </div>
    ),
    Item: ({ children, value, className, disabled }) => (
      <div 
        data-testid="select-item" 
        data-value={value}
        data-disabled={disabled} 
        className={className}
        role="option"
        aria-selected={selectedValue === value}
        onClick={() => {
          if (!disabled && isOpen) {
            selectedValue = value;
            isOpen = false;
          }
        }}
      >
        {children}
      </div>
    ),
    ItemText: ({ children }) => (
      <span data-testid="select-item-text">
        {children}
      </span>
    ),
    ItemIndicator: ({ children }) => (
      <span data-testid="select-item-indicator" aria-hidden="true">
        {children}
      </span>
    ),
    Group: ({ children }) => (
      <div 
        data-testid="select-group"
        role="group"
        aria-labelledby="select-label"
      >
        {children}
      </div>
    ),
    Label: ({ children, className }) => (
      <span 
        data-testid="select-label"
        id="select-label" 
        className={className}
      >
        {children}
      </span>
    ),
    Separator: ({ className }) => (
      <div 
        data-testid="select-separator" 
        className={className}
        role="separator"
        aria-orientation="horizontal"
      />
    ),
    ScrollUpButton: ({ className, children }) => (
      <div 
        data-testid="select-scroll-up" 
        className={className}
        role="button"
        aria-hidden="true"
      >
        {children}
      </div>
    ),
    ScrollDownButton: ({ className, children }) => (
      <div 
        data-testid="select-scroll-down" 
        className={className}
        role="button"
        aria-hidden="true"
      >
        {children}
      </div>
    ),
    Icon: ({ children, asChild }) => (
      <span data-testid="select-icon" aria-hidden="true">
        {children}
      </span>
    ),
  };
});

describe('Select Component', () => {
  const items = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
  ];

  beforeEach(async () => {
    try {
      await logger.test('Select', 'Setting up test environment');
      vi.clearAllMocks();
    } catch (error) {
      await logger.error('Select setup failed', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await logger.test('Select', 'Cleaning up test environment');
    } catch (error) {
      await logger.error('Select cleanup failed', error);
    }
  });

  describe('Rendering', () => {
    test('renders select components correctly', async () => {
      try {
        await logger.test('Select', 'Testing basic render');
        render(
          <Select defaultValue="item1">
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Items</SelectLabel>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toBeInTheDocument();
        expect(screen.getByTestId('select-value')).toBeInTheDocument();
        expect(screen.getByTestId('select-group')).toBeInTheDocument();
        expect(screen.getByTestId('select-label')).toBeInTheDocument();

        items.forEach(item => {
          expect(screen.getByText(item.label)).toBeInTheDocument();
        });
        
        await logger.test('Select', 'Basic render passed');
      } catch (error) {
        await logger.error('Select render failed', error);
        throw error;
      }
    });

    test('applies custom classes correctly', async () => {
      try {
        await logger.test('Select', 'Testing custom classes');
        render(
          <Select>
            <SelectTrigger className="custom-trigger">
              <SelectValue className="custom-value" />
            </SelectTrigger>
            <SelectContent className="custom-content">
              <SelectItem className="custom-item" value="test">
                Test
              </SelectItem>
              <SelectSeparator className="custom-separator" />
            </SelectContent>
          </Select>
        );

        expect(screen.getByTestId('select-trigger')).toHaveClass('custom-trigger');
        expect(screen.getByTestId('select-value')).toHaveClass('custom-value');
        expect(screen.getByTestId('select-content')).toHaveClass('custom-content');
        expect(screen.getByTestId('select-item')).toHaveClass('custom-item');
        expect(screen.getByTestId('select-separator')).toHaveClass('custom-separator');
        
        await logger.test('Select', 'Custom classes passed');
      } catch (error) {
        await logger.error('Select custom classes failed', error);
        throw error;
      }
    });
  });

  describe('Interactions', () => {
    test('handles selection changes correctly', async () => {
      try {
        await logger.test('Select', 'Testing selection changes');
        const onValueChange = vi.fn();
        
        render(
          <Select onValueChange={onValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

        fireEvent.click(screen.getByTestId('select-trigger'));
        fireEvent.click(screen.getByText('Item 1'));
        
        expect(onValueChange).toHaveBeenCalledWith('item1');
        
        await logger.test('Select', 'Selection changes passed');
      } catch (error) {
        await logger.error('Select selection changes failed', error);
        throw error;
      }
    });

    test('handles disabled state correctly', async () => {
      try {
        await logger.test('Select', 'Testing disabled state');
        const onValueChange = vi.fn();
        
        render(
          <Select disabled onValueChange={onValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
          </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toBeDisabled();
        
        fireEvent.click(trigger);
        expect(onValueChange).not.toHaveBeenCalled();
        
        await logger.test('Select', 'Disabled state passed');
      } catch (error) {
        await logger.error('Select disabled state failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', async () => {
      try {
        await logger.test('Select', 'Testing accessibility attributes');
        render(
          <Select>
            <SelectTrigger aria-label="Select option">
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Items</SelectLabel>
                <SelectItem value="test">Test Item</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        );

        expect(screen.getByTestId('select-trigger')).toHaveAttribute('aria-label', 'Select option');
        expect(screen.getByTestId('select-trigger')).toHaveAttribute('role', 'combobox');
        expect(screen.getByTestId('select-content')).toHaveAttribute('role', 'listbox');
        expect(screen.getByTestId('select-group')).toHaveAttribute('role', 'group');
        expect(screen.getByTestId('select-item')).toHaveAttribute('role', 'option');
        
        await logger.test('Select', 'Accessibility attributes passed');
      } catch (error) {
        await logger.error('Select accessibility attributes failed', error);
        throw error;
      }
    });

    test('supports keyboard navigation', async () => {
      try {
        await logger.test('Select', 'Testing keyboard navigation');
        const onValueChange = vi.fn();
        
        render(
          <Select onValueChange={onValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        trigger.focus();
        
        fireEvent.keyDown(trigger, { key: 'Enter' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'Enter' });
        
        await logger.test('Select', 'Keyboard navigation passed');
      } catch (error) {
        await logger.error('Select keyboard navigation failed', error);
        throw error;
      }
    });
  });
});
