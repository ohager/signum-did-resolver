/**
 * Tests for Transaction DID Document Builder
 */

import { describe, it, expect } from 'vitest';
import { TransactionDidDocumentBuilder, type TransactionData } from '../../src/builders';
import { DidParser } from '../../src/parser';

describe('TransactionDidDocumentBuilder', () => {
  const parser = new DidParser();

  describe('build()', () => {
    it('should build DID document for mainnet transaction without SRC44', async () => {
      const did = parser.parse('did:signum:tx:12345678901234567890');
      const txData: TransactionData = {
        transactionId: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        senderId: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        blockHeight: 123456,
        confirmations: 10,
      };

      const builder = new TransactionDidDocumentBuilder(did, txData);
      const result = await builder.build();

      expect(result.didDocument.id).toBe('did:signum:tx:12345678901234567890');
      expect(result.didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(result.didDocument['@context']).toContain('https://w3id.org/security/suites/ed25519-2020/v1');
      expect(result.didDocument.controller).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(result.didDocument.verificationMethod).toHaveLength(1);
      expect(result.didDocument.verificationMethod![0].type).toBe('Ed25519VerificationKey2020');
      expect(result.didDocument.verificationMethod![0].controller).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(result.didDocument.src44).toBeUndefined();
    });

    it('should build DID document for testnet transaction', async () => {
      const did = parser.parse('did:signum:testnet:tx:98765432109876543210');
      const txData: TransactionData = {
        transactionId: '98765432109876543210',
        senderPublicKey: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
        senderId: '11111111111111111111',
        senderRS: 'TS-XXXX-XXXX-XXXX-XXXXX',
        blockTimestamp: 200000,
        blockHeight: 654321,
        confirmations: 50,
      };

      const builder = new TransactionDidDocumentBuilder(did, txData);
      const result = await builder.build();

      expect(result.didDocument.id).toBe('did:signum:testnet:tx:98765432109876543210');
      expect(result.didDocument.controller).toBe('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');
    });

    it('should include SRC44 data when present', async () => {
      const did = parser.parse('did:signum:tx:12345678901234567890');
      const txData: TransactionData = {
        transactionId: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        senderId: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        blockHeight: 123456,
        confirmations: 10,
        src44: {
          vs: 1,
          nm: 'Test Product',
          ds: 'Product description',
          xbn: 'BATCH-001',
          xmd: '2025-01-01',
        },
      };

      const builder = new TransactionDidDocumentBuilder(did, txData);
      const result = await builder.build();

      expect(result.didDocument.src44).toBeDefined();
      expect(result.didDocument.src44).toEqual({
        vs: 1,
        nm: 'Test Product',
        ds: 'Product description',
        xbn: 'BATCH-001',
        xmd: '2025-01-01',
      });
    });

    it('should create immutable metadata with block info', async () => {
      const did = parser.parse('did:signum:tx:12345678901234567890');
      const txData: TransactionData = {
        transactionId: '12345678901234567890',
        senderPublicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        senderId: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        blockHeight: 123456,
        confirmations: 10,
      };

      const builder = new TransactionDidDocumentBuilder(did, txData);
      const result = await builder.build();

      expect(result.didDocumentMetadata.immutable).toBe(true);
      expect(result.didDocumentMetadata.blockHeight).toBe(123456);
      expect(result.didDocumentMetadata.confirmations).toBe(10);
      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(result.didDocumentMetadata.created).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should create verification method with multibase-encoded public key', async () => {
      const did = parser.parse('did:signum:tx:12345678901234567890');
      const txData: TransactionData = {
        transactionId: '12345678901234567890',
        senderPublicKey: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        senderId: '16457748572299062825',
        senderRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        blockTimestamp: 100000,
        blockHeight: 123456,
        confirmations: 10,
      };

      const builder = new TransactionDidDocumentBuilder(did, txData);
      const result = await builder.build();

      const vm = result.didDocument.verificationMethod![0];
      expect(vm.publicKeyMultibase).toBeDefined();
      expect(vm.publicKeyMultibase).toMatch(`fabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`); // Multibase prefix
      expect(vm.id).toBe('did:signum:tx:12345678901234567890#creator');
    });
  });
});
