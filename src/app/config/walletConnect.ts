import { EthereumProvider } from '@walletconnect/ethereum-provider';

export const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [1], // Ethereum mainnet
  optionalChains: [1, 5, 137] as [number, ...number[]], // Mainnet, Goerli, Polygon
  showQrModal: true,
  methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
  events: ['chainChanged', 'accountsChanged'],
  metadata: {
    name: 'Blockchain Message Signer',
    description: 'Sign and verify messages using blockchain wallets',
    url: 'https://your-app-url.com',
    icons: ['https://your-app-url.com/icon.png'],
  },
};

export const createWalletConnectProvider = async () => {
  const provider = await EthereumProvider.init(walletConnectConfig);
  return provider;
}; 