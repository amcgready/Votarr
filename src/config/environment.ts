// src/config/environments.ts
import { z } from 'zod';

// Environment configuration schema
const EnvironmentConfigSchema = z.object({
  // Server Configuration
  port: z.number(),
  apiUrl: z.string().url(),
  corsOrigins: z.array(z.string()),
  
  // Database Configuration
  database: z.object({
    maxConnections: z.number(),
    idleTimeoutMs: z.number(),
    statementTimeoutMs: z.number(),
    ssl: z.boolean(),
  }),
  
  // Cache Configuration
  cache: z.object({
    ttl: z.number(),
    maxSize: z.number(),
  }),
  
  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number(),
    maxRequests: z.number(),
    skipPaths: z.array(z.string()),
  }),
  
  // Security
  security: z.object({
    jwtExpirationHours: z.number(),
    passwordMinLength: z.number(),
    maxLoginAttempts: z.number(),
    requireMFA: z.boolean(),
  }),
  
  // Monitoring
  monitoring: z.object({
    sampleRate: z.number(),
    errorThreshold: z.number(),
    performanceThreshold: z.number(),
  }),
  
  // Features
  features: z.object({
    enableWebSockets: z.boolean(),
    enableNotifications: z.boolean(),
    enableOfflineMode: z.boolean(),
    maxSessionUsers: z.number(),
    maxConcurrentSessions: z.number(),
  }),
  
  // Scaling
  scaling: z.object({
    minInstances: z.number(),
    maxInstances: z.number(),
    targetCPUUtilization: z.number(),
    targetMemoryUtilization: z.number(),
  }),
  
  // Backup
  backup: z.object({
    enabled: z.boolean(),
    frequency: z.number(), // hours
    retentionDays: z.number(),
    includeMedia: z.boolean(),
  })
});

type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Development Environment Configuration
const developmentConfig: EnvironmentConfig = {
  port: 3000,
  apiUrl: 'http://localhost:3000',
  corsOrigins: ['http://localhost:3000'],
  
  database: {
    maxConnections: 10,
    idleTimeoutMs: 10000,
    statementTimeoutMs: 30000,
    ssl: false,
  },
  
  cache: {
    ttl: 300,
    maxSize: 100,
  },
  
  rateLimit: {
    windowMs: 900000,
    maxRequests: 1000,
    skipPaths: ['/health', '/metrics'],
  },
  
  security: {
    jwtExpirationHours: 24,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    requireMFA: false,
  },
  
  monitoring: {
    sampleRate: 1,
    errorThreshold: 10,
    performanceThreshold: 1000,
  },
  
  features: {
    enableWebSockets: true,
    enableNotifications: true,
    enableOfflineMode: true,
    maxSessionUsers: 10,
    maxConcurrentSessions: 5,
  },
  
  scaling: {
    minInstances: 1,
    maxInstances: 1,
    targetCPUUtilization: 80,
    targetMemoryUtilization: 80,
  },
  
  backup: {
    enabled: false,
    frequency: 24,
    retentionDays: 7,
    includeMedia: false,
  }
};

// Staging Environment Configuration
const stagingConfig: EnvironmentConfig = {
  port: 3000,
  apiUrl: 'https://staging.votarr.example.com',
  corsOrigins: ['https://staging.votarr.example.com'],
  
  database: {
    maxConnections: 50,
    idleTimeoutMs: 30000,
    statementTimeoutMs: 60000,
    ssl: true,
  },
  
  cache: {
    ttl: 600,
    maxSize: 1000,
  },
  
  rateLimit: {
    windowMs: 900000,
    maxRequests: 5000,
    skipPaths: ['/health', '/metrics'],
  },
  
  security: {
    jwtExpirationHours: 12,
    passwordMinLength: 10,
    maxLoginAttempts: 3,
    requireMFA: true,
  },
  
  monitoring: {
    sampleRate: 0.5,
    errorThreshold: 5,
    performanceThreshold: 500,
  },
  
  features: {
    enableWebSockets: true,
    enableNotifications: true,
    enableOfflineMode: true,
    maxSessionUsers: 50,
    maxConcurrentSessions: 20,
  },
  
  scaling: {
    minInstances: 2,
    maxInstances: 4,
    targetCPUUtilization: 70,
    targetMemoryUtilization: 70,
  },
  
  backup: {
    enabled: true,
    frequency: 12,
    retentionDays: 14,
    includeMedia: true,
  }
};

// Production Environment Configuration
const productionConfig: EnvironmentConfig = {
  port: 3000,
  apiUrl: 'https://api.votarr.example.com',
  corsOrigins: ['https://votarr.example.com'],
  
  database: {
    maxConnections: 200,
    idleTimeoutMs: 60000,
    statementTimeoutMs: 120000,
    ssl: true,
  },
  
  cache: {
    ttl: 1800,
    maxSize: 10000,
  },
  
  rateLimit: {
    windowMs: 900000,
    maxRequests: 10000,
    skipPaths: ['/health', '/metrics'],
  },
  
  security: {
    jwtExpirationHours: 8,
    passwordMinLength: 12,
    maxLoginAttempts: 3,
    requireMFA: true,
  },
  
  monitoring: {
    sampleRate: 0.1,
    errorThreshold: 1,
    performanceThreshold: 300,
  },
  
  features: {
    enableWebSockets: true,
    enableNotifications: true,
    enableOfflineMode: true,
    maxSessionUsers: 100,
    maxConcurrentSessions: 50,
  },
  
  scaling: {
    minInstances: 4,
    maxInstances: 10,
    targetCPUUtilization: 60,
    targetMemoryUtilization: 60,
  },
  
  backup: {
    enabled: true,
    frequency: 6,
    retentionDays: 30,
    includeMedia: true,
  }
};

// Environment Configuration Manager
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentConfig: EnvironmentConfig;

  private constructor() {
    this.currentConfig = this.loadConfig();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  public getConfig(): EnvironmentConfig {
    return this.currentConfig;
  }

  private loadConfig(): EnvironmentConfig {
    const env = process.env.NODE_ENV || 'development';
    let config: EnvironmentConfig;

    switch (env) {
      case 'production':
        config = productionConfig;
        break;
      case 'staging':
        config = stagingConfig;
        break;
      default:
        config = developmentConfig;
    }

    // Validate configuration
    const result = EnvironmentConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid environment configuration: ${result.error}`);
    }

    return config;
  }
}

export const environmentManager = EnvironmentManager.getInstance();
