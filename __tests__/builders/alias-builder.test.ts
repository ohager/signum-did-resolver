/**
 * Unit tests for AliasBuilder
 */

import { describe, it, expect } from "vitest";
import {
  AliasDidDocumentBuilder,
  type AliasData,
} from "../../src/builders/alias-builder.js";
import type { ParsedDid } from "../../src/types/did.js";

describe("AliasDidDocumentBuilder", () => {
  const createParsedDid = (identifier: string): ParsedDid => ({
    did: `did:signum:alias:${identifier}`,
    method: "signum",
    network: "mainnet",
    type: "alias",
    identifier,
  });

  const createAliasData = (overrides?: Partial<AliasData>): AliasData => ({
    aliasId: "12345678901234567890",
    aliasName: "myalias",
    tld: "signum", // Default TLD
    aliasURI: undefined, // Actually contains description/SRC44 data
    accountId: "9876543210987654321",
    accountRS: "S-ABCD-EFGH-IJKL-MNOPQ",
    timestamp: 240000000,
    ...overrides,
  });

  describe("build", () => {
    it("should build DID document with numeric identifier", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const aliasData = createAliasData();
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:alias:12345678901234567890",
      );
      expect(result.didDocument["@context"]).toEqual([
        "https://www.w3.org/ns/did/v1",
      ]);
      expect(result.didDocument.controller).toBe(
        "did:signum:acc:S-ABCD-EFGH-IJKL-MNOPQ",
      );
      // Should include full TLD:name in alsoKnownAs
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:alias:signum:myalias",
      ]);
    });

    it("should build DID document with name identifier", async () => {
      const parsedDid = createParsedDid("signum:myalias");
      const aliasData = createAliasData();
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe("did:signum:alias:signum:myalias");
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:alias:12345678901234567890",
      ]);
    });

    it("should handle custom TLD", async () => {
      const parsedDid = createParsedDid("customtld:myalias");
      const aliasData = createAliasData({ tld: "customtld" });
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe("did:signum:alias:customtld:myalias");
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:alias:12345678901234567890",
      ]);
    });

    it("should default to 'signum' TLD when not specified", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const aliasData = createAliasData({ tld: undefined });
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      // When numeric ID is used, alsoKnownAs should include default 'signum' TLD
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:alias:signum:myalias",
      ]);
    });

    it("should include SRC44 data when present (parsed from aliasURI)", async () => {
      const parsedDid = createParsedDid("signum:myalias");
      const src44Data = {
        vs: 1,
        nm: "My Alias",
        ds: "Test alias",
      };
      const aliasData = createAliasData({
        src44: src44Data,
        aliasURI: JSON.stringify(src44Data),
      });
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.src44).toEqual(src44Data);
    });

    it("should not include service endpoints (aliasURI is for SRC44 data only)", async () => {
      const parsedDid = createParsedDid("signum:myalias");
      const aliasData = createAliasData({
        aliasURI: "some description text",
      });
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      // Service endpoints should not be added from aliasURI
      expect(result.didDocument.service).toBeUndefined();
    });

    it("should set immutable to false in metadata", async () => {
      const parsedDid = createParsedDid("signum:myalias");
      const aliasData = createAliasData();
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocumentMetadata.immutable).toBe(false);
      expect(result.didDocumentMetadata.created).toBeDefined();
    });

    it("should handle testnet network", async () => {
      const parsedDid: ParsedDid = {
        did: "did:signum:testnet:alias:signum:myalias",
        method: "signum",
        network: "testnet",
        type: "alias",
        identifier: "signum:myalias",
      };
      const aliasData = createAliasData();
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:testnet:alias:signum:myalias",
      );
      expect(result.didDocument.controller).toBe(
        "did:signum:testnet:acc:S-ABCD-EFGH-IJKL-MNOPQ",
      );
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:testnet:alias:12345678901234567890",
      ]);
    });

    it("should handle alias name without explicit TLD in identifier", async () => {
      const parsedDid = createParsedDid("myalias");
      const aliasData = createAliasData({ tld: "signum" });
      const builder = new AliasDidDocumentBuilder(parsedDid, aliasData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe("did:signum:alias:myalias");
      // alsoKnownAs should include numeric ID
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:alias:12345678901234567890",
      ]);
    });
  });
});
