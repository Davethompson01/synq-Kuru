
import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RainbowWalletConnectionProps {
  onWalletConnected: (address: string) => void;
}

export const RainbowWalletConnection = ({ onWalletConnected }: RainbowWalletConnectionProps) => {
  const { address, isConnected } = useAccount();

  React.useEffect(() => {
    if (isConnected && address) {
      onWalletConnected(address);
    }
  }, [isConnected, address, onWalletConnected]);

  if (isConnected && address) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Wallet Connected</p>
              <p className="text-xs text-green-600">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Connect Wallet Required</p>
              <p className="text-xs text-orange-600">
                Connect your wallet to participate in voting
              </p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </CardContent>
    </Card>
  );
};
