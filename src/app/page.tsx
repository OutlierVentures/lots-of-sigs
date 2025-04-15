import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from './components/ui/Card';
import { Button } from './components/ui/Button';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Blockchain Message Signer
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Sign and verify messages using your blockchain wallet. Support for multiple networks and wallets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Sign Messages</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Sign messages using your blockchain wallet. Your signature proves that you are the owner of the address.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/sign">Start Signing</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Verify Messages</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Verify signed messages to confirm their authenticity. Check if the signature matches the claimed address.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/verify">Verify Now</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
