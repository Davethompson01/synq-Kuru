
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface TokenHeaderProps {
  token: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  };
  timeLeft: number;
  isRoundActive: boolean;
}

export const TokenHeader = ({ token, timeLeft, isRoundActive }: TokenHeaderProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPositive = token.change24h >= 0;

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Token Info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                {token.symbol.charAt(0)}
              </span>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">${token.symbol}</h1>
                <span className="text-muted-foreground">{token.name}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-xl font-semibold">${token.price.toFixed(2)}</span>
                <div className={`flex items-center space-x-1 ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          {isRoundActive && (
            <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Round ends in</div>
                <div className="text-xl font-mono font-bold text-primary">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
