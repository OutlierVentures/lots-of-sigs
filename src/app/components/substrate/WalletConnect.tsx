'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubstrateWallet } from '@/lib/substrate/wallet';
import { SUBSTRATE_CHAINS } from '@/lib/substrate/chains';

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState(SUBSTRATE_CHAINS[0].name);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const wallet = new SubstrateWallet();
      const connected = await wallet.isConnected();
      setIsConnected(connected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check wallet connection');
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      const wallet = new SubstrateWallet();
      await wallet.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      const wallet = new SubstrateWallet();
      await wallet.disconnect();
      setIsConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Substrate Wallet</CardTitle>
        <CardDescription>Connect your Polkadot.js wallet to sign messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="chain" className="text-sm font-medium">Select Chain</label>
            <select
              id="chain"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="p-2 border rounded-md"
            >
              {SUBSTRATE_CHAINS.map((chain) => (
                <option key={chain.name} value={chain.name}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-center">
            {!isConnected ? (
              <Button onClick={handleConnect}>Connect Wallet</Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive">Disconnect</Button>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {isConnected && (
            <div className="text-green-500 text-sm text-center">
              Wallet connected successfully
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 