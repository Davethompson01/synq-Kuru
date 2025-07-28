// import React from 'react';
// import { useAccount, useConnect, useDisconnect } from 'wagmi';
// import { CheckCircle, AlertCircle, Wallet } from 'lucide-react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';

// interface CustomWalletConnectionProps {
//   onWalletConnected: (address: string) => void;
// }

// export const CustomWalletConnection = ({ onWalletConnected }: CustomWalletConnectionProps) => {
//   const { address, isConnected } = useAccount();
//   const { connect, connectors } = useConnect();
//   const { disconnect } = useDisconnect();

//   React.useEffect(() => {
//     if (isConnected && address) {
//       onWalletConnected(address);
//     }
//   }, [isConnected, address, onWalletConnected]);

//   const handleConnect = () => {
//     const connector = connectors[0]; // Use the first available connector (usually MetaMask)
//     if (connector.ready) {
//       connect({ connector });
//     }
//   };

//   if (isConnected && address) {
//     return (
//       <Card className="border-green-200 bg-green-50">
//         <CardContent className="flex items-center justify-between p-4">
//           <div className="flex items-center space-x-2">
//             <CheckCircle className="w-5 h-5 text-green-600" />
//             <div>
//               <p className="text-sm font-medium text-green-800">Wallet Connected</p>
//               <p className="text-xs text-green-600">
//                 {address.slice(0, 6)}...{address.slice(-4)}
//               </p>
//             </div>
//           </div>
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => disconnect()}
//             className="text-green-600 border-green-300 hover:bg-green-100"
//           >
//             Disconnect
//           </Button>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="border-orange-200 bg-orange-50">
//       <CardContent className="p-4">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//           <div className="flex items-center space-x-2">
//             <AlertCircle className="w-5 h-5 text-orange-600" />
//             <div>
//               <p className="text-sm font-medium text-orange-800">Connect Wallet Required</p>
//               <p className="text-xs text-orange-600">
//                 Connect your wallet to participate in voting
//               </p>
//             </div>
//           </div>
//           <Button 
//             onClick={handleConnect}
//             className="bg-orange-600 hover:bg-orange-700 text-white"
//           >
//             <Wallet className="w-4 h-4 mr-2" />
//             Connect Wallet
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }; 