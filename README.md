# Lots of Sigs

A privacy-first web application for cryptographically signing and verifying messages using blockchain addresses. The tool operates entirely locally, ensuring no data is published or stored externally.

## Features

- **Multi-Chain Support**
  - EVM networks (Ethereum, BSC, etc.)
  - Cosmos networks (Cosmos Hub, Osmosis, etc.)
  - Substrate networks (Polkadot, Kusama, etc.)

- **Wallet Integration**
  - MetaMask for EVM networks
  - Keplr for Cosmos networks
  - Polkadot{.js} for Substrate networks

- **Message Signing**
  - Sign messages with any supported wallet
  - Automatic chain detection
  - Local storage of signed messages
  - Export/import functionality

- **Message Verification**
  - Verify messages from any supported network
  - Detailed verification feedback
  - Network-specific verification details
  - Comprehensive result display
  - Support for both JSON and manual input

- **Security**
  - All operations performed locally
  - No server communication required
  - Private keys never leave your wallet
  - Secure message storage

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm
- A supported browser:
  - Chrome
  - Brave
  - Other Chrome-based browsers
- A blockchain wallet:
  - Browser wallet or WalletConnect (for EVM networks)
  - Keplr (for Cosmos networks)
  - Polkadot.js extension (for Substrate networks)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blockchain-signed-messages-offline.git
cd blockchain-signed-messages-offline
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory and add your WalletConnect project ID:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Development server configuration (optional)
NEXT_PUBLIC_DEV_HOST=0.0.0.0  # Set to 0.0.0.0 to allow external access
NEXT_PUBLIC_DEV_PORT=3000     # Change the port if needed
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

   To access the app from other devices on your local network:
   - Find your computer's local IP address (e.g., using `ipconfig` on Windows or `ifconfig` on Linux/Mac)
   - Access the app using `http://<your-local-ip>:3000` from other devices on the same network

   Note: If you changed the port in `.env.local`, replace 3000 with your chosen port number.

## Docker Deployment

The application can be deployed using Docker for production environments.

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier deployment)

### Building the Docker Image

1. Build the Docker image:
```bash
docker build -t lots-of-sigs .
```

### Running the Container

1. Run the container with default port (3000):
```bash
docker run -p 3000:3000 lots-of-sigs
```

2. Run the container with a custom port:
```bash
docker run -p 8080:3000 -e PORT=3000 lots-of-sigs
```

The application will be available at:
- Default: http://localhost:3000
- Custom port: http://localhost:8080 (or your chosen port)

### Environment Variables

You can configure the application using environment variables:

- `PORT`: The port number the application will listen on (default: 3000)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID

Example with environment variables:
```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id \
  lots-of-sigs
```

## Usage

### Signing Messages

1. Navigate to the "Sign Message" page
2. Select your preferred network type (Ethereum, Cosmos, or Polkadot)
3. For Cosmos or Polkadot networks, select the specific chain
4. Select your preferred wallet type:
   - MetaMask or WalletConnect for EVM networks
   - Keplr for Cosmos networks
   - Polkadot.js for Substrate networks
5. Connect your wallet
6. Enter the message you want to sign
7. Click "Sign Message"
8. Copy the signed message as JSON for sharing

### Verifying Messages

1. Navigate to the Verify page
2. Choose your verification method:
   - **JSON Input**: Paste the complete signed message JSON
   - **Manual Input**: Enter message details manually
3. Click "Verify Message"
4. View detailed verification results:
   - Signature validity
   - Network-specific checks
   - Message content verification
   - Timestamp validation
   - Address verification

## Security Measures

- All operations are performed locally in your browser
- No server communication required
- Private keys never leave your wallet
- Messages are stored locally in your browser
- Regular security audits and updates
- Comprehensive verification feedback
- Network-specific security checks
- Tested and supported on Chrome and Chrome-based browsers

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

#### Smart Contract Wallets

Note: When using smart contract wallets (like Safe{Wallet}), the verification process will show a mismatch between the signing address and the recovered address. This is because smart contract wallets use EIP-1271 for signature validation, which is not yet implemented in this version. This feature is planned for a future release.

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
- Empty chain ID and fee amount for off-chain messages

#### Signature Format

A Cosmos signature consists of three main components:
1. `signature`: The actual cryptographic signature (base64 encoded)
2. `pub_key`: The public key of the signer (base64 encoded)
3. `sign_doc`: The document that was signed, containing:
   - `chain_id`: Empty string for off-chain messages
   - `account_number`: "0" for off-chain messages
   - `sequence`: "0" for off-chain messages
   - `fee`: Empty array for off-chain messages
   - `msgs`: The message array containing the actual data
   - `memo`: Empty string

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
   - Bech32 encoding with the appropriate chain prefix

#### Supported Chains

The application supports multiple Cosmos chains:
- Cosmos Hub (cosmos)
- Fetch (fetch)
- Agoric (agoric)
- And more...

The chain is automatically detected based on the address prefix (e.g., 'cosmos1...', 'fetch1...', 'agoric1...').

#### Verification Process

Cosmos signature verification:
1. Decodes the base64 signature and public key
2. Determines the public key format (compressed/uncompressed)
3. Creates a sorted version of the sign document
4. Calculates the message hash
5. Verifies the signature using the public key
6. Derives the address from the public key using the correct chain prefix
7. Compares the derived address with the expected address

### Message Verification

The application provides two ways to verify messages:
1. Paste the complete signed message JSON
   - Automatically detects the network type
   - For Cosmos networks, detects the chain based on the address prefix
   - Populates all fields automatically
2. Enter the fields manually
   - Message
   - Signature
   - Address
   - Network type
   - Chain (for Cosmos networks)

Both methods support verification across different networks and chains.

### Polkadot Signatures

This application supports signing and verifying messages using the Polkadot.js extension. Here are the key aspects of Polkadot signatures:

#### Polkadot.js Extension Integration

The application integrates with the Polkadot.js browser extension to:
- Connect to user's Polkadot accounts
- Sign messages using the extension's signer
- Support multiple Substrate chains
- Handle SSR (Server-Side Rendering) gracefully

#### Message Signing Process

When signing a message with Polkadot:
1. The user connects their Polkadot.js extension
2. The application creates a message signing request
3. The extension signs the message using the user's private key
4. The signature is returned in hex format
5. The application creates a signed message object containing:
   - The original message
   - The hex-encoded signature
   - The signer's address
   - The network type ('polkadot')
   - A timestamp

#### Signature Format

A Polkadot signature consists of:
1. A hex-encoded signature string
2. The signer's SS58-encoded address
3. The message that was signed
4. Network and timestamp metadata

#### Verification Process

Polkadot signature verification:
1. Decodes the SS58 address to get the public key
2. Converts the hex signature to a Uint8Array
3. Verifies the signature using the public key
4. Compares the recovered address with the expected address
5. Returns true if the signature is valid

#### Supported Chains

The application supports multiple Substrate chains:
- Polkadot
- Kusama
- And other Substrate-based chains

The chain is automatically detected based on the address format and can be selected in the UI.

#### Security Considerations

- All signing operations are performed in the browser extension
- Private keys never leave the extension
- The application uses the extension's secure signing interface
- Messages are signed in their raw form without modification

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

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

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
