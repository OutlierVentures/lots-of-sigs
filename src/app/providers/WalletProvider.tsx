'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { NetworkType, WalletContextType, WalletState } from '../types/wallet';
import { createWalletConnectProvider } from '../config/walletConnect';

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

  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        const provider = await createWalletConnectProvider();
        setWalletConnectProvider(provider);
      } catch (err) {
        console.error('Failed to initialize WalletConnect:', err);
      }
    };
    initWalletConnect();
  }, []);

  const connect = async (network: NetworkType) => {
    if (network === 'ethereum') {
      try {
        setError(null);
        let provider;
        let accounts;
        let newSigner;

        if (walletConnectProvider?.connected) {
          // Use WalletConnect if already connected
          provider = new BrowserProvider(walletConnectProvider);
          accounts = await walletConnectProvider.request({ method: 'eth_accounts' });
          newSigner = await provider.getSigner();
        } else if (window.ethereum) {
          // Use MetaMask
          provider = new BrowserProvider(window.ethereum);
          accounts = await provider.send('eth_requestAccounts', []);
          newSigner = await provider.getSigner();
        } else {
          // Try WalletConnect
          if (!walletConnectProvider) {
            throw new Error('No wallet provider available');
          }
          await walletConnectProvider.connect();
          provider = new BrowserProvider(walletConnectProvider);
          accounts = await walletConnectProvider.request({ method: 'eth_accounts' });
          newSigner = await provider.getSigner();
        }

        const chainId = await provider.getNetwork().then(net => net.chainId);
        
        setState({
          isConnected: true,
          address: accounts[0],
          network: 'ethereum',
          chainId: Number(chainId),
        });
        
        setSigner(newSigner);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setError('Failed to connect wallet. Please try again.');
        throw error;
      }
    } else {
      const errorMessage = `${network} connection not implemented yet`;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const disconnect = async () => {
    try {
      setError(null);
      if (walletConnectProvider?.connected) {
        await walletConnectProvider.disconnect();
      }
      setState(initialState);
      setSigner(null);
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
      const signature = await signer.signMessage(message);
      return signature;
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