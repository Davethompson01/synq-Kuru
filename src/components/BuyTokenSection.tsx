
import { useState } from 'react';
import { ShoppingCart, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BuyTokenSectionProps {
  token: {
    symbol: string;
    price: number;
  };
  onBuyToken: (amount: number) => void;
}

export const BuyTokenSection = ({ token, onBuyToken }: BuyTokenSectionProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock wallet balance
  const [walletBalance] = useState(1500.00);
  
  const amountNumber = parseFloat(amount) || 0;
  const totalCost = amountNumber * token.price;
  const canAfford = totalCost <= walletBalance && totalCost > 0;

  const handleBuy = async () => {
    if (!canAfford || isLoading) return;
    
    setIsLoading(true);
    
    // Simulate transaction delay
    setTimeout(() => {
      onBuyToken(amountNumber);
      setAmount('');
      setIsLoading(false);
    }, 2000);
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5" />
          <span>Buy {token.symbol} Tokens</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount of {token.symbol}</label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-lg h-12 pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {token.symbol}
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs"
                >
                  {quickAmount}
                </Button>
              ))}
            </div>

            {/* Transaction Summary */}
            {amountNumber > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price per {token.symbol}</span>
                  <span>${token.price.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span>{amountNumber} {token.symbol}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Info & Buy Button */}
          <div className="space-y-4">
            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Wallet Balance</span>
              </div>
              <div className="text-xl font-bold">${walletBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">USDC</div>
            </div>

            <Button
              onClick={handleBuy}
              disabled={!canAfford || isLoading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : !canAfford && totalCost > 0 ? (
                'Insufficient Balance'
              ) : (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Buy Now</span>
                </div>
              )}
            </Button>

            {!canAfford && totalCost > walletBalance && totalCost > 0 && (
              <p className="text-xs text-red-500 text-center">
                Need ${(totalCost - walletBalance).toFixed(2)} more
              </p>
            )}
          </div>
        </div>

        {/* Market Info */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="font-semibold">$2.4M</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="font-semibold">$125M</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Holders</div>
            <div className="font-semibold">8,432</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
