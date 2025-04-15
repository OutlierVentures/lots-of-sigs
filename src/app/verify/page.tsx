import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function VerifyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Verify Message</h1>
          <p className="text-sm text-gray-500">
            Verify a signed message to confirm its authenticity
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Original Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter the original message here..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signature" className="block text-sm font-medium text-gray-700">
              Signature
            </label>
            <textarea
              id="signature"
              name="signature"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter the signature here..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Signer's Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter the signer's address here..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="network" className="block text-sm font-medium text-gray-700">
              Network
            </label>
            <select
              id="network"
              name="network"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a network</option>
              <option value="ethereum">Ethereum</option>
              <option value="cosmos">Cosmos</option>
              <option value="polkadot">Polkadot</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button>Verify Message</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 