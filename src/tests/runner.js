// src/tests/runner.js
import { vi } from 'vitest';
import logger from '../utils/logger';

export async function runTestSuite() {
  try {
    logger.info('Starting test suite execution');
    
    // Run integration tests
    await import('./integration/UserFlows.test.js');
    await import('./integration/ComponentInteractions.test.js');
    await import('./integration/ServiceIntegration.test.js');
    await import('./integration/ErrorRecovery.test.js');
    await import('./integration/StateManagement.test.js');

    // Run component tests
    const componentTests = import.meta.glob('./components/**/*.test.{js,jsx}');
    for (const path in componentTests) {
      await componentTests[path]();
    }

    // Run service tests
    const serviceTests = import.meta.glob('./services/**/*.test.{js,jsx}');
    for (const path in serviceTests) {
      await serviceTests[path]();
    }

    logger.info('Test suite execution completed');
  } catch (error) {
    logger.error('Test suite execution failed', error);
    throw error;
  }
}

if (process.env.NODE_ENV === 'test') {
  runTestSuite();
}
