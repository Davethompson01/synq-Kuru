
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'hahawallet',
  projectId: '3b3369c5678f62c92ed5e4e23ad464f5', 
  chains: [mainnet],
  ssr: true,
});
