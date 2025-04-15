'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { NetworkType, WalletContextType, WalletState, WalletType } from '../types/wallet';
import { createWalletConnectProvider } from '../config/walletConnect';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { walletConnectConfig } from '../config/walletConnect';
import { makeADR36AminoSignDoc } from '@cosmjs/amino';

const initialState: WalletState = {
  isConnected: false,
  address: null,
  network: null,
  chainId: undefined,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);
  const [isWalletConnect, setIsWalletConnect] = useState(false);

  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        const provider = await createWalletConnectProvider();
        setWalletConnectProvider(provider);

        // Handle WalletConnect events
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);
        provider.on('disconnect', handleDisconnect);
      } catch (err) {
        console.error('Failed to initialize WalletConnect:', err);
      }
    };
    initWalletConnect();

    return () => {
      if (walletConnectProvider) {
        walletConnectProvider.removeListener('accountsChanged', handleAccountsChanged);
        walletConnectProvider.removeListener('chainChanged', handleChainChanged);
        walletConnectProvider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setState(prev => ({ ...prev, address: accounts[0] }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    setState(prev => ({ ...prev, chainId: Number(chainId) }));
  };

  const handleDisconnect = () => {
    setState(initialState);
    setSigner(null);
    setIsWalletConnect(false);
  };

  const connectWithMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const newSigner = await provider.getSigner();
    const chainId = await provider.getNetwork().then(net => net.chainId);
    
    setState({
      isConnected: true,
      address: accounts[0],
      network: 'ethereum',
      chainId: Number(chainId),
    });
    
    setSigner(newSigner);
    setIsWalletConnect(false);
  };

  const connectWithWalletConnect = async () => {
    if (!walletConnectProvider) {
      throw new Error('WalletConnect is not initialized');
    }

    await walletConnectProvider.connect();
    const provider = new BrowserProvider(walletConnectProvider);
    const accounts = await walletConnectProvider.request({ method: 'eth_accounts' }) as string[];
    const newSigner = await provider.getSigner();
    const chainId = await provider.getNetwork().then(net => net.chainId);
    
    setState({
      isConnected: true,
      address: accounts[0],
      network: 'ethereum',
      chainId: Number(chainId),
    });
    
    setSigner(newSigner);
    setIsWalletConnect(true);
  };

  const connectWithKeplr = async () => {
    if (!window.keplr) {
      throw new Error('Keplr is not installed');
    }

    try {
      // Request connection to Cosmos Hub
      await window.keplr.enable('cosmoshub-4');
      
      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner('cosmoshub-4');
      
      // Get the first account
      const accounts = await offlineSigner.getAccounts();
      
      // Get the chain info
      const key = await window.keplr.getKey('cosmoshub-4');
      
      setState({
        isConnected: true,
        address: accounts[0].address,
        network: 'cosmos',
        chainId: undefined, // Cosmos doesn't use chainId in the same way as EVM
      });
      
      // Store both the signer and chain info
      setSigner({
        signer: offlineSigner,
        chainId: 'cosmoshub-4',
        address: accounts[0].address
      } as any);
    } catch (error) {
      console.error('Failed to connect with Keplr:', error);
      throw new Error('Failed to connect with Keplr');
    }
  };

  const connect = async (network: NetworkType, walletType?: WalletType) => {
    try {
      setError(null);

      switch (network) {
        case 'ethereum':
          if (walletType === 'walletconnect') {
            await connectWithWalletConnect();
          } else {
            await connectWithMetaMask();
          }
          break;
        case 'cosmos':
          if (walletType === 'keplr') {
            await connectWithKeplr();
          } else {
            throw new Error('Only Keplr is supported for Cosmos');
          }
          break;
        case 'polkadot':
          throw new Error('Polkadot support not implemented yet');
        default:
          throw new Error('Unsupported network');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet. Please try again.');
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      setError(null);
      if (isWalletConnect && walletConnectProvider?.connected) {
        await walletConnectProvider.disconnect();
      }
      setState(initialState);
      setSigner(null);
      setIsWalletConnect(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setError('Failed to disconnect wallet. Please try again.');
    }
  };

  const signMessage = async (message: string) => {
    if (!signer || !state.isConnected) {
      setError('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    try {
      setError(null);
      
      if (state.network === 'cosmos') {
        if (!window.keplr) {
          throw new Error('Keplr is not available');
        }

        try {
          const chainId = 'cosmoshub-4';
          
          // Get the signer's address
          const offlineSigner = window.keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          const signerAddress = accounts[0].address;

          // Use signArbitrary for ADR-36 signing
          const signature = await window.keplr.signArbitrary(
            chainId,
            signerAddress,
            message
          );

          // Create the sign document for verification
          const signDoc = {
            chain_id: '',
            account_number: '0',
            sequence: '0',
            fee: {
              gas: '0',
              amount: []
            },
            msgs: [
              {
                type: 'sign/MsgSignData',
                value: {
                  signer: signerAddress,
                  data: Buffer.from(message).toString('base64')
                }
              }
            ],
            memo: ''
          };

          // Return the complete signature object
          return JSON.stringify({
            signature: signature.signature,
            pub_key: signature.pub_key,
            sign_doc: signDoc
          });
        } catch (signError) {
          console.error('Signing error:', signError);
          throw new Error('Failed to sign message with Keplr');
        }
      } else {
        // For EVM chains, use the standard signMessage
        const signature = await signer.signMessage(message);
        return signature;
      }
    } catch (error) {
      console.error('Failed to sign message:', error);
      setError('Failed to sign message. Please try again.');
      throw error;
    }
  };

  const value = {
    ...state,
    error,
    actions: {
      connect,
      disconnect,
      signMessage,
    },
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 