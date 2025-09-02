import { createClient } from '@supabase/supabase-js';

export interface VoteLogEntry {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  userIp: string;
  userAgent: string;
  timestamp: Date;
  sessionId: string;
  requestId: string;
  metadata: Record<string, any>;
}

export interface RequestInfo {
  ip: string;
  userAgent: string;
  sessionId: string;
  requestId: string;
  headers?: Record<string, string>;
  method?: string;
  url?: string;
}

export class VoteLogger {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Log a vote with comprehensive metadata
   */
  static async logVote(
    voteData: Omit<VoteLogEntry, 'id' | 'timestamp'>,
    requestInfo?: RequestInfo
  ): Promise<void> {
    try {
      const logEntry: VoteLogEntry = {
        ...voteData,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        metadata: {
          ...voteData.metadata,
          loggedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          ...(requestInfo && {
            requestMethod: requestInfo.method,
            requestUrl: requestInfo.url,
            requestHeaders: requestInfo.headers
          })
        }
      };

      // Store in database
      const { error } = await this.supabase
        .from('vote_logs')
        .insert({
          id: logEntry.id,
          poll_id: logEntry.pollId,
          option_id: logEntry.optionId,
          user_id: logEntry.userId,
          user_ip: logEntry.userIp,
          user_agent: logEntry.userAgent,
          session_id: logEntry.sessionId,
          request_id: logEntry.requestId,
          metadata: logEntry.metadata,
          created_at: logEntry.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to log vote to database:', error);
        // Fallback to console logging
        this.fallbackLog(logEntry);
      }

      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Vote logged:', {
          id: logEntry.id,
          pollId: logEntry.pollId,
          optionId: logEntry.optionId,
          userId: logEntry.userId,
          timestamp: logEntry.timestamp,
          userIp: logEntry.userIp
        });
      }
    } catch (error) {
      console.error('Failed to log vote:', error);
      // Don't throw - logging failure shouldn't break voting
    }
  }

  /**
   * Get vote history for a specific poll
   */
  static async getVoteHistory(pollId: string): Promise<VoteLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('vote_logs')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve vote history: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        pollId: row.poll_id,
        optionId: row.option_id,
        userId: row.user_id,
        userIp: row.user_ip,
        userAgent: row.user_agent,
        timestamp: new Date(row.created_at),
        sessionId: row.session_id,
        requestId: row.request_id,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to get vote history:', error);
      return [];
    }
  }

  /**
   * Get vote history for a specific user
   */
  static async getUserVoteHistory(userId: string): Promise<VoteLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('vote_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve user vote history: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        pollId: row.poll_id,
        optionId: row.option_id,
        userId: row.user_id,
        userIp: row.user_ip,
        userAgent: row.user_agent,
        timestamp: new Date(row.created_at),
        sessionId: row.session_id,
        requestId: row.request_id,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to get user vote history:', error);
      return [];
    }
  }

  /**
   * Get vote statistics for a poll
   */
  static async getVoteStats(pollId: string): Promise<{
    totalVotes: number;
    uniqueUsers: number;
    votesByOption: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('vote_logs')
        .select('*')
        .eq('poll_id', pollId);

      if (error) {
        throw new Error(`Failed to retrieve vote stats: ${error.message}`);
      }

      const votes = data || [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const uniqueUsers = new Set(votes.map(v => v.user_id)).size;
      const votesByOption: Record<string, number> = {};
      const recentActivity = votes.filter(v => 
        new Date(v.created_at) > oneHourAgo
      ).length;

      votes.forEach(vote => {
        votesByOption[vote.option_id] = (votesByOption[vote.option_id] || 0) + 1;
      });

      return {
        totalVotes: votes.length,
        uniqueUsers,
        votesByOption,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get vote stats:', error);
      return {
        totalVotes: 0,
        uniqueUsers: 0,
        votesByOption: {},
        recentActivity: 0
      };
    }
  }

  /**
   * Get suspicious voting patterns
   */
  static async getSuspiciousVotes(pollId: string): Promise<VoteLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('vote_logs')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve votes for analysis: ${error.message}`);
      }

      const votes = data || [];
      const suspiciousVotes: VoteLogEntry[] = [];

      // Group votes by IP address
      const votesByIp: Record<string, VoteLogEntry[]> = {};
      votes.forEach(vote => {
        const ip = vote.user_ip;
        if (!votesByIp[ip]) {
          votesByIp[ip] = [];
        }
        votesByIp[ip].push({
          id: vote.id,
          pollId: vote.poll_id,
          optionId: vote.option_id,
          userId: vote.user_id,
          userIp: vote.user_ip,
          userAgent: vote.user_agent,
          timestamp: new Date(vote.created_at),
          sessionId: vote.session_id,
          requestId: vote.request_id,
          metadata: vote.metadata || {}
        });
      });

      // Check for suspicious patterns
      Object.entries(votesByIp).forEach(([ip, ipVotes]) => {
        // Multiple votes from same IP in short time
        if (ipVotes.length > 3) {
          const timeSpan = ipVotes[0].timestamp.getTime() - 
                          ipVotes[ipVotes.length - 1].timestamp.getTime();
          if (timeSpan < 5 * 60 * 1000) { // 5 minutes
            suspiciousVotes.push(...ipVotes);
          }
        }

        // Multiple users from same IP
        const uniqueUsers = new Set(ipVotes.map(v => v.userId));
        if (uniqueUsers.size > 2) {
          suspiciousVotes.push(...ipVotes);
        }
      });

      return suspiciousVotes;
    } catch (error) {
      console.error('Failed to get suspicious votes:', error);
      return [];
    }
  }

  /**
   * Fallback logging when database is unavailable
   */
  private static fallbackLog(logEntry: VoteLogEntry): void {
    console.error('Vote logging fallback:', {
      message: 'Database logging failed, using fallback',
      voteData: {
        id: logEntry.id,
        pollId: logEntry.pollId,
        optionId: logEntry.optionId,
        userId: logEntry.userId,
        timestamp: logEntry.timestamp.toISOString(),
        userIp: logEntry.userIp
      }
    });
  }

  /**
   * Clean up old vote logs (for maintenance)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.supabase
        .from('vote_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup old logs: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }

  /**
   * Export vote logs for analysis
   */
  static async exportVoteLogs(
    pollId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<VoteLogEntry[]> {
    try {
      let query = this.supabase
        .from('vote_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (pollId) {
        query = query.eq('poll_id', pollId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to export vote logs: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        pollId: row.poll_id,
        optionId: row.option_id,
        userId: row.user_id,
        userIp: row.user_ip,
        userAgent: row.user_agent,
        timestamp: new Date(row.created_at),
        sessionId: row.session_id,
        requestId: row.request_id,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to export vote logs:', error);
      return [];
    }
  }
}
