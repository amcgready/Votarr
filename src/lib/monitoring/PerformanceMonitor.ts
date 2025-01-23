// src/lib/monitoring/PerformanceMonitor.ts
import { MetricsCollector } from './MetricsCollector';
import { PerformanceMetrics } from './types';
import { QueryOptimizer } from '../database/QueryOptimizer';
import { AdvancedCache } from '../cache/AdvancedCache';

interface MonitorConfig {
  sampleInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    queryTime: number;
    cacheHitRate: number;
    bundleSize: number;
    memoryUsage: number;
  };
}

export class PerformanceMonitor {
  private metrics: MetricsCollector;
  private queryOptimizer: QueryOptimizer;
  private cache: AdvancedCache;
  private config: MonitorConfig;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.metrics = new MetricsCollector();
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Frontend Performance Monitoring
    if (typeof window !== 'undefined') {
      this.monitorFrontendMetrics();
    }
    
    // Backend Performance Monitoring
    this.monitorBackendMetrics();
    
    // Database Performance Monitoring
    this.monitorDatabaseMetrics();
  }

  private monitorFrontendMetrics() {
    // Monitor Bundle Loading
    this.metrics.observe('bundle_load_time', () => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return timing.domContentLoadedEventEnd - timing.fetchStart;
    });

    // Monitor Component Loading
    this.metrics.observe('component_load_time', () => {
      const marks = performance.getEntriesByType('mark');
      return marks.reduce((acc, mark) => {
        if (mark.name.startsWith('component_')) {
          acc[mark.name] = mark.startTime;
        }
        return acc;
      }, {} as Record<string, number>);
    });

    // Monitor Resource Loading
    this.metrics.observe('resource_timing', () => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: (entry as PerformanceResourceTiming).encodedBodySize
      }));
    });

    // Monitor Memory Usage
    if ('memory' in performance) {
      this.metrics.observe('memory_usage', () => {
        return (performance as any).memory.usedJSHeapSize;
      });
    }
  }

  private monitorBackendMetrics() {
    // API Response Times
    this.metrics.observe('api_response_time', async (endpoint: string) => {
      const timings = await this.metrics.getEndpointTimings(endpoint);
      return {
        avg: timings.reduce((a, b) => a + b, 0) / timings.length,
        p95: this.calculatePercentile(timings, 95),
        p99: this.calculatePercentile(timings, 99)
      };
    });

    // Cache Performance
    this.metrics.observe('cache_performance', async () => {
      const stats = await this.cache.getStats();
      return {
        hitRate: stats.hits / (stats.hits + stats.misses),
        size: stats.size,
        evictions: stats.evictions
      };
    });

    // WebSocket Connections
    this.metrics.observe('websocket_metrics', () => {
      return {
        activeConnections: this.getActiveWebSocketConnections(),
        messageRate: this.getWebSocketMessageRate(),
        errorRate: this.getWebSocketErrorRate()
      };
    });
  }

  private monitorDatabaseMetrics() {
    // Query Performance
    this.metrics.observe('query_performance', async () => {
      const slowQueries = await this.queryOptimizer.getSlowQueries();
      return {
        slowQueries,
        avgExecutionTime: this.calculateAverageQueryTime(),
        queryCount: this.getQueryCount()
      };
    });

    // Connection Pool
    this.metrics.observe('database_connections', () => {
      return {
        active: this.getActiveConnections(),
        idle: this.getIdleConnections(),
        waiting: this.getWaitingConnections()
      };
    });

    // Index Usage
    this.metrics.observe('index_usage', async () => {
      const suggestions = await this.queryOptimizer.suggestIndexes();
      return {
        suggestions,
        unusedIndexes: this.getUnusedIndexes(),
        indexSize: this.getIndexSizes()
      };
    });
  }

  async generateReport(): Promise<PerformanceMetrics> {
    const report = {
      timestamp: new Date(),
      frontend: {
        bundleLoadTime: await this.metrics.get('bundle_load_time'),
        componentLoadTimes: await this.metrics.get('component_load_time'),
        resourceTimings: await this.metrics.get('resource_timing'),
        memoryUsage: await this.metrics.get('memory_usage')
      },
      backend: {
        apiResponseTimes: await this.metrics.get('api_response_time'),
        cachePerformance: await this.metrics.get('cache_performance'),
        websocketMetrics: await this.metrics.get('websocket_metrics')
      },
      database: {
        queryPerformance: await this.metrics.get('query_performance'),
        connectionPool: await this.metrics.get('database_connections'),
        indexUsage: await this.metrics.get('index_usage')
      }
    };

    await this.checkAlerts(report);
    return report;
  }

  private async checkAlerts(metrics: PerformanceMetrics) {
    const alerts = [];

    // Check Query Performance
    if (metrics.database.queryPerformance.avgExecutionTime > this.config.alertThresholds.queryTime) {
      alerts.push({
        type: 'SLOW_QUERIES',
        message: 'Average query execution time exceeds threshold',
        value: metrics.database.queryPerformance.avgExecutionTime
      });
    }

    // Check Cache Performance
    if (metrics.backend.cachePerformance.hitRate < this.config.alertThresholds.cacheHitRate) {
      alerts.push({
        type: 'LOW_CACHE_HIT_RATE',
        message: 'Cache hit rate below threshold',
        value: metrics.backend.cachePerformance.hitRate
      });
    }

    // Check Bundle Size
    const totalBundleSize = metrics.frontend.resourceTimings
      .filter(r => r.name.includes('bundle'))
      .reduce((acc, r) => acc + r.size, 0);

    if (totalBundleSize > this.config.alertThresholds.bundleSize) {
      alerts.push({
        type: 'LARGE_BUNDLE_SIZE',
        message: 'Bundle size exceeds threshold',
        value: totalBundleSize
      });
    }

    if (alerts.length > 0) {
      await this.notifyAlerts(alerts);
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Helper methods implemented as needed...
}
