// src/config/extended-monitoring.ts
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { MetricsLogger } from 'aws-embedded-metrics';
import { performance } from 'perf_hooks';

export class ExtendedMonitoring {
  private cwClient: CloudWatchClient;
  private metricsLogger: MetricsLogger;

  constructor() {
    this.cwClient = new CloudWatchClient({ region: process.env.AWS_REGION });
    this.metricsLogger = new MetricsLogger();
  }

  // Session Metrics
  async trackSessionMetrics(sessionId: string) {
    return {
      // User Engagement
      trackUserParticipation: (userId: string, duration: number) => {
        this.metricsLogger.putMetric("SessionParticipationDuration", duration);
        this.metricsLogger.putMetric("UniqueSessionUsers", 1, "Count");
      },

      // Voting Patterns
      trackVotingActivity: (voteCount: number, consensusLevel: number) => {
        this.metricsLogger.putMetric("VotesPerSession", voteCount);
        this.metricsLogger.putMetric("ConsensusLevel", consensusLevel);
      },

      // Media Selection
      trackMediaSelection: (mediaType: string, selectionTime: number) => {
        this.metricsLogger.putMetric("MediaSelectionTime", selectionTime);
        this.metricsLogger.putProperty("MediaType", mediaType);
      },

      // Session Performance
      trackSessionPerformance: (latency: number, errorCount: number) => {
        this.metricsLogger.putMetric("SessionLatency", latency);
        this.metricsLogger.putMetric("SessionErrors", errorCount);
      }
    };
  }

  // WebSocket Metrics
  async trackWebSocketMetrics() {
    return {
      connectionLatency: (latency: number) => {
        this.metricsLogger.putMetric("WebSocketConnectionLatency", latency);
      },
      
      messageSize: (size: number) => {
        this.metricsLogger.putMetric("WebSocketMessageSize", size);
      },
      
      connectionDuration: (duration: number) => {
        this.metricsLogger.putMetric("WebSocketConnectionDuration", duration);
      },
      
      reconnectionAttempts: (attempts: number) => {
        this.metricsLogger.putMetric("WebSocketReconnectionAttempts", attempts);
      }
    };
  }

  // API Performance Metrics
  async trackAPIMetrics(endpoint: string) {
    const startTime = performance.now();
    return {
      endTrace: () => {
        const duration = performance.now() - startTime;
        this.metricsLogger.putMetric("APILatency", duration);
        this.metricsLogger.putProperty("Endpoint", endpoint);
      },
      
      trackRateLimit: (remaining: number) => {
        this.metricsLogger.putMetric("APIRateLimitRemaining", remaining);
      },
      
      trackCacheHit: (hit: boolean) => {
        this.metricsLogger.putMetric("APICacheHit", hit ? 1 : 0);
      }
    };
  }

  // Database Metrics
  async trackDatabaseMetrics() {
    return {
      queryExecution: (duration: number, queryType: string) => {
        this.metricsLogger.putMetric("DBQueryDuration", duration);
        this.metricsLogger.putProperty("QueryType", queryType);
      },
      
      connectionPool: (active: number, idle: number) => {
        this.metricsLogger.putMetric("DBActiveConnections", active);
        this.metricsLogger.putMetric("DBIdleConnections", idle);
      },
      
      deadlocks: (count: number) => {
        this.metricsLogger.putMetric("DBDeadlocks", count);
      }
    };
  }

  // User Experience Metrics
  async trackUXMetrics() {
    return {
      pageLoad: (duration: number, page: string) => {
        this.metricsLogger.putMetric("PageLoadTime", duration);
        this.metricsLogger.putProperty("Page", page);
      },
      
      interactionDelay: (duration: number, action: string) => {
        this.metricsLogger.putMetric("UserInteractionDelay", duration);
        this.metricsLogger.putProperty("Action", action);
      },
      
      errorCount: (count: number, type: string) => {
        this.metricsLogger.putMetric("UserErrors", count);
        this.metricsLogger.putProperty("ErrorType", type);
      }
    };
  }

  // Resource Utilization Metrics
  async trackResourceMetrics() {
    return {
      memory: (usage: number) => {
        this.metricsLogger.putMetric("MemoryUsage", usage);
      },
      
      cpu: (usage: number) => {
        this.metricsLogger.putMetric("CPUUsage", usage);
      },
      
      diskIO: (reads: number, writes: number) => {
        this.metricsLogger.putMetric("DiskReads", reads);
        this.metricsLogger.putMetric("DiskWrites", writes);
      }
    };
  }
}

export const extendedMonitoring = new ExtendedMonitoring();
