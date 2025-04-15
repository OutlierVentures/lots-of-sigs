'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useWallet } from '../providers/WalletProvider';
import { NetworkType } from '../types/wallet';
import { SignedMessage } from '../types/message';

export default function SignPage() {
  const { isConnected, address, network, error, actions } = useWallet();
  const [message, setMessage] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | ''>('');
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!selectedNetwork) {
      setLocalError('Please select a network first');
      return;
    }

    try {
      setLocalError(null);
      setIsLoading(true);
      await actions.connect(selectedNetwork as NetworkType);
    } catch (error) {
      console.error('Failed to connect:', error);
      // Error will be handled by the wallet provider
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!message) {
      setLocalError('Please enter a message to sign');
      return;
    }

    try {
      setLocalError(null);
      setIsLoading(true);
      const sig = await actions.signMessage(message);
      setSignature(sig);
    } catch (error) {
      console.error('Failed to sign:', error);
      // Error will be handled by the wallet provider
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!signature || !address || !network) return;

    const signedMessage: SignedMessage = {
      message,
      signature,
      address,
      network: network as 'ethereum' | 'cosmos' | 'polkadot',
      timestamp: Date.now(),
    };

    navigator.clipboard.writeText(JSON.stringify(signedMessage, null, 2));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Sign Message</h1>
          <p className="text-sm text-gray-500">
            Connect your wallet and sign a message to prove ownership of your address
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(error || localError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error || localError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-900">
              Message to Sign
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter your message here..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="network" className="block text-sm font-medium text-gray-900">
              Network
            </label>
            <select
              id="network"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as NetworkType | '')}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isConnected}
            >
              <option value="">Select a network</option>
              <option value="ethereum">Ethereum</option>
              <option value="cosmos">Cosmos</option>
              <option value="polkadot">Polkadot</option>
            </select>
          </div>

          {isConnected && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Connected Address
              </label>
              <div className="text-sm text-gray-900 font-mono break-all p-3 bg-gray-50 rounded-md border border-gray-200">
                {address}
              </div>
            </div>
          )}

          {signature && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-900">
                  Signature
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  Copy as JSON
                </Button>
              </div>
              <div className="text-sm text-gray-900 font-mono break-all p-3 bg-gray-50 rounded-md border border-gray-200">
                {signature}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {!isConnected ? (
              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={!selectedNetwork || isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => actions.disconnect()}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            )}
            <Button
              onClick={handleSign}
              disabled={!isConnected || !message || isLoading}
            >
              {isLoading ? 'Signing...' : 'Sign Message'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 