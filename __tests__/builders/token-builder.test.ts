/**
 * Unit tests for TokenBuilder
 */

import { describe, it, expect } from "vitest";
import {
  TokenDidDocumentBuilder,
  type TokenData,
} from "../../src/builders/token-builder.js";
import type { ParsedDid } from "../../src/types/did.js";

describe("TokenDidDocumentBuilder", () => {
  const createParsedDid = (identifier: string): ParsedDid => ({
    did: `did:signum:token:${identifier}`,
    method: "signum",
    network: "mainnet",
    type: "token",
    identifier,
  });

  const createTokenData = (overrides?: Partial<TokenData>): TokenData => ({
    asset: "12345678901234567890",
    name: "MyToken",
    description: "A test token",
    accountId: "9876543210987654321",
    accountRS: "S-ISSU-ER-ADDR-ESSID",
    decimals: 8,
    quantityQNT: "100000000000000",
    timestamp: 240000000,
    height: 1234567,
    ...overrides,
  });

  describe("build", () => {
    it("should build DID document for token", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData();
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:token:12345678901234567890",
      );
      expect(result.didDocument["@context"]).toEqual([
        "https://www.w3.org/ns/did/v1",
      ]);
      expect(result.didDocument.controller).toBe(
        "did:signum:acc:S-ISSU-ER-ADDR-ESSID",
      );
    });

    it("should include token metadata in service endpoint", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData();
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.service).toBeDefined();
      expect(result.didDocument.service).toHaveLength(1);
      expect(result.didDocument.service![0]).toEqual({
        id: "did:signum:token:12345678901234567890#token-info",
        type: "TokenService",
        serviceEndpoint: {
          name: "MyToken",
          decimals: 8,
          totalSupply: "100000000000000",
        },
      });
    });

    it("should include SRC44 data when present", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const src44Data = {
        vs: 1,
        nm: "My Token",
        ds: "Test token description",
      };
      const tokenData = createTokenData({ src44: src44Data });
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.src44).toEqual(src44Data);
    });

    it("should set immutable to true in metadata", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData();
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocumentMetadata.immutable).toBe(true);
      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(result.didDocumentMetadata.blockHeight).toBe(1234567);
    });

    it("should handle testnet network", async () => {
      const parsedDid: ParsedDid = {
        did: "did:signum:testnet:token:12345678901234567890",
        method: "signum",
        network: "testnet",
        type: "token",
        identifier: "12345678901234567890",
      };
      const tokenData = createTokenData();
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:testnet:token:12345678901234567890",
      );
      expect(result.didDocument.controller).toBe(
        "did:signum:testnet:acc:S-ISSU-ER-ADDR-ESSID",
      );
    });

    it("should handle token with zero decimals", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData({
        decimals: 0,
        quantityQNT: "1000",
      });
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.service![0].serviceEndpoint).toEqual({
        name: "MyToken",
        decimals: 0,
        totalSupply: "1000",
      });
    });

    it("should handle token without description", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData({ description: undefined });
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:token:12345678901234567890",
      );
      expect(result.didDocument.src44).toBeUndefined();
    });

    it("should handle large token supply", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData({
        quantityQNT: "999999999999999999",
        decimals: 18,
      });
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocument.service![0].serviceEndpoint).toEqual({
        name: "MyToken",
        decimals: 18,
        totalSupply: "999999999999999999",
      });
    });

    it("should include creation timestamp in metadata", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const tokenData = createTokenData({ timestamp: 250000000 });
      const builder = new TokenDidDocumentBuilder(parsedDid, tokenData);

      const result = await builder.build();

      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(typeof result.didDocumentMetadata.created).toBe("string");
    });
  });
});
