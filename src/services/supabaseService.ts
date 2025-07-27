
import { supabase } from '@/integrations/supabase/client';

export interface DatabaseRound {
  id: string;
  round_number: number;
  token_symbol: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface DatabaseVote {
  id: string;
  round_id: string;
  user_address: string;
  vote_direction: 'up' | 'down';
  token_symbol: string;
  voted_at: string;
}

export interface DatabaseActivity {
  id: string;
  user_address: string;
  activity_type: 'join' | 'vote_up' | 'vote_down' | 'buy';
  token_symbol?: string;
  amount?: number;
  round_id?: string;
  created_at: string;
}

export class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {}

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Round management
  async createRound(tokenSymbol: string, durationSeconds: number = 300): Promise<DatabaseRound | null> {
    const endTime = new Date(Date.now() + durationSeconds * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('voting_rounds')
      .insert({
        token_symbol: tokenSymbol,
        end_time: endTime,
        duration_seconds: durationSeconds,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating round:', error);
      return null;
    }

    return data as DatabaseRound;
  }

  async getCurrentRound(tokenSymbol: string): Promise<DatabaseRound | null> {
    const { data, error } = await supabase
      .from('voting_rounds')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current round:', error);
      return null;
    }

    return data as DatabaseRound | null;
  }

  async endRound(roundId: string): Promise<boolean> {
    const { error } = await supabase
      .from('voting_rounds')
      .update({ is_active: false })
      .eq('id', roundId);

    if (error) {
      console.error('Error ending round:', error);
      return false;
    }

    return true;
  }

  // Vote management
  async castVote(roundId: string, userAddress: string, voteDirection: 'up' | 'down', tokenSymbol: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_votes')
      .insert({
        round_id: roundId,
        user_address: userAddress,
        vote_direction: voteDirection,
        token_symbol: tokenSymbol
      });

    if (error) {
      console.error('Error casting vote:', error);
      return false;
    }

    return true;
  }

  async getUserVote(roundId: string, userAddress: string): Promise<DatabaseVote | null> {
    const { data, error } = await supabase
      .from('user_votes')
      .select('*')
      .eq('round_id', roundId)
      .eq('user_address', userAddress)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user vote:', error);
      return null;
    }

    // Type assertion to ensure proper typing
    return data ? {
      ...data,
      vote_direction: data.vote_direction as 'up' | 'down'
    } as DatabaseVote : null;
  }

  async getRoundVotes(roundId: string): Promise<{ up: number; down: number; total: number }> {
    const { data, error } = await supabase
      .from('user_votes')
      .select('vote_direction')
      .eq('round_id', roundId);

    if (error) {
      console.error('Error fetching round votes:', error);
      return { up: 0, down: 0, total: 0 };
    }

    const upVotes = data.filter(vote => vote.vote_direction === 'up').length;
    const downVotes = data.filter(vote => vote.vote_direction === 'down').length;

    return {
      up: upVotes,
      down: downVotes,
      total: upVotes + downVotes
    };
  }

  // Activity tracking
  async addActivity(userAddress: string, activityType: DatabaseActivity['activity_type'], tokenSymbol?: string, amount?: number, roundId?: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_address: userAddress,
        activity_type: activityType,
        token_symbol: tokenSymbol,
        amount: amount,
        round_id: roundId
      });

    if (error) {
      console.error('Error adding activity:', error);
      return false;
    }

    return true;
  }

  async getRecentActivity(): Promise<DatabaseActivity[]> {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching activity:', error);
      return [];
    }

    // Type assertion to ensure proper typing
    return (data || []).map(activity => ({
      ...activity,
      activity_type: activity.activity_type as DatabaseActivity['activity_type']
    })) as DatabaseActivity[];
  }

  // Real-time subscriptions
  subscribeToRounds(tokenSymbol: string, callback: (round: DatabaseRound) => void) {
    return supabase
      .channel('voting_rounds_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voting_rounds',
          filter: `token_symbol=eq.${tokenSymbol}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as DatabaseRound);
          }
        }
      )
      .subscribe();
  }

  subscribeToVotes(roundId: string, callback: (vote: DatabaseVote) => void) {
    return supabase
      .channel('votes_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_votes',
          filter: `round_id=eq.${roundId}`
        },
        (payload) => {
          if (payload.new) {
            const vote = {
              ...payload.new,
              vote_direction: payload.new.vote_direction as 'up' | 'down'
            } as DatabaseVote;
            callback(vote);
          }
        }
      )
      .subscribe();
  }

  subscribeToActivity(callback: (activity: DatabaseActivity) => void) {
    return supabase
      .channel('activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity'
        },
        (payload) => {
          if (payload.new) {
            const activity = {
              ...payload.new,
              activity_type: payload.new.activity_type as DatabaseActivity['activity_type']
            } as DatabaseActivity;
            callback(activity);
          }
        }
      )
      .subscribe();
  }

  // Cleanup functions
  async cleanupOldActivity(): Promise<boolean> {
    const { error } = await supabase.rpc('cleanup_old_activity');
    
    if (error) {
      console.error('Error cleaning up old activity:', error);
      return false;
    }

    return true;
  }

  async endExpiredRounds(): Promise<boolean> {
    const { error } = await supabase.rpc('end_expired_rounds');
    
    if (error) {
      console.error('Error ending expired rounds:', error);
      return false;
    }

    return true;
  }
}

export const supabaseService = SupabaseService.getInstance();
