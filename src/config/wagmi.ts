
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Kuru Predictions',
  projectId: '', 
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false, 
});
