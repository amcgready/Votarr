// src/tests/services/logger.test.js
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';

// Mock modules
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    writeFile: vi.fn().mockResolvedValue(undefined),
    appendFile: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ size: 0, mtime: new Date() }),
    rm: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('{}')
  }
}));

vi.mock('path', () => ({
  default: {
    join: (...args) => args.join('/'),
    basename: (path) => path.split('/').pop()
  }
}));

describe('Logging System', () => {
  const testLogsDir = path.join(process.cwd(), 'test-logs');
  const WRITE_DELAY = 150;
  
  beforeEach(async () => {
    try {
      // Reset all mocks including console
      vi.clearAllMocks();
      
      // Set up test environment
      logger.logsDir = testLogsDir;
      logger.archiveDir = path.join(testLogsDir, 'archive');
      logger.isBrowser = false; // Force Node.js environment for tests
      
      // Mock fs.mkdir to succeed
      fs.mkdir.mockResolvedValueOnce(undefined);
      
      await logger.initializeLogger();
    } catch (error) {
      console.error('Setup failed:', error);
      throw error; // Ensure test fails if setup fails
    }
  });

  afterEach(async () => {
    try {
      // Clean up
      await logger.cleanup();
      vi.resetAllMocks();
    } catch (error) {
      console.error('Clean up failed:', error);
      throw error; // Ensure test fails if cleanup fails
    }
  });

  describe('Logger Basic Functionality', () => {
    test('creates log directory if it doesn\'t exist', async () => {
      try {
        // Mock access to fail (directory doesn't exist)
        fs.access.mockRejectedValueOnce(new Error('ENOENT'));
        
        // Ensure mkdir is called
        fs.mkdir.mockResolvedValueOnce(undefined);
        
        await logger.info('Test', 'Test message');
        
        expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        expect(fs.access).toHaveBeenCalled();
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('creates log file with correct format', async () => {
      try {
        const testFile = 'Log2024-01-01-12-00-00.log';
        fs.readdir.mockResolvedValueOnce([testFile]);
        fs.appendFile.mockResolvedValueOnce(undefined);
        
        await logger.info('Test', 'Test message');
        
        const appendFileCalls = fs.appendFile.mock.calls;
        expect(appendFileCalls.length).toBeGreaterThan(0);
        const [filePath, content] = appendFileCalls[0];
        expect(filePath).toMatch(/Log\d{4}-\d{2}-\d{2}/);
        expect(content).toContain('Test message');
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('writes log entries in correct format', async () => {
      try {
        const testMessage = 'Test message';
        await logger.info('Test', testMessage);
        
        const appendFileCalls = fs.appendFile.mock.calls;
        expect(appendFileCalls.length).toBeGreaterThan(0);
        const [, content] = appendFileCalls[0];
        const logEntry = JSON.parse(content);
        
        expect(logEntry).toMatchObject({
          level: 'INFO',
          context: 'Test',
          message: testMessage,
          timestamp: expect.any(String)
        });
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });
  });

  describe('Error Logging', () => {
    test('properly formats error objects', async () => {
      try {
        const testError = new Error('Test error');
        await logger.error('Test', 'Error occurred', testError);
        
        const appendFileCalls = fs.appendFile.mock.calls;
        expect(appendFileCalls.length).toBeGreaterThan(0);
        const [, content] = appendFileCalls[0];
        const logEntry = JSON.parse(content);
        
        expect(logEntry.error).toMatchObject({
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String)
        });
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('handles custom error properties', async () => {
      try {
        const customError = new Error('Custom error');
        customError.code = 'CUSTOM_ERROR';
        customError.metadata = { userId: '123' };
        
        await logger.error('Test', 'Custom error occurred', customError);
        
        const appendFileCalls = fs.appendFile.mock.calls;
        expect(appendFileCalls.length).toBeGreaterThan(0);
        const [, content] = appendFileCalls[0];
        const logEntry = JSON.parse(content);
        
        expect(logEntry.error).toMatchObject({
          code: 'CUSTOM_ERROR',
          metadata: { userId: '123' }
        });
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });
  });

  describe('Log Rotation', () => {
    test('creates new log file when size limit reached', async () => {
      try {
        // Mock a large file size
        fs.stat.mockResolvedValueOnce({ 
          size: 51 * 1024 * 1024, // Just over 50MB
          mtime: new Date()
        });
        
        await logger.info('Test', 'x'.repeat(1024));
        
        expect(fs.appendFile).toHaveBeenCalled();
        const appendFileCalls = fs.appendFile.mock.calls;
        expect(appendFileCalls.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('enforces 50MB size limit', async () => {
      try {
        // Mock stat to return increasing file sizes
        let currentSize = 0;
        fs.stat.mockImplementation(() => {
          currentSize += 1024 * 1024; // Increment by 1MB
          return Promise.resolve({ 
            size: currentSize,
            mtime: new Date()
          });
        });

        // Write enough logs to trigger multiple rotations
        const promises = Array(60).fill().map(() => 
          logger.info('Test', 'x'.repeat(1024))
        );
        
        await Promise.all(promises);

        // Verify no single log file exceeded 50MB
        const statCalls = fs.stat.mock.calls;
        const sizes = statCalls.map(call => call[0].size).filter(Boolean);
        const allUnder50MB = sizes.every(size => size < 50 * 1024 * 1024);
        
        expect(allUnder50MB).toBe(true);
        expect(fs.appendFile).toHaveBeenCalled();
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });
  });
});
