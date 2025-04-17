import { EthereumProvider } from '@walletconnect/ethereum-provider';

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.error('WalletConnect: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

// Create a singleton instance
let provider: InstanceType<typeof EthereumProvider> | null = null;
let initializationPromise: Promise<InstanceType<typeof EthereumProvider>> | null = null;

export const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [1], // Ethereum mainnet
  optionalChains: [1, 5, 137] as [number, ...number[]], // Mainnet, Goerli, Polygon
  showQrModal: true,
  methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
  events: ['chainChanged', 'accountsChanged'],
  metadata: {
    name: 'Lots Of Sigs',
    description: 'Sign and verify messages using blockchain wallets',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.com',
    icons: ['https://your-app-url.com/icon.png'],
  },
};

export const createWalletConnectProvider = async () => {
  try {
    // Return existing provider if it exists
    if (provider) {
      console.log('WalletConnect: Using existing provider');
      return provider;
    }

    // If initialization is in progress, return the promise
    if (initializationPromise) {
      console.log('WalletConnect: Initialization already in progress');
      return initializationPromise;
    }

    console.log('WalletConnect: Initializing provider with config:', {
      ...walletConnectConfig,
      projectId: walletConnectConfig.projectId ? '***' : 'not set'
    });
    
    if (!walletConnectConfig.projectId || walletConnectConfig.projectId === 'YOUR_PROJECT_ID') {
      throw new Error('WalletConnect project ID is not properly configured');
    }

    // Create a new promise for initialization
    initializationPromise = EthereumProvider.init(walletConnectConfig);
    
    // Wait for initialization to complete
    provider = await initializationPromise;
    
    console.log('WalletConnect: Provider initialized successfully');
    return provider;
  } catch (error) {
    console.error('WalletConnect: Failed to initialize provider:', error);
    // Reset the promise on error
    initializationPromise = null;
    throw error;
  }
};

export const cleanupWalletConnectProvider = async () => {
  if (provider) {
    try {
      if (provider.connected) {
        await provider.disconnect();
      }
      provider = null;
      initializationPromise = null;
    } catch (error) {
      console.error('WalletConnect: Failed to cleanup provider:', error);
    }
  }
}; 