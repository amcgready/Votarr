// src/config/monitoring-dashboard.ts
import { CloudWatchClient, PutDashboardCommand } from "@aws-sdk/client-cloudwatch";

export class DashboardConfig {
  private client: CloudWatchClient;
  
  constructor() {
    this.client = new CloudWatchClient({ region: process.env.AWS_REGION });
  }

  async createDashboard(environment: string) {
    const command = new PutDashboardCommand({
      DashboardName: `Votarr-${environment}`,
      DashboardBody: JSON.stringify({
        widgets: [
          // Application Health
          {
            type: "metric",
            properties: {
              metrics: [
                ["Votarr", "ApplicationErrors", "Environment", environment],
                [".", "APILatency", ".", "."],
                [".", "WebSocketConnections", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: process.env.AWS_REGION,
              title: "Application Health"
            }
          },
          // User Activity
          {
            type: "metric",
            properties: {
              metrics: [
                ["Votarr", "ActiveSessions", "Environment", environment],
                [".", "ActiveUsers", ".", "."],
                [".", "VotesPerMinute", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: process.env.AWS_REGION,
              title: "User Activity"
            }
          },
          // Database Performance
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", `votarr-${environment}`],
                [".", "DatabaseConnections", ".", "."],
                [".", "ReadIOPS", ".", "."],
                [".", "WriteIOPS", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: process.env.AWS_REGION,
              title: "Database Performance"
            }
          },
          // API Performance
          {
            type: "metric",
            properties: {
              metrics: [
                ["Votarr", "APIRequestCount", "Environment", environment],
                [".", "APIErrorRate", ".", "."],
                [".", "API4xxErrors", ".", "."],
                [".", "API5xxErrors", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: process.env.AWS_REGION,
              title: "API Performance"
            }
          },
          // Infrastructure Health
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ECS", "CPUUtilization", "ClusterName", `votarr-${environment}`],
                [".", "MemoryUtilization", ".", "."],
                ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", `votarr-${environment}`],
                [".", "NetworkBytesIn", ".", "."],
                [".", "NetworkBytesOut", ".", "."]
              ],
              view: "timeSeries",
              stacked: false,
              region: process.env.AWS_REGION,
              title: "Infrastructure Health"
            }
          }
        ]
      })
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      throw error;
    }
  }
}

export const dashboardConfig = new DashboardConfig();
