// src/lib/database/QueryOptimizer.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { AdvancedCache } from '../cache/AdvancedCache';
import DataLoader from 'dataloader';

export class QueryOptimizer {
  private prisma: PrismaClient;
  private cache: AdvancedCache;
  private loaders: Map<string, DataLoader<any, any>>;

  constructor(prisma: PrismaClient, cache: AdvancedCache) {
    this.prisma = prisma;
    this.cache = cache;
    this.loaders = this.setupDataLoaders();
  }

  private setupDataLoaders(): Map<string, DataLoader<any, any>> {
    return new Map([
      ['user', new DataLoader(async (ids: string[]) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: ids } }
        });
        return ids.map(id => users.find(user => user.id === id));
      })],
      ['media', new DataLoader(async (ids: string[]) => {
        const media = await this.prisma.media.findMany({
          where: { id: { in: ids } }
        });
        return ids.map(id => media.find(m => m.id === id));
      })],
      ['session', new DataLoader(async (ids: string[]) => {
        const sessions = await this.prisma.session.findMany({
          where: { id: { in: ids } }
        });
        return ids.map(id => sessions.find(session => session.id === id));
      })]
    ]);
  }

  // Optimized complex queries
  async getSessionWithDetails(sessionId: string) {
    const cacheKey = `session:${sessionId}:details`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;

    const result = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        votes: {
          include: {
            media: true
          }
        },
        participants: true
      }
    });

    if (result) {
      await this.cache.set(cacheKey, result, { ttl: 300000 }); // 5 minutes
    }

    return result;
  }

  // Query result reuse
  async getActiveSessionsByUser(userId: string) {
    const query = Prisma.sql`
      WITH UserSessions AS (
        SELECT 
          s.*,
          COUNT(DISTINCT v.id) as vote_count,
          COUNT(DISTINCT p.user_id) as participant_count
        FROM Session s
        LEFT JOIN Vote v ON v.session_id = s.id
        LEFT JOIN SessionParticipant p ON p.session_id = s.id
        WHERE s.owner_id = ${userId}
          AND s.status = 'active'
        GROUP BY s.id
      )
      SELECT * FROM UserSessions
      ORDER BY created_at DESC
    `;

    return this.prisma.$queryRaw(query);
  }

  // Join optimization
  async getVoteResults(sessionId: string, round: number) {
    const query = Prisma.sql`
      SELECT 
        m.id as media_id,
        m.title,
        COUNT(CASE WHEN v.vote_type = 'UPVOTE' THEN 1 END) as upvotes,
        COUNT(CASE WHEN v.vote_type = 'DOWNVOTE' THEN 1 END) as downvotes,
        COUNT(DISTINCT v.user_id) as total_voters
      FROM Media m
      LEFT JOIN Vote v ON v.media_id = m.id
      WHERE v.session_id = ${sessionId}
        AND v.round = ${round}
      GROUP BY m.id, m.title
    `;

    return this.prisma.$queryRaw(query);
  }

  // Batch loading optimization
  async getUsersWithVotes(sessionId: string) {
    const participants = await this.prisma.sessionParticipant.findMany({
      where: { sessionId }
    });

    const userIds = participants.map(p => p.userId);
    const users = await Promise.all(
      userIds.map(id => this.loaders.get('user')!.load(id))
    );

    const votes = await this.prisma.vote.groupBy({
      by: ['userId'],
      where: { sessionId },
      _count: true
    });

    return users.map(user => ({
      ...user,
      voteCount: votes.find(v => v.userId === user!.id)?._count ?? 0
    }));
  }

  // Transaction optimization
  async createSessionWithParticipants(
    sessionData: Prisma.SessionCreateInput,
    participantIds: string[]
  ) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: sessionData
      });

      await tx.sessionParticipant.createMany({
        data: participantIds.map(userId => ({
          sessionId: session.id,
          userId
        }))
      });

      return session;
    }, {
      maxWait: 5000,
      timeout: 10000
    });
  }

  // Query plan optimization
  async analyzeQuery(query: string): Promise<string> {
    const plan = await this.prisma.$queryRaw`EXPLAIN ANALYZE ${Prisma.raw(query)}`;
    return JSON.stringify(plan, null, 2);
  }

  // Cache invalidation optimization
  async invalidateRelatedQueries(entityType: string, id: string) {
    const patterns = [
      `${entityType}:${id}`,
      `${entityType}:${id}:*`,
      `*:${entityType}:${id}`
    ];

    await Promise.all(patterns.map(pattern => 
      this.cache.invalidate(pattern)
    ));
  }

  // Index optimization helper
  async suggestIndexes(): Promise<string[]> {
    const queries = await this.prisma.$queryRaw`
      SELECT 
        schemaname || '.' || tablename as table,
        indexname as index,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;

    return this.analyzeIndexUsage(queries);
  }

  private analyzeIndexUsage(indexStats: any[]): string[] {
    const suggestions: string[] = [];
    
    for (const stat of indexStats) {
      if (stat.scans === 0 && !stat.index.includes('pkey')) {
        suggestions.push(`Consider dropping unused index: ${stat.index}`);
      }
      if (stat.tuples_read > 0 && stat.tuples_fetched / stat.tuples_read < 0.01) {
        suggestions.push(`Consider analyzing index efficiency: ${stat.index}`);
      }
    }

    return suggestions;
  }

  // Query monitoring
  async getSlowQueries(threshold: number = 1000): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time / calls as avg_time,
        rows / calls as avg_rows
      FROM pg_stat_statements
      WHERE total_time / calls > ${threshold}
      ORDER BY avg_time DESC
      LIMIT 10
    `;
  }
}
