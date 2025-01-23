// src/tests/setup.ts

import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock logger with a simpler version for tests
vi.mock('../utils/logger', () => ({
  default: {
    test: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Extend expect matchers
declare global {
  namespace Vi {
    interface Assertion extends jest.Matchers<void> {}
  }
}

// Setup global mocks
beforeAll(() => {
  // Mock console methods
  const consoleMethods = ['log', 'error', 'warn', 'info'] as const;
  consoleMethods.forEach((method) => {
    vi.spyOn(console, method).mockImplementation(vi.fn());
  });

  // Mock window methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });

  // Mock ResizeObserver
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });

  // Mock window.fs for file operations
  Object.defineProperty(window, 'fs', {
    value: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
    },
  });

  // Mock Touch and TouchEvent constructors
  class MockTouch {
    constructor(init: any) {
      Object.assign(this, init);
    }
  }

  class MockTouchEvent extends Event {
    touches: any[];
    targetTouches: any[];
    changedTouches: any[];

    constructor(type: string, init: any = {}) {
      super(type, { bubbles: true, ...init });
      this.touches = init.touches || [];
      this.targetTouches = init.targetTouches || [];
      this.changedTouches = init.changedTouches || [];
    }
  }

  // @ts-ignore
  window.Touch = MockTouch;
  // @ts-ignore
  window.TouchEvent = MockTouchEvent;

  // Add getBoundingClientRect mock for elements
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global teardown
afterAll(() => {
  vi.restoreAllMocks();
});

// Custom test environment setup
const customMatchers = {
  toHaveBeenCalledWithErrorLogged: () => ({
    pass: false,
    message: () => '',
  }),
  toHaveBeenCalledWithMatch: (received: any, ...expected: any[]) => ({
    pass: received.mock.calls.some((call: any[]) =>
      expected.every((arg: any, i: number) => {
        if (typeof arg === 'object') {
          return JSON.stringify(call[i]) === JSON.stringify(arg);
        }
        return call[i] === arg;
      })
    ),
    message: () => `expected ${received} to have been called with match ${expected}`,
  }),
};

expect.extend(customMatchers);

// Test helper for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Custom error for test failures
export class TestError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'TestError';
  }
}

// Helper function to capture console output
export const captureConsoleOutput = async (fn: () => Promise<void>) => {
  const logs: string[] = [];
  const originalConsole = { ...console };

  try {
    Object.keys(console).forEach((key) => {
      (console as any)[key] = (...args: any[]) => {
        logs.push(`${key}: ${args.join(' ')}`);
      };
    });

    await fn();
    return logs;
  } finally {
    Object.assign(console, originalConsole);
  }
};

// Type definitions for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithErrorLogged(): R;
      toHaveBeenCalledWithMatch(...args: any[]): R;
    }
  }
}

// Helper function to simulate touch events
export const simulateTouch = (
  element: Element,
  {
    type,
    touches = [],
    targetTouches = [],
    changedTouches = [],
  }
) => {
  const event = new window.TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches,
    targetTouches,
    changedTouches,
  });
  element.dispatchEvent(event);
};

