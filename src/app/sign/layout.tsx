import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign | Lots Of Sigs',
};

export default function SignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 