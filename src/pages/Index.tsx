import { useState, useEffect } from 'react';
import { TokenHeader } from '@/components/TokenHeader';
import { SynchronizedLiveFeed } from '@/components/SynchronizedLiveFeed';
import { TokenChart } from '@/components/TokenChart';
import { SynchronizedVoteSection } from '@/components/SynchronizedVoteSection';
import { BuyTokenSection } from '@/components/BuyTokenSection';
import { supabaseService } from '@/services/supabaseService';

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const Index = () => {
  const [currentToken, setCurrentToken] = useState({
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 0,
    change24h: 0
  });

  const [roundTimeLeft, setRoundTimeLeft] = useState(300);
  const [isRoundActive, setIsRoundActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real cryptocurrency data from CoinGecko
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        console.log('🔄 Fetching cryptocurrency data from CoinGecko...');
        
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,cardano,solana,polkadot&order=market_cap_desc&per_page=5&page=1&sparkline=false'
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: CoinGeckoToken[] = await response.json();
        console.log(' CoinGecko API Response:', data);
        
        if (data && data.length > 0) {
          const token = data.find(t => t.symbol.toLowerCase() === 'btc') || data[0];
          
          setCurrentToken({
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            price: token.current_price,
            change24h: token.price_change_percentage_24h || 0
          });
        }
      } catch (error) {
        console.error('❌ Error fetching crypto data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Monitor current round for time display
  useEffect(() => {
    const checkCurrentRound = async () => {
      const round = await supabaseService.getCurrentRound(currentToken.symbol);
      if (round && round.is_active) {
        const endTime = new Date(round.end_time).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setRoundTimeLeft(remaining);
        setIsRoundActive(remaining > 0);
      } else {
        setIsRoundActive(false);
        setRoundTimeLeft(0);
      }
    };

    const timer = setInterval(checkCurrentRound, 1000);
    return () => clearInterval(timer);
  }, [currentToken.symbol]);

  const handleVote = (direction: 'up' | 'down') => {
    console.log(`Vote cast: ${direction} for ${currentToken.symbol}`);
  };

  const handleBuyToken = async (amount: number) => {
    console.log(`Buying ${amount} ${currentToken.symbol} tokens`);
    // You can add activity tracking here if needed
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cryptocurrency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TokenHeader 
        token={currentToken}
        timeLeft={roundTimeLeft}
        isRoundActive={isRoundActive}
      />
      
      <div className="container mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="h-[400px] xl:h-[calc(100vh-140px)]">
              <SynchronizedLiveFeed />
            </div>
          </div>
          
          <div className="xl:col-span-2 space-y-4 lg:space-y-6 order-1 xl:order-2">
            <div className="h-64 sm:h-80 lg:h-96">
              <TokenChart token={currentToken} />
            </div>
            
            <SynchronizedVoteSection 
              onVote={handleVote}
              token={currentToken}
            />
          </div>
        </div>
        
        <div className="mt-4 lg:mt-6">
          <BuyTokenSection 
            token={currentToken}
            onBuyToken={handleBuyToken}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
