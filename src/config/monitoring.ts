// src/config/monitoring.ts
import { Logtail } from '@logtail/node';
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { Response } from 'express';
import { performance } from 'perf_hooks';
import { logger } from './logger';

export class MonitoringService {
  private static instance: MonitoringService;
  private logtail: Logtail;

  private constructor() {
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new ProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });

    // Initialize Logtail
    this.logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public captureError(error: Error, context?: Record<string, any>) {
    // Send to Sentry
    Sentry.captureException(error, {
      extra: context
    });

    // Log to Logtail
    this.logtail.error(error.message, {
      stack: error.stack,
      ...context
    });

    // Local logging
    logger.error(error.message, {
      stack: error.stack,
      ...context
    });
  }

  public captureMetric(name: string, value: number, tags?: Record<string, string>) {
    // Send to StatsD/Datadog
    const statsDTags = tags ? 
      Object.entries(tags).map(([key, value]) => `${key}:${value}`).join(',') : 
      '';
    
    logger.info(`metric:${name}|${value}|${statsDTags}`);
  }

  public startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  public trackAPIResponse(res: Response, routeName: string) {
    const end = this.startTimer();
    
    res.on('finish', () => {
      const duration = end();
      this.captureMetric('api.response_time', duration, {
        route: routeName,
        method: res.req.method,
        status_code: res.statusCode.toString()
      });
    });
  }

  public async trackDatabaseQuery(
    operation: string,
    query: () => Promise<any>
  ): Promise<any> {
    const timer = this.startTimer();
    try {
      const result = await query();
      const duration = timer();
      
      this.captureMetric('database.query_time', duration, {
        operation
      });
      
      return result;
    } catch (error) {
      const duration = timer();
      this.captureMetric('database.query_error', duration, {
        operation
      });
      throw error;
    }
  }
}

export const monitoring = MonitoringService.getInstance();
