import { Inter } from "next/font/google";
import "./globals.css";
import { BaseLayout } from "./components/layout/BaseLayout";
import { ClientProviders } from "./providers/ClientProviders";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lots Of Sigs",
    template: "%s | Lots Of Sigs"
  },
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
        <ClientProviders>
          <BaseLayout>{children}</BaseLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
