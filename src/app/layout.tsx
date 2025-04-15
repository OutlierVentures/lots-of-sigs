'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { BaseLayout } from "./components/layout/BaseLayout";
import { ClientWalletProvider } from "./providers/ClientWalletProvider";
import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientWalletProvider>
            <BaseLayout>{children}</BaseLayout>
          </ClientWalletProvider>
        </Suspense>
      </body>
    </html>
  );
}
