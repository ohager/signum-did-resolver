/**
 * Tests for Account DID Document Builder
 */

import { describe, it, expect } from 'vitest';
import { AccountDidDocumentBuilder, type AccountData } from '../../src/builders';
import { DidParser } from '../../src/parser';

describe('AccountDidDocumentBuilder', () => {
  const parser = new DidParser();

  describe('build()', () => {
    it('should build DID document for account with RS-address', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument.id).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(result.didDocument.alsoKnownAs).toContain('did:signum:acc:16457748572299062825');
      expect(result.didDocument.verificationMethod).toHaveLength(1);
      expect(result.didDocument.authentication).toHaveLength(1);
    });

    it('should build DID document for account with numeric ID', async () => {
      const did = parser.parse('did:signum:acc:16457748572299062825');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument.id).toBe('did:signum:acc:16457748572299062825');
      expect(result.didDocument.alsoKnownAs).toContain('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
    });

    it('should build DID document for testnet account', async () => {
      const did = parser.parse('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');
      const accountData: AccountData = {
        accountId: '11111111111111111111',
        accountRS: 'TS-XXXX-XXXX-XXXX-XXXXX',
        publicKey: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument.id).toBe('did:signum:testnet:acc:TS-XXXX-XXXX-XXXX-XXXXX');
      expect(result.didDocument.alsoKnownAs).toContain('did:signum:testnet:acc:11111111111111111111');
    });

    it('should handle account without public key', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        // No public key
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument.verificationMethod).toBeUndefined();
      expect(result.didDocument.authentication).toBeUndefined();
      expect(result.didDocument['@context']).toEqual(['https://www.w3.org/ns/did/v1']);
    });

    it('should include Ed25519 context when public key is present', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(result.didDocument['@context']).toContain('https://w3id.org/security/suites/ed25519-2020/v1');
    });

    it('should include SRC44 data when present', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        src44: {
          vs: 1,
          nm: 'ACME Corp',
          tp: 'biz',
          ds: 'Pharmaceutical Manufacturer',
        },
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocument.src44).toBeDefined();
      expect(result.didDocument.src44).toEqual({
        vs: 1,
        nm: 'ACME Corp',
        tp: 'biz',
        ds: 'Pharmaceutical Manufacturer',
      });
    });

    it('should create mutable metadata for accounts', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16457748572299062825',
        accountRS: 'S-9K9L-4CB5-88Y5-F5G4Z',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      expect(result.didDocumentMetadata.immutable).toBe(false);
    });

    it('should create verification method with correct controller', async () => {
      const did = parser.parse('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      const accountData: AccountData = {
        accountId: '16107620026796983538',
        accountRS: '\tS-9K9L-4CB5-88Y5-F5G4Z',
        publicKey: '497D559D18D989B8E2D729EB6F69B70C1DDC3E554F75BEF3ED2716A4B2121902',
      };

      const builder = new AccountDidDocumentBuilder(did, accountData);
      const result = await builder.build();

      const vm = result.didDocument.verificationMethod![0];
      expect(vm.type).toBe('Ed25519VerificationKey2020');
      expect(vm.controller).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z');
      expect(vm.id).toBe('did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z#key-1');
      expect(vm.publicKeyMultibase).toMatch(`f${'497d559d18d989b8e2d729eb6f69b70c1ddc3e554f75bef3ed2716a4b2121902'}`);
    });
  });
});
