// src/config/alerts.ts
import { CloudWatchClient, PutMetricAlarmCommand } from "@aws-sdk/client-cloudwatch";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

export class AlertConfig {
  private cwClient: CloudWatchClient;
  private snsClient: SNSClient;

  constructor() {
    this.cwClient = new CloudWatchClient({ region: process.env.AWS_REGION });
    this.snsClient = new SNSClient({ region: process.env.AWS_REGION });
  }

  async configureAlerts(environment: string) {
    const alerts = [
      // High Error Rate Alert
      {
        alarmName: `${environment}-high-error-rate`,
        metric: "APIErrorRate",
        threshold: 5,
        evaluationPeriods: 2,
        period: 300, // 5 minutes
        comparisonOperator: "GreaterThanThreshold",
        statistic: "Average",
        description: "API error rate exceeds 5% for 10 minutes"
      },
      
      // High API Latency Alert
      {
        alarmName: `${environment}-high-api-latency`,
        metric: "APILatency",
        threshold: 1000, // 1 second
        evaluationPeriods: 3,
        period: 300,
        comparisonOperator: "GreaterThanThreshold",
        statistic: "Average",
        description: "API latency exceeds 1 second for 15 minutes"
      },
      
      // Low Available Memory Alert
      {
        alarmName: `${environment}-low-memory`,
        metric: "MemoryUtilization",
        threshold: 85,
        evaluationPeriods: 2,
        period: 300,
        comparisonOperator: "GreaterThanThreshold",
        statistic: "Average",
        description: "Memory utilization exceeds 85% for 10 minutes"
      },
      
      // Database Connection Count Alert
      {
        alarmName: `${environment}-high-db-connections`,
        metric: "DatabaseConnections",
        threshold: 80,
        evaluationPeriods: 3,
        period: 300,
        comparisonOperator: "GreaterThanThreshold",
        statistic: "Average",
        description: "Database connection count exceeds 80% of maximum for 15 minutes"
      },
      
      // WebSocket Connection Drop Alert
      {
        alarmName: `${environment}-websocket-connections-drop`,
        metric: "WebSocketConnections",
        threshold: 50,
        evaluationPeriods: 2,
        period: 300,
        comparisonOperator: "LessThanThreshold",
        statistic: "Average",
        description: "WebSocket connections dropped below 50% of normal"
      }
    ];

    for (const alert of alerts) {
      await this.createAlarm(environment, alert);
    }
  }

  private async createAlarm(environment: string, alert: any) {
    const command = new PutMetricAlarmCommand({
      AlarmName: alert.alarmName,
      AlarmDescription: alert.description,
      MetricName: alert.metric,
      Namespace: "Votarr",
      Dimensions: [
        {
          Name: "Environment",
          Value: environment
        }
      ],
      Period: alert.period,
      EvaluationPeriods: alert.evaluationPeriods,
      Threshold: alert.threshold,
      ComparisonOperator: alert.comparisonOperator,
      Statistic: alert.statistic,
      ActionsEnabled: true,
      AlarmActions: [process.env.ALERT_SNS_TOPIC_ARN],
      OKActions: [process.env.ALERT_SNS_TOPIC_ARN]
    });

    try {
      await this.cwClient.send(command);
    } catch (error) {
      console.error(`Failed to create alarm ${alert.alarmName}:`, error);
      throw error;
    }
  }

  async sendAlert(message: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') {
    const command = new PublishCommand({
      TopicArn: process.env.ALERT_SNS_TOPIC_ARN,
      Message: JSON.stringify({
        severity,
        message,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }),
      MessageAttributes: {
        severity: {
          DataType: 'String',
          StringValue: severity
        }
      }
    });

    try {
      await this.snsClient.send(command);
    } catch (error) {
      console.error('Failed to send alert:', error);
      throw error;
    }
  }
}

export const alertConfig = new AlertConfig();
