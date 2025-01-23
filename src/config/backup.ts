// src/config/backup.ts
import { 
  BackupClient, 
  StartBackupJobCommand,
  StartRestoreJobCommand 
} from "@aws-sdk/client-backup";
import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand 
} from "@aws-sdk/client-s3";
import { 
  RDSClient,
  CreateDBSnapshotCommand,
  RestoreDBInstanceFromDBSnapshotCommand 
} from "@aws-sdk/client-rds";
import { logger } from './logger';

export class BackupService {
  private backupClient: BackupClient;
  private s3Client: S3Client;
  private rdsClient: RDSClient;

  constructor() {
    this.backupClient = new BackupClient({ region: process.env.AWS_REGION });
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.rdsClient = new RDSClient({ region: process.env.AWS_REGION });
  }

  // Database Backup Methods
  async createDatabaseBackup(environment: string) {
    const timestamp = new Date().toISOString();
    const snapshotIdentifier = `votarr-${environment}-${timestamp}`;

    try {
      const command = new CreateDBSnapshotCommand({
        DBSnapshotIdentifier: snapshotIdentifier,
        DBInstanceIdentifier: `votarr-${environment}`
      });

      await this.rdsClient.send(command);
      logger.info(`Database backup created: ${snapshotIdentifier}`);

      return snapshotIdentifier;
    } catch (error) {
      logger.error('Failed to create database backup:', error);
      throw error;
    }
  }

  async restoreDatabase(environment: string, snapshotIdentifier: string) {
    try {
      const command = new RestoreDBInstanceFromDBSnapshotCommand({
        DBInstanceIdentifier: `votarr-${environment}-restored`,
        DBSnapshotIdentifier: snapshotIdentifier,
        PubliclyAccessible: false
      });

      await this.rdsClient.send(command);
      logger.info(`Database restored from snapshot: ${snapshotIdentifier}`);
    } catch (error) {
      logger.error('Failed to restore database:', error);
      throw error;
    }
  }

  // Application State Backup Methods
  async backupApplicationState(environment: string) {
    const timestamp = new Date().toISOString();
    const backupId = `state-${environment}-${timestamp}`;

    try {
      const command = new StartBackupJobCommand({
        BackupVaultName: `votarr-${environment}`,
        ResourceArn: process.env.ECS_CLUSTER_ARN,
        IamRoleArn: process.env.BACKUP_ROLE_ARN,
        RecoveryPointTags: {
          Environment: environment,
          Timestamp: timestamp
        }
      });

      await this.backupClient.send(command);
      logger.info(`Application state backup created: ${backupId}`);

      return backupId;
    } catch (error) {
      logger.error('Failed to backup application state:', error);
      throw error;
    }
  }

  // File Storage Backup Methods
  async backupFileStorage(environment: string) {
    const timestamp = new Date().toISOString();
    const backupKey = `file-backup-${environment}-${timestamp}.zip`;

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: backupKey,
        Metadata: {
          environment,
          timestamp
        }
      }));

      logger.info(`File storage backup created: ${backupKey}`);
      return backupKey;
    } catch (error) {
      logger.error('Failed to backup file storage:', error);
      throw error;
    }
  }

  // Disaster Recovery Methods
  async initiateDisasterRecovery(environment: string) {
    try {
      // 1. Get latest backup information
      const latestBackups = await this.getLatestBackups(environment);

      // 2. Restore database
      await this.restoreDatabase(environment, latestBackups.databaseSnapshot);

      // 3. Restore application state
      await this.restoreApplicationState(environment, latestBackups.stateBackup);

      // 4. Restore file storage
      await this.restoreFileStorage(environment, latestBackups.fileBackup);

      logger.info(`Disaster recovery completed for environment: ${environment}`);
    } catch (error) {
      logger.error('Disaster recovery failed:', error);
      throw error;
    }
  }

  private async getLatestBackups(environment: string) {
    // Implementation to get latest backup information
    // This would query AWS Backup, RDS snapshots, and S3 for the most recent backups
    return {
      databaseSnapshot: '',
      stateBackup: '',
      fileBackup: ''
    };
  }

  private async restoreApplicationState(environment: string, backupId: string) {
    try {
      const command = new StartRestoreJobCommand({
        RecoveryPointArn: backupId,
        ResourceType: 'ECS',
        IamRoleArn: process.env.BACKUP_ROLE_ARN
      });

      await this.backupClient.send(command);
      logger.info(`Application state restored from backup: ${backupId}`);
    } catch (error) {
      logger.error('Failed to restore application state:', error);
      throw error;
    }
  }

  private async restoreFileStorage(environment: string, backupKey: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: backupKey
      });

      await this.s3Client.send(command);
      logger.info(`File storage restored from backup: ${backupKey}`);
    } catch (error) {
      logger.error('Failed to restore file storage:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService();
