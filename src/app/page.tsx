import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Heading } from './components/ui/Heading';
import { Text } from './components/ui/Text';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lots Of Sigs'
};

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading level={1} className="tracking-tight">
          Lots Of Sigs
        </Heading>
        <Text variant="muted" className="mt-6 text-lg leading-8">
          Sign and verify messages using your blockchain wallet. Support for multiple networks and wallets.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sign Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Sign messages using your blockchain wallet. Your signature proves that you are the owner of the address.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/sign">Start Signing</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verify Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Verify signed messages to confirm their authenticity. Check if the signature matches the claimed address.
            </CardDescription>
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
