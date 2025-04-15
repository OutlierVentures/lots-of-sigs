import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BaseLayout } from "./components/layout/BaseLayout";
import { WalletProvider } from "./providers/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blockchain Message Signer",
  description: "Sign and verify messages using blockchain wallets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <BaseLayout>{children}</BaseLayout>
        </WalletProvider>
      </body>
    </html>
  );
}
