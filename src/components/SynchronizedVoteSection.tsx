
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Clock, Vote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RainbowWalletConnection } from './RainbowWalletConnection';
import { supabaseService, DatabaseRound, DatabaseVote } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SynchronizedVoteSectionProps {
  onVote: (direction: 'up' | 'down') => void;
  token: {
    symbol: string;
  };
}

export const SynchronizedVoteSection = ({ onVote, token }: SynchronizedVoteSectionProps) => {
  const [currentRound, setCurrentRound] = useState<DatabaseRound | null>(null);
  const [userVote, setUserVote] = useState<DatabaseVote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteStats, setVoteStats] = useState({ up: 0, down: 0, totalVoters: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    let mounted = true;
    let roundsChannel: RealtimeChannel | null = null;
    let votesChannel: RealtimeChannel | null = null;

    const initializeRound = async () => {
      if (!mounted) return;
      
      setIsInitializing(true);
      
      try {
        await supabaseService.endExpiredRounds();
        
        let round = await supabaseService.getCurrentRound(token.symbol);
        
        if (!round && mounted) {
          round = await supabaseService.createRound(token.symbol, 300);
        }
        
        if (round && mounted) {
          setCurrentRound(round);
          await updateVoteStats(round.id);
          
          if (address) {
            const existingVote = await supabaseService.getUserVote(round.id, address);
            setUserVote(existingVote);
          }

          votesChannel = supabaseService.subscribeToVotes(round.id, async (vote) => {
            if (!mounted) return;
            await updateVoteStats(round.id);
            
            if (address && vote.user_address === address) {
              setUserVote(vote);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing round:', error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    roundsChannel = supabaseService.subscribeToRounds(token.symbol, async (round) => {
      if (!mounted) return;
      
      if (!currentRound || round.id !== currentRound.id || round.is_active !== currentRound.is_active) {
        setCurrentRound(round);
        
        if (round.is_active) {
          await updateVoteStats(round.id);
          
          if (address) {
            const vote = await supabaseService.getUserVote(round.id, address);
            setUserVote(vote);
          } else {
            setUserVote(null);
          }

          if (votesChannel) {
            votesChannel.unsubscribe();
          }
          votesChannel = supabaseService.subscribeToVotes(round.id, async (vote) => {
            if (!mounted) return;
            await updateVoteStats(round.id);
            if (address && vote.user_address === address) {
              setUserVote(vote);
            }
          });
        }
      }
    });

    initializeRound();

    return () => {
      mounted = false;
      if (roundsChannel) roundsChannel.unsubscribe();
      if (votesChannel) votesChannel.unsubscribe();
    };
  }, [token.symbol, address]);

  useEffect(() => {
    if (!currentRound || !currentRound.is_active) {
      setTimeLeft(0);
      return;
    }

    const timer = setInterval(() => {
      const endTime = new Date(currentRound.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeLeft(remaining);
    }, 1000);

    const endTime = new Date(currentRound.end_time).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    setTimeLeft(remaining);

    return () => clearInterval(timer);
  }, [currentRound]);

  const updateVoteStats = async (roundId: string) => {
    try {
      const stats = await supabaseService.getRoundVotes(roundId);
      setVoteStats({
        up: stats.up,
        down: stats.down,
        totalVoters: stats.total
      });
    } catch (error) {
      console.error('Error updating vote stats:', error);
    }
  };

  const handleWalletConnected = async (connectedAddress: string) => {
    try {
      await supabaseService.addActivity(connectedAddress, 'join', token.symbol);
      
      if (currentRound) {
        const existingVote = await supabaseService.getUserVote(currentRound.id, connectedAddress);
        setUserVote(existingVote);
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
    }
  };

  const handleVote = async (direction: 'up' | 'down') => {
    if (!currentRound?.is_active || userVote || !isConnected || !address || isSubmitting || isInitializing) {
      if (!isConnected) {
        toast({
          title: "Connect Wallet",
          description: "Please connect your wallet to vote",
          variant: "destructive",
        });
      } else if (userVote) {
        toast({
          title: "Already Voted",
          description: "You have already voted in this round",
          variant: "destructive",
        });
      } else if (!currentRound?.is_active) {
        toast({
          title: "Round Inactive",
          description: "No active voting round available",
          variant: "destructive",
        });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await supabaseService.castVote(
        currentRound.id,
        address,
        direction,
        token.symbol
      );
      
      if (success) {
        await supabaseService.addActivity(
          address,
          direction === 'up' ? 'vote_up' : 'vote_down',
          token.symbol,
          undefined,
          currentRound.id
        );
        
        const newVote = await supabaseService.getUserVote(currentRound.id, address);
        setUserVote(newVote);
        
        await updateVoteStats(currentRound.id);
        
        onVote(direction);
        
        toast({
          title: "Vote Submitted",
          description: `Your ${direction.toUpperCase()} prediction for ${token.symbol} has been recorded`,
        });
      } else {
        toast({
          title: "Vote Failed",
          description: "Unable to cast vote. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const upPercentage = voteStats.up + voteStats.down > 0 
    ? Math.round((voteStats.up / (voteStats.up + voteStats.down)) * 100)
    : 50;
  const downPercentage = 100 - upPercentage;

  const isRoundActive = currentRound?.is_active && timeLeft > 0;
  const canVote = isRoundActive && !userVote && isConnected && address && !isSubmitting && !isInitializing;

  if (isInitializing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Initializing voting round...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isConnected && address && (
        <Card className={userVote ? 'border-2' : ''} 
              style={{ borderColor: userVote?.vote_direction === 'up' ? 'hsl(142 76% 36%)' : userVote?.vote_direction === 'down' ? 'hsl(0 84% 60%)' : undefined }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Vote className="w-5 h-5" />
                <span>Your Prediction</span>
              </div>
              {userVote && (
                <Badge variant={userVote.vote_direction === 'up' ? 'default' : 'destructive'}>
                  {userVote.vote_direction.toUpperCase()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {userVote ? (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">
                  You voted <span className={userVote.vote_direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {userVote.vote_direction.toUpperCase()}
                  </span> for {token.symbol}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Voted at {new Date(userVote.voted_at).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {isRoundActive ? "Cast your prediction below" : "Round ended - New round starting soon"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Community Prediction</span>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{voteStats.totalVoters} voters</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RainbowWalletConnection onWalletConnected={handleWalletConnected} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => handleVote('up')}
              disabled={!canVote}
              className={`h-16 text-base sm:text-lg font-semibold transition-all ${
                userVote?.vote_direction === 'up'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200'
              }`}
              variant={userVote?.vote_direction === 'up' ? 'default' : 'outline'}
            >
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Vote UP 📈'}
            </Button>
            
            <Button
              onClick={() => handleVote('down')}
              disabled={!canVote}
              className={`h-16 text-base sm:text-lg font-semibold transition-all ${
                userVote?.vote_direction === 'down'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200'
              }`}
              variant={userVote?.vote_direction === 'down' ? 'default' : 'outline'}
            >
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Vote DOWN 📉'}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Community Prediction</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Bullish ({voteStats.up} votes)</span>
                </span>
                <span className="font-medium">{upPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${upPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span>Bearish ({voteStats.down} votes)</span>
                </span>
                <span className="font-medium">{downPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${downPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            {!isRoundActive ? (
              <div className="text-muted-foreground">
                <Clock className="w-4 h-4 mx-auto mb-1" />
                Round ended - New round starting soon
              </div>
            ) : !isConnected ? (
              <div className="text-orange-600 font-medium">
                🔒 Connect your wallet to cast predictions
              </div>
            ) : userVote ? (
              <div className="text-primary font-medium">
                ✅ You voted {userVote.vote_direction.toUpperCase()} for {token.symbol} this round
              </div>
            ) : (
              <div className="text-muted-foreground">
                Cast your prediction for {token.symbol} price movement
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
