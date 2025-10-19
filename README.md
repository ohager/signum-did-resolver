# Signum DID Resolver

W3C DID (Decentralized Identifier) Resolver for the Signum Network blockchain.

## Features

- ✅ W3C DID Core 1.0 compliant
- ✅ Resolves Signum transactions, accounts, aliases, contracts, and tokens
- ✅ SRC44 metadata integration
- ✅ Serverless deployment (Vercel)
- ✅ OpenAPI/Swagger documentation
- ✅ Full TypeScript support
- ✅ Comprehensive test coverage

## DID Method Specification

### DID Format

```
did:signum:[network]:[type]:[identifier]
```

**Network** (optional, defaults to mainnet):

- `mainnet` (default)
- `testnet`
- `stagenet`

**Type**:

- `tx` - Transaction
- `acc` - Account
- `alias` - Alias
- `contract` - Smart Contract
- `token` - Token/Asset

**Examples**:

```
did:signum:tx:12345678901234567890
did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z
did:signum:testnet:tx:98765432109876543210
did:signum:alias:web3:ohager
```

## API Endpoints

### Resolve DID

```http
GET /api/identifiers/{did}
```

**Example**:

```bash
curl https://did-resolver.signum.network/api/identifiers/did:signum:tx:12345678901234567890
```

**Browser-friendly**:
Open in browser for nicely formatted JSON:

```
https://did-resolver.signum.network/api/identifiers/did:signum:tx:12345678901234567890
```

**Response**:

```json
{
  "didResolutionMetadata": {
    "contentType": "application/did+ld+json"
  },
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:signum:tx:12345678901234567890",
    "controller": "did:signum:acc:16457748572299062825",
    "verificationMethod": [...],
    "src44": {...}
  },
  "didDocumentMetadata": {
    "created": "2025-01-15T10:30:00Z",
    "blockHeight": 1234567,
    "immutable": true
  }
}
```

### Content Negotiation

The API supports content negotiation via the `Accept` header:

- `Accept: application/did+ld+json` - W3C DID JSON-LD format (default for API clients)
- `Accept: application/json` - Plain JSON format (used by browsers)
- `Accept: text/html` - Plain JSON format (browser viewing)

### Caching

Responses include appropriate caching headers:

- **Transaction DIDs** (immutable): Cached for 1 year
- **Account DIDs** (mutable): Cached for 5 minutes (browser), 1 minute (CDN)
- **Errors**: Not cached

## Configuration

### Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

**Available variables**:

- `SIGNUM_MAINNET_NODE` - Mainnet node URL (default: `https://brazil.signum.network`)
- `SIGNUM_TESTNET_NODE` - Testnet node URL (default: `https://europe3.testnet.signum.network`)

**Vercel Deployment**:

Set these environment variables in your Vercel project settings:

```bash
SIGNUM_MAINNET_NODE=https://brazil.signum.network
SIGNUM_TESTNET_NODE=https://europe3.testnet.signum.network
```

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Type checking
yarn typecheck

# Lint
yarn lint

# Format code
yarn format

# Local development server
yarn dev
```

Visit `http://localhost:3000/api/identifiers/did:signum:tx:12345678901234567890` to test locally.

## License

MIT
