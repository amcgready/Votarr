// src/config/deployment.ts
import { 
  ECSClient, 
  UpdateServiceCommand,
  DescribeServicesCommand,
  RegisterTaskDefinitionCommand 
} from "@aws-sdk/client-ecs";
import { 
  CloudWatchClient, 
  GetMetricDataCommand 
} from "@aws-sdk/client-cloudwatch";
import { logger } from './logger';
import { monitoring } from './monitoring';

export class DeploymentService {
  private ecsClient: ECSClient;
  private cwClient: CloudWatchClient;

  constructor() {
    this.ecsClient = new ECSClient({ region: process.env.AWS_REGION });
    this.cwClient = new CloudWatchClient({ region: process.env.AWS_REGION });
  }

  async deployNewVersion(environment: string, version: string) {
    try {
      // Store current version for potential rollback
      const currentVersion = await this.getCurrentVersion(environment);
      
      // Deploy new version
      await this.updateECSService(environment, version);
      
      // Monitor deployment health
      const isHealthy = await this.monitorDeploymentHealth(environment);
      
      if (!isHealthy) {
        logger.warn(`Deployment of version ${version} shows unhealthy metrics, initiating rollback`);
        await this.rollback(environment, currentVersion);
        throw new Error('Deployment failed health checks');
      }

      logger.info(`Successfully deployed version ${version} to ${environment}`);
    } catch (error) {
      logger.error('Deployment failed:', error);
      throw error;
    }
  }

  async rollback(environment: string, targetVersion: string) {
    try {
      logger.info(`Initiating rollback to version ${targetVersion} in ${environment}`);

      // 1. Update ECS service to previous version
      await this.updateECSService(environment, targetVersion);

      // 2. Verify rollback success
      const isRollbackSuccessful = await this.monitorDeploymentHealth(environment);
      
      if (!isRollbackSuccessful) {
        throw new Error('Rollback failed health checks');
      }

      // 3. Update deployment markers
      await this.updateDeploymentMarkers(environment, targetVersion);

      logger.info(`Successfully rolled back to version ${targetVersion}`);
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  private async monitorDeploymentHealth(environment: string): Promise<boolean> {
    const metrics = [
      { name: 'ErrorRate', threshold: 5 }, // Error rate below 5%
      { name: 'APILatency', threshold: 1000 }, // Latency below 1000ms
      { name: 'CPUUtilization', threshold: 80 }, // CPU below 80%
      { name: 'MemoryUtilization', threshold: 80 } // Memory below 80%
    ];

    for (let i = 0; i < 10; i++) { // Check for 5 minutes (30 seconds interval)
      const healthyMetrics = await this.checkMetrics(environment, metrics);
      
      if (!healthyMetrics) {
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    return true;
  }

  private async checkMetrics(environment: string, metrics: any[]): Promise<boolean> {
    const command = new GetMetricDataCommand({
      MetricDataQueries: metrics.map((metric, index) => ({
        Id: `m${index}`,
        MetricStat: {
          Metric: {
            Namespace: 'Votarr',
            MetricName: metric.name,
            Dimensions: [{ Name: 'Environment', Value: environment }]
          },
          Period: 300,
          Stat: 'Average'
        }
      })),
      StartTime: new Date(Date.now() - 300
      // src/config/deployment.ts (continued from previous)
  private async checkMetrics(environment: string, metrics: any[]): Promise<boolean> {
    const command = new GetMetricDataCommand({
      MetricDataQueries: metrics.map((metric, index) => ({
        Id: `m${index}`,
        MetricStat: {
          Metric: {
            Namespace: 'Votarr',
            MetricName: metric.name,
            Dimensions: [{ Name: 'Environment', Value: environment }]
          },
          Period: 300,
          Stat: 'Average'
        }
      })),
      StartTime: new Date(Date.now() - 300000), // Last 5 minutes
      EndTime: new Date()
    });

    try {
      const response = await this.cwClient.send(command);
      
      // Check if any metrics exceed their thresholds
      return response.MetricDataResults?.every((result, index) => {
        const latestValue = result.Values?.[0] ?? 0;
        return latestValue <= metrics[index].threshold;
      }) ?? false;
    } catch (error) {
      logger.error('Failed to check metrics:', error);
      return false;
    }
  }

  private async updateECSService(environment: string, version: string) {
    const command = new UpdateServiceCommand({
      cluster: `votarr-${environment}`,
      service: `votarr-service-${environment}`,
      taskDefinition: `votarr-task-${version}`,
      forceNewDeployment: true
    });

    try {
      await this.ecsClient.send(command);
      logger.info(`Updated ECS service to version ${version}`);
    } catch (error) {
      logger.error('Failed to update ECS service:', error);
      throw error;
    }
  }

  private async getCurrentVersion(environment: string): Promise<string> {
    const command = new DescribeServicesCommand({
      cluster: `votarr-${environment}`,
      services: [`votarr-service-${environment}`]
    });

    try {
      const response = await this.ecsClient.send(command);
      const taskDef = response.services?.[0].taskDefinition;
      return taskDef?.split('/').pop() ?? 'unknown';
    } catch (error) {
      logger.error('Failed to get current version:', error);
      throw error;
    }
  }

  private async updateDeploymentMarkers(environment: string, version: string) {
    try {
      // Update deployment tracking in DynamoDB
      await this.updateDeploymentRecord(environment, version);
      
      // Update monitoring tags
      await monitoring.setDeploymentTag(environment, version);
      
      // Update health check version expectations
      await this.updateHealthCheckVersion(environment, version);
    } catch (error) {
      logger.error('Failed to update deployment markers:', error);
      throw error;
    }
  }

  private async updateDeploymentRecord(environment: string, version: string) {
    // Implementation for updating deployment record in DynamoDB
    // This would track deployment history and current version
  }

  private async updateHealthCheckVersion(environment: string, version: string) {
    // Implementation for updating health check version expectations
    // This would ensure health checks validate against correct version
  }
}

export const deploymentService = new DeploymentService();
