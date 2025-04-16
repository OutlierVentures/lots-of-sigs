import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify | Lots Of Sigs',
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 