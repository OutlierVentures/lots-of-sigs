'use client';

import React, { useState } from 'react';
import { useWallet } from '../providers/WalletProvider';
import { NetworkType, WalletType } from '../types/wallet';
import { SignedMessage } from '../types/message';
import { Button } from '../components/ui/Button';

export default function SignPage() {
  const { isConnected, address, network, error: walletError, actions } = useWallet();
  const [message, setMessage] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ethereum');
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string>('');
  const [walletType, setWalletType] = useState<WalletType>('metamask');

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await actions.connect(selectedNetwork, walletType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const sig = await actions.signMessage(message);
      setSignature(sig);
      
      // Generate JSON representation
      const signedMessageObj: SignedMessage = {
        message,
        signature: sig,
        address: address!,
        network: network!,
        timestamp: new Date().toISOString(),
      };
      setSignedMessage(JSON.stringify(signedMessageObj, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await actions.disconnect();
      setSignature('');
      setSignedMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getWalletOptions = () => {
    switch (selectedNetwork) {
      case 'ethereum':
        return (
          <>
            <option value="metamask">MetaMask</option>
            <option value="walletconnect">WalletConnect</option>
          </>
        );
      case 'cosmos':
        return <option value="keplr">Keplr</option>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign Message</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Network Type</label>
          <select
            value={selectedNetwork}
            onChange={(e) => {
              setSelectedNetwork(e.target.value as NetworkType);
              // Reset wallet type when network changes
              setWalletType(e.target.value === 'ethereum' ? 'metamask' : 'keplr');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            disabled={isConnected}
          >
            <option value="ethereum">EVM (Ethereum, Polygon, etc.)</option>
            <option value="cosmos">Cosmos</option>
            <option value="polkadot" disabled>Polkadot (Coming Soon)</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Wallet Type</label>
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            disabled={isConnected}
          >
            {getWalletOptions()}
          </select>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-900">Connected Address:</p>
              <p className="text-sm font-mono break-all text-gray-900">{address}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                rows={4}
                placeholder="Enter message to sign"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSign}
                disabled={isLoading || !message.trim()}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing...' : 'Sign Message'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>

            {signature && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-900">Signature:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(signature)}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm font-mono break-all text-gray-900">{signature}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-900">Signed Message JSON</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(signedMessage)}
                    >
                      Copy
                    </Button>
                  </div>
                  <textarea
                    value={signedMessage}
                    onChange={(e) => setSignedMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-gray-900"
                    rows={6}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {(error || walletError) && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">{error || walletError}</p>
          </div>
        )}
      </div>
    </div>
  );
} 