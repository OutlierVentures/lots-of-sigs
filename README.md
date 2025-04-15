# Blockchain Message Signer

A privacy-first web application for cryptographically signing and verifying messages using blockchain addresses. The tool operates entirely locally, ensuring no data is published or stored externally.

## Features

- Sign messages using your blockchain wallet
- Verify signed messages to confirm their authenticity
- Support for multiple networks:
  - EVM-based networks (Ethereum, Polygon, etc.)
  - Cosmos-based networks (coming soon)
  - Substrate/Polkadot-based networks (coming soon)
- Support for multiple wallet types:
  - MetaMask
  - WalletConnect
- JSON export/import of signed messages
- Copy/paste functionality for easy sharing

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A blockchain wallet (MetaMask or WalletConnect compatible)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blockchain-signed-messages-offline.git
cd blockchain-signed-messages-offline
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your WalletConnect project ID:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Signing Messages

1. Navigate to the "Sign Message" page
2. Select your preferred network
3. Connect your wallet
4. Enter the message you want to sign
5. Click "Sign Message"
6. Copy the signed message as JSON for sharing

### Verifying Messages

1. Navigate to the "Verify Message" page
2. Either paste a JSON string or manually enter:
   - The original message
   - The signature
   - The signer's address
   - The network used
3. Click "Verify Message"
4. View the verification result

## Security

- All operations are performed locally in your browser
- No data is stored or transmitted to external servers
- Private keys never leave your wallet
- Messages are signed using standard cryptographic methods

## Development

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── config/            # Configuration files
│   ├── providers/         # Context providers
│   ├── types/             # TypeScript type definitions
│   └── ...                # App pages
├── public/                # Static assets
└── ...                    # Configuration files
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Ethers.js](https://docs.ethers.org/)
- [WalletConnect](https://walletconnect.com/)
- [Tailwind CSS](https://tailwindcss.com/)
