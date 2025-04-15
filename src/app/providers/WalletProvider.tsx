'use client';

import React, { createContext, useContext, useState } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { NetworkType, WalletContextType, WalletState } from '../types/wallet';

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

  const connect = async (network: NetworkType) => {
    if (network === 'ethereum') {
      if (!window.ethereum) {
        setError('MetaMask is not installed');
        throw new Error('MetaMask is not installed');
      }

      try {
        setError(null);
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