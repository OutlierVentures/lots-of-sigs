'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { SignedMessage } from '../types/message';
import { createWalletConnectProvider } from '../config/walletConnect';
import { NetworkType, WalletType, WalletContextType, WalletState, CosmosChainId } from '../types/wallet';
import { createSignature, createSignDoc } from '../../lib/cosmos/signing';
import { hash } from '../../lib/utils';

const initialState: WalletState = {
  isConnected: false,
  address: null,
  network: null,
  error: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  console.log('WalletProvider: Component mounted');
  
  const [state, setState] = useState<WalletState>(initialState);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);
  const [isWalletConnectInitialized, setIsWalletConnectInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log('WalletProvider: useEffect triggered');
    let mounted = true;

    const initWalletConnect = async () => {
      try {
        console.log('WalletProvider: Creating WalletConnect provider');
        const provider = await createWalletConnectProvider();
        console.log('WalletProvider: WalletConnect provider created', provider);
        
        if (mounted) {
          setWalletConnectProvider(provider);
          setIsWalletConnectInitialized(true);

          // Handle WalletConnect events
          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);
          provider.on('disconnect', handleDisconnect);
          console.log('WalletProvider: WalletConnect event listeners set up');
        }
      } catch (err) {
        console.error('WalletProvider: Failed to initialize WalletConnect:', err);
        if (mounted) {
          setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to initialize WalletConnect' }));
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initWalletConnect();

    return () => {
      mounted = false;
      console.log('WalletProvider: Cleaning up WalletConnect provider');
      if (walletConnectProvider) {
        walletConnectProvider.removeListener('accountsChanged', handleAccountsChanged);
        walletConnectProvider.removeListener('chainChanged', handleChainChanged);
        walletConnectProvider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('WalletProvider: Accounts changed', accounts);
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setState(prev => ({ ...prev, address: accounts[0] }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    console.log('WalletProvider: Chain changed', chainId);
    setState(prev => ({ ...prev, chainId: Number(chainId) }));
  };

  const handleDisconnect = () => {
    console.log('WalletProvider: Handling disconnect');
    setState(initialState);
    setSigner(null);
  };

  const connect = async (network: NetworkType, walletType: WalletType = 'metamask', chainId?: string) => {
    console.log('WalletProvider: Connecting wallet', { network, walletType, chainId });
    try {
      setState(prev => ({ ...prev, error: null }));
      
      if (isInitializing) {
        throw new Error('Wallet provider is still initializing. Please try again in a moment.');
      }

      if (network === 'cosmos') {
        console.log('WalletProvider: Connecting to Cosmos network');
        // Check if Keplr is installed
        if (!window.keplr) {
          console.error('WalletProvider: Keplr not found');
          throw new Error('Please install Keplr extension');
        }

        if (!chainId) {
          throw new Error('Chain ID is required for Cosmos networks');
        }

        // Enable Keplr for the selected chain
        console.log('WalletProvider: Enabling Keplr for', chainId);
        await window.keplr.enable(chainId);
        
        // Get the offline signer
        console.log('WalletProvider: Getting offline signer');
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        if (!offlineSigner) {
          console.error('WalletProvider: Failed to get offline signer');
          throw new Error('Failed to get offline signer from Keplr');
        }

        // Get the first account
        console.log('WalletProvider: Getting accounts');
        const accounts = await offlineSigner.getAccounts();
        if (!accounts || accounts.length === 0) {
          console.error('WalletProvider: No accounts found');
          throw new Error('No accounts found in Keplr');
        }
        
        console.log('WalletProvider: Setting state for Cosmos connection');
        setState({
          isConnected: true,
          address: accounts[0].address,
          network: 'cosmos',
          chainId,
          error: null,
        });
      } else if (network === 'ethereum') {
        console.log('WalletProvider: Connecting to Ethereum network');
        if (walletType === 'walletconnect') {
          console.log('WalletProvider: Using WalletConnect');
          if (!isWalletConnectInitialized) {
            console.error('WalletProvider: WalletConnect not initialized');
            throw new Error('WalletConnect is not ready yet. Please try again in a moment.');
          }

          if (!walletConnectProvider) {
            console.error('WalletProvider: WalletConnect provider not initialized');
            throw new Error('WalletConnect provider not initialized');
          }

          // Connect to WalletConnect
          console.log('WalletProvider: Connecting to WalletConnect');
          await walletConnectProvider.connect();
          console.log('WalletProvider: Requesting accounts');
          const accounts = await walletConnectProvider.request({ method: 'eth_accounts' });
          console.log('WalletProvider: Got accounts', accounts);
          
          if (!accounts || accounts.length === 0) {
            console.error('WalletProvider: No accounts found in WalletConnect');
            throw new Error('No accounts found in WalletConnect');
          }

          // Create provider and signer
          console.log('WalletProvider: Creating provider and signer');
          const provider = new BrowserProvider(walletConnectProvider);
          const ethSigner = await provider.getSigner();
          
          setSigner(ethSigner);
          setState({
            isConnected: true,
            address: accounts[0],
            network: 'ethereum',
            error: null,
          });
        } else {
          console.log('WalletProvider: Using MetaMask');
          // Check if MetaMask is installed
          if (!window.ethereum) {
            console.error('WalletProvider: MetaMask not found');
            throw new Error('Please install MetaMask');
          }

          // Request account access
          console.log('WalletProvider: Requesting accounts from MetaMask');
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          console.log('WalletProvider: Got accounts from MetaMask', accounts);
          
          if (!accounts || accounts.length === 0) {
            console.error('WalletProvider: No accounts found in MetaMask');
            throw new Error('No accounts found in MetaMask');
          }

          // Create provider and signer
          console.log('WalletProvider: Creating provider and signer for MetaMask');
          const provider = new BrowserProvider(window.ethereum);
          const ethSigner = await provider.getSigner();
          
          setSigner(ethSigner);
          setState({
            isConnected: true,
            address: accounts[0],
            network: 'ethereum',
            error: null,
          });
        }
      } else {
        console.error('WalletProvider: Network not supported', network);
        throw new Error('Network not supported yet');
      }
    } catch (error) {
      console.error('WalletProvider: Failed to connect wallet:', error);
      setState(prev => ({
        ...initialState,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  };

  const disconnect = async () => {
    console.log('WalletProvider: Disconnecting wallet', { network: state.network });
    if (state.network === 'ethereum' && walletConnectProvider) {
      console.log('WalletProvider: Disconnecting WalletConnect');
      await walletConnectProvider.disconnect();
    }
    setSigner(null);
    setState(initialState);
  };

  const signMessage = async (message: string): Promise<string> => {
    console.log('WalletProvider: Signing message', { network: state.network });
    if (!state.isConnected || !state.address) {
      console.error('WalletProvider: Wallet not connected');
      throw new Error('Wallet not connected');
    }

    try {
      if (state.network === 'cosmos') {
        console.log('WalletProvider: Using Keplr to sign message');
        if (!window.keplr) {
          console.error('WalletProvider: Keplr not connected');
          throw new Error('Keplr not connected');
        }

        // Get the key from Keplr
        const key = await window.keplr.getKey('cosmoshub-4');
        if (!key) {
          throw new Error('Failed to get key from Keplr');
        }

        // Create the sign document using our library
        const signDoc = createSignDoc(message, state.address);
        // For ADR-36 signing, chain_id should be empty string
        signDoc.chain_id = '';
        console.log('Created sign document:', JSON.stringify(signDoc, null, 2));

        // Use Keplr's signAmino for ADR-36 signing
        const signResponse = await window.keplr.signAmino(
          state.chainId || 'cosmoshub-4',
          state.address,
          signDoc
        );
        console.log('Keplr sign response:', JSON.stringify(signResponse, null, 2));

        // Create the signature data in the format our verification expects
        const signatureData = {
          signature: signResponse.signature.signature,
          pub_key: signResponse.signature.pub_key,
          sign_doc: signResponse.signed,
        };
        console.log('Final signature data:', JSON.stringify(signatureData, null, 2));

        // Create the frontend-compatible JSON structure
        const frontendJson = {
          message,
          signature: JSON.stringify(signatureData),  // Stringify the signature data
          address: state.address,
          network: 'cosmos',
          timestamp: new Date().toISOString(),
        };

        // Log the final JSON structure for debugging
        console.log('Final frontend JSON:', JSON.stringify(frontendJson, null, 2));

        return JSON.stringify(frontendJson);
      } else if (state.network === 'ethereum' && signer) {
        console.log('WalletProvider: Using Ethereum signer to sign message');
        // For EVM chains, use the standard signMessage
        return await signer.signMessage(message);
      } else {
        console.error('WalletProvider: Network not supported for signing', state.network);
        throw new Error('Network not supported');
      }
    } catch (error) {
      console.error('WalletProvider: Error signing message:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    ...state,
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
  console.log('useWallet: Hook called');
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 