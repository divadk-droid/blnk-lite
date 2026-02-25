import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { blnkPlugin } from '@blnk/wagmi-plugin';

// 3-line integration
const config = createConfig({
  chains: [mainnet, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
  plugins: [
    blnkPlugin({
      apiKey: 'your_blnk_api_key',
      // Optional: customize behavior
      onRiskDetected: (risk) => {
        console.warn('High risk detected:', risk);
      }
    })
  ]
});

export default config;