import { EthereumProvider } from '@walletconnect/ethereum-provider';

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.error('WalletConnect: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

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
  try {
    console.log('WalletConnect: Initializing provider with config:', {
      ...walletConnectConfig,
      projectId: walletConnectConfig.projectId ? '***' : 'not set'
    });
    
    if (!walletConnectConfig.projectId || walletConnectConfig.projectId === 'YOUR_PROJECT_ID') {
      throw new Error('WalletConnect project ID is not properly configured');
    }

    const provider = await EthereumProvider.init(walletConnectConfig);
    console.log('WalletConnect: Provider initialized successfully');
    return provider;
  } catch (error) {
    console.error('WalletConnect: Failed to initialize provider:', error);
    throw error;
  }
}; 