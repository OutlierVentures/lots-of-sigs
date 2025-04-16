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

## Signature Standards

This application supports multiple blockchain signature standards. Each network has its own specific format and verification process.

### Ethereum Signatures

Ethereum supports several signature standards for message signing:

#### EIP-191 (personal_sign)

The most common standard for signing arbitrary messages:
- Uses the `personal_sign` method in wallets
- Prepends the message with `\x19Ethereum Signed Message:\n` and message length
- Returns a 65-byte signature (r, s, v) where:
  - r, s: ECDSA signature components
  - v: Recovery identifier (27 or 28)
- Address recovery is possible using the v value

#### EIP-712 (Structured Data)

For signing structured data with type information:
- Supports complex data structures with type definitions
- Includes domain separation to prevent replay attacks
- Provides better user experience in wallets
- Shows structured data in human-readable format

#### Verification Process

Ethereum signature verification:
1. Reconstructs the original message hash
2. Recovers the signer's address from the signature
3. Compares the recovered address with the expected address
4. Supports both personal_sign and EIP-712 formats

### Cosmos Signatures

This application supports signing and verifying messages using Cosmos SDK's ADR-36 standard. Here are the key aspects of Cosmos signatures:

#### ADR-36 Standard

ADR-36 is the standard for off-chain message signing in the Cosmos ecosystem. It defines:
- A specific message format for signing arbitrary data
- A standardized way to verify signatures
- Support for multiple message types and formats

#### Signature Format

A Cosmos signature consists of three main components:
1. `signature`: The actual cryptographic signature (base64 encoded)
2. `pub_key`: The public key of the signer (base64 encoded)
3. `sign_doc`: The document that was signed, containing:
   - `chain_id`: The chain identifier (empty for off-chain messages)
   - `account_number`: The account number (0 for off-chain messages)
   - `sequence`: The sequence number (0 for off-chain messages)
   - `fee`: Transaction fee (empty for off-chain messages)
   - `msgs`: The message array containing the actual data
   - `memo`: Optional memo field

#### Public Key Formats

Cosmos supports two public key formats:
1. **Compressed** (33 bytes):
   - Starts with `0x02` or `0x03`
   - More efficient for storage and transmission
   - Used by default in most wallets (including Keplr)

2. **Uncompressed** (65 bytes):
   - Starts with `0x04`
   - Contains both x and y coordinates
   - Used in some legacy systems

The verification process automatically handles both formats by:
- Detecting the format based on length and first byte
- Uncompressing compressed keys when needed
- Using the appropriate format for verification

#### Message Formatting

Messages in Cosmos signatures are:
1. Base64 encoded in the `sign_doc.msgs[0].value.data` field
2. Automatically decoded during verification
3. Extracted using the `extractMessage` function

#### Field Ordering

For consistent signature verification:
- All fields in the sign document are sorted alphabetically
- This ensures the same message hash regardless of field order
- The sorting is applied to both signing and verification

#### Keplr Integration

When using Keplr wallet:
1. Messages are signed using the ADR-36 format
2. Public keys are typically in compressed format
3. Signatures are verified using the same standard
4. Addresses are derived from the public key using:
   - SHA-256 hash of the public key
   - RIPEMD-160 hash of the SHA-256 result
   - Bech32 encoding with 'cosmos' prefix

#### Verification Process

The verification process:
1. Decodes the base64 signature and public key
2. Determines the public key format (compressed/uncompressed)
3. Creates a sorted version of the sign document
4. Calculates the message hash
5. Verifies the signature using the public key
6. Verifies the signer's address matches the expected address

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
