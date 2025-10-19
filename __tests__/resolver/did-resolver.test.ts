/**
 * Tests for Signum DID Resolver
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignumDidResolver } from '../../src/resolver';
import type { Ledger } from '@signumjs/core';

// Mock @signumjs/standards
vi.mock('@signumjs/standards', () => ({
  src44: {
    DescriptorData: {
      parse: vi.fn((data: string) => {
        const parsed = JSON.parse(data);
        if (parsed.vs === 1) {
          return { raw: parsed };
        }
        throw new Error('Invalid SRC44');
      }),
    },
  },
}));

describe('SignumDidResolver', () => {
  let mockLedger: Ledger;

  beforeEach(() => {
    // Create mock Ledger client
    mockLedger = {
      transaction: {
        getTransaction: vi.fn(),
      },
      account: {
        getAccount: vi.fn(),
      },
    } as any;
  });

  describe('resolve() - Transaction DIDs', () => {
    it('should resolve transaction DID without SRC44', async () => {
      const mockTx = {
        transaction: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        sender: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        height: 123456,
        confirmations: 10,
        attachment: {},
      };

      vi.mocked(mockLedger.transaction.getTransaction).mockResolvedValue(mockTx as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:12345678901234567890');

      expect(result.didResolutionMetadata.error).toBeUndefined();
      expect(result.didDocument).not.toBeNull();
      expect(result.didDocument?.id).toBe('did:signum:tx:12345678901234567890');
      expect(result.didDocument?.controller).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(result.didDocument?.verificationMethod).toHaveLength(1);
      expect(result.didDocument?.src44).toBeUndefined();
      expect(result.didDocumentMetadata.immutable).toBe(true);
      expect(result.didDocumentMetadata.blockHeight).toBe(123456);
      expect(result.didDocumentMetadata.confirmations).toBe(10);
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should resolve transaction DID with SRC44 data', async () => {
      const src44Data = {
        vs: 1,
        nm: 'Test Product',
        ds: 'Product description',
        xbn: 'BATCH-001',
        xmd: '2025-01-01',
      };

      const mockTx = {
        transaction: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        sender: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        height: 123456,
        confirmations: 10,
        attachment: {
          message: JSON.stringify(src44Data),
          messageIsText: true,
        },
      };

      vi.mocked(mockLedger.transaction.getTransaction).mockResolvedValue(mockTx as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:12345678901234567890');

      expect(result.didResolutionMetadata.error).toBeUndefined();
      expect(result.didDocument).not.toBeNull();
      expect(result.didDocument?.src44).toEqual(src44Data);
    });

    it('should ignore non-SRC44 message attachment (missing vs field)', async () => {
      const mockTx = {
        transaction: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        sender: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        height: 123456,
        confirmations: 10,
        attachment: {
          message: JSON.stringify({ some: 'data' }),
          messageIsText: true,
        },
      };

      vi.mocked(mockLedger.transaction.getTransaction).mockResolvedValue(mockTx as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:12345678901234567890');

      expect(result.didDocument?.src44).toBeUndefined();
    });

    it('should ignore non-JSON message attachment', async () => {
      const mockTx = {
        transaction: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        sender: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        height: 123456,
        confirmations: 10,
        attachment: {
          message: 'Not JSON data',
          messageIsText: true,
        },
      };

      vi.mocked(mockLedger.transaction.getTransaction).mockResolvedValue(mockTx as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:12345678901234567890');

      expect(result.didDocument?.src44).toBeUndefined();
    });

    it('should return notFound error when transaction does not exist', async () => {
      vi.mocked(mockLedger.transaction.getTransaction).mockRejectedValue(
        new Error('Unknown transaction')
      );

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:99999999999999999999');

      expect(result.didResolutionMetadata.error).toBe('notFound');
      expect(result.didResolutionMetadata.message).toContain('Transaction 99999999999999999999 not found');
      expect(result.didDocument).toBeNull();
    });

    it('should resolve testnet transaction DID', async () => {
      const mockTx = {
        transaction: '98765432109876543210',
        senderPublicKey: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
        sender: '11111111111111111111',
        senderRS: 'TS-XXXX-XXXX-XXXX-XXXXX',
        blockTimestamp: 200000,
        height: 654321,
        confirmations: 50,
        attachment: {},
      };

      vi.mocked(mockLedger.transaction.getTransaction).mockResolvedValue(mockTx as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:testnet:tx:98765432109876543210');

      expect(result.didResolutionMetadata.error).toBeUndefined();
      expect(result.didDocument?.id).toBe('did:signum:testnet:tx:98765432109876543210');
      expect(result.didDocument?.controller).toBe('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');
    });
  });

  describe('resolve() - Account DIDs', () => {
    it('should resolve account DID with public key', async () => {
      const mockAccount = {
        account: '16107620026796983538',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: '497D559D18D989B8E2D729EB6F69B70C1DDC3E554F75BEF3ED2716A4B2121902',
        name: 'Test Account',
        description: 'Account description',
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');

      expect(result.didResolutionMetadata.error).toBeUndefined();
      expect(result.didDocument).not.toBeNull();
      expect(result.didDocument?.id).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(result.didDocument?.verificationMethod).toHaveLength(1);
      expect(result.didDocument?.authentication).toHaveLength(1);
      expect(result.didDocument?.alsoKnownAs).toContain('did:signum:acc:16107620026796983538');
      expect(result.didDocumentMetadata.immutable).toBe(false);
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should resolve account DID without public key', async () => {
      const mockAccount = {
        account: '16107620026796983538',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        name: 'Test Account',
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');

      expect(result.didResolutionMetadata.error).toBeUndefined();
      expect(result.didDocument?.verificationMethod).toBeUndefined();
      expect(result.didDocument?.authentication).toBeUndefined();
    });

    it('should resolve account DID with SRC44 data in description', async () => {
      const src44Data = {
        vs: 1,
        nm: 'Company Name',
        ds: 'Company description',
      };

      const mockAccount = {
        account: '16107620026796983538',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: '497D559D18D989B8E2D729EB6F69B70C1DDC3E554F75BEF3ED2716A4B2121902',
        description: JSON.stringify(src44Data),
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');

      expect(result.didDocument?.src44).toEqual(src44Data);
    });

    it('should ignore non-SRC44 description', async () => {
      const mockAccount = {
        account: '16107620026796983538',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: '497D559D18D989B8E2D729EB6F69B70C1DDC3E554F75BEF3ED2716A4B2121902',
        description: 'Just a regular description',
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');

      expect(result.didDocument?.src44).toBeUndefined();
    });

    it('should return notFound error when account does not exist', async () => {
      vi.mocked(mockLedger.account.getAccount).mockRejectedValue(
        new Error('Unknown account')
      );

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:S-XXXX-XXXX-XXXX-XXXXX');

      expect(result.didResolutionMetadata.error).toBe('notFound');
      expect(result.didResolutionMetadata.message).toContain('Account S-XXXX-XXXX-XXXX-XXXXX not found');
      expect(result.didDocument).toBeNull();
    });

    it('should resolve account DID using numeric ID', async () => {
      const mockAccount = {
        account: '16107620026796983538',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: '497D559D18D989B8E2D729EB6F69B70C1DDC3E554F75BEF3ED2716A4B2121902',
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:acc:16107620026796983538');

      expect(result.didDocument?.id).toBe('did:signum:acc:16107620026796983538');
      expect(result.didDocument?.alsoKnownAs).toContain('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
    });

    it('should resolve testnet account DID', async () => {
      const mockAccount = {
        account: '11111111111111111111',
        accountRS: 'TS-XXXX-XXXX-XXXX-XXXXX',
        publicKey: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
      };

      vi.mocked(mockLedger.account.getAccount).mockResolvedValue(mockAccount as any);

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');

      expect(result.didDocument?.id).toBe('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');
      expect(result.didDocument?.alsoKnownAs).toContain('did:signum:testnet:acc:11111111111111111111');
    });
  });

  describe('resolve() - Error Handling', () => {
    it('should return invalidDid error for malformed DID', async () => {
      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('not-a-valid-did');

      expect(result.didResolutionMetadata.error).toBe('invalidDid');
      expect(result.didResolutionMetadata.message).toBeDefined();
      expect(result.didDocument).toBeNull();
    });

    it('should return invalidDid error for unsupported DID method', async () => {
      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:ethr:0x1234567890');

      expect(result.didResolutionMetadata.error).toBe('invalidDid');
      expect(result.didDocument).toBeNull();
    });

    it('should return methodNotSupported for alias DIDs', async () => {
      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:alias:myalias');

      expect(result.didResolutionMetadata.error).toBe('methodNotSupported');
      expect(result.didResolutionMetadata.message).toContain('alias');
      expect(result.didDocument).toBeNull();
    });

    it('should return methodNotSupported for contract DIDs', async () => {
      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:contract:12345678901234567890');

      expect(result.didResolutionMetadata.error).toBe('methodNotSupported');
      expect(result.didResolutionMetadata.message).toContain('contract');
      expect(result.didDocument).toBeNull();
    });

    it('should return methodNotSupported for token DIDs', async () => {
      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:token:12345678901234567890');

      expect(result.didResolutionMetadata.error).toBe('methodNotSupported');
      expect(result.didResolutionMetadata.message).toContain('token');
      expect(result.didDocument).toBeNull();
    });

    it('should return internalError for unexpected errors', async () => {
      vi.mocked(mockLedger.transaction.getTransaction).mockRejectedValue(
        new Error('Network timeout')
      );

      const resolver = new SignumDidResolver(mockLedger);
      const result = await resolver.resolve('did:signum:tx:12345678901234567890');

      expect(result.didResolutionMetadata.error).toBe('internalError');
      expect(result.didResolutionMetadata.message).toContain('Network timeout');
      expect(result.didDocument).toBeNull();
    });
  });
});
