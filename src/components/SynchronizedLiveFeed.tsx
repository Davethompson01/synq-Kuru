
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, User, ShoppingBag } from 'lucide-react';
import { supabaseService, DatabaseActivity } from '@/services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

export const SynchronizedLiveFeed = () => {
  const [activities, setActivities] = useState<DatabaseActivity[]>([]);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadInitialData = async () => {
      const recentActivity = await supabaseService.getRecentActivity();
      setActivities(recentActivity);
      
      const users = new Set(recentActivity.map(activity => activity.user_address));
      setActiveUsers(users);
    };

    loadInitialData();

    let activityChannel: RealtimeChannel;
    
    activityChannel = supabaseService.subscribeToActivity((newActivity) => {
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
      setActiveUsers(prev => new Set([...prev, newActivity.user_address]));
    });

    return () => {
      if (activityChannel) {
        activityChannel.unsubscribe();
      }
    };
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getActivityIcon = (type: DatabaseActivity['activity_type']) => {
    switch (type) {
      case 'vote_up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'vote_down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'buy':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'join':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: DatabaseActivity) => {
    const address = formatAddress(activity.user_address);
    
    switch (activity.activity_type) {
      case 'vote_up':
        return `${address} voted UP on ${activity.token_symbol}`;
      case 'vote_down':
        return `${address} voted DOWN on ${activity.token_symbol}`;
      case 'buy':
        return `${address} bought ${activity.amount} ${activity.token_symbol}`;
      case 'join':
        return `${address} joined the session`;
      default:
        return `${address} performed an action`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Activity Feed</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              {activeUsers.size} active
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.created_at)}
                  </p>
                </div>
                {index < 3 && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
