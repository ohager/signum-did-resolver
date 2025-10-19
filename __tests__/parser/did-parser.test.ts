/**
 * Tests for DID Parser
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DidParser, DidParseError } from "../../src/parser";

describe("DidParser", () => {
  let parser: DidParser;

  beforeEach(() => {
    parser = new DidParser();
  });

  describe("parse()", () => {
    describe("valid DIDs", () => {
      it("should parse transaction DID with mainnet (implicit)", () => {
        const result = parser.parse("did:signum:tx:12345678901234567890");
        expect(result).toEqual({
          did: "did:signum:tx:12345678901234567890",
          method: "signum",
          network: "mainnet",
          type: "tx",
          identifier: "12345678901234567890",
        });
      });

      it("should parse transaction DID with explicit mainnet", () => {
        const result = parser.parse(
          "did:signum:mainnet:tx:12345678901234567890",
        );
        expect(result).toEqual({
          did: "did:signum:mainnet:tx:12345678901234567890",
          method: "signum",
          network: "mainnet",
          type: "tx",
          identifier: "12345678901234567890",
        });
      });

      it("should parse transaction DID with testnet", () => {
        const result = parser.parse(
          "did:signum:testnet:tx:98765432109876543210",
        );
        expect(result).toEqual({
          did: "did:signum:testnet:tx:98765432109876543210",
          method: "signum",
          network: "testnet",
          type: "tx",
          identifier: "98765432109876543210",
        });
      });

      it("should parse account DID with RS-address", () => {
        const result = parser.parse("did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z");
        expect(result).toEqual({
          did: "did:signum:acc:S-9K9L-4CB5-88Y5-F5G4Z",
          method: "signum",
          network: "mainnet",
          type: "acc",
          identifier: "S-9K9L-4CB5-88Y5-F5G4Z",
        });
      });

      it("should parse account DID with testnet RS-address", () => {
        const result = parser.parse("did:signum:acc:TS-9K9L-4CB5-88Y5-F5G4Z");
        expect(result).toEqual({
          did: "did:signum:acc:TS-9K9L-4CB5-88Y5-F5G4Z",
          method: "signum",
          network: "mainnet",
          type: "acc",
          identifier: "TS-9K9L-4CB5-88Y5-F5G4Z",
        });
      });

      it("should parse account DID with numeric ID", () => {
        const result = parser.parse("did:signum:acc:16457748572299062825");
        expect(result).toEqual({
          did: "did:signum:acc:16457748572299062825",
          method: "signum",
          network: "mainnet",
          type: "acc",
          identifier: "16457748572299062825",
        });
      });

      it("should parse alias DID with numeric ID", () => {
        const result = parser.parse("did:signum:alias:12345678901234567890");
        expect(result).toEqual({
          did: "did:signum:alias:12345678901234567890",
          method: "signum",
          network: "mainnet",
          type: "alias",
          identifier: "12345678901234567890",
        });
      });

      it("should parse alias DID with name", () => {
        const result = parser.parse("did:signum:alias:myalias");
        expect(result).toEqual({
          did: "did:signum:alias:myalias",
          method: "signum",
          network: "mainnet",
          type: "alias",
          identifier: "myalias",
        });
      });

      it("should parse alias DID with TLD:name format", () => {
        const result = parser.parse("did:signum:alias:web3:ohager");
        expect(result).toEqual({
          did: "did:signum:alias:web3:ohager",
          method: "signum",
          network: "mainnet",
          type: "alias",
          identifier: "web3:ohager",
        });
      });

      it("should parse contract DID", () => {
        const result = parser.parse("did:signum:contract:23456789012345678901");
        expect(result).toEqual({
          did: "did:signum:contract:23456789012345678901",
          method: "signum",
          network: "mainnet",
          type: "contract",
          identifier: "23456789012345678901",
        });
      });

      it("should parse token DID", () => {
        const result = parser.parse("did:signum:token:34567890123456789012");
        expect(result).toEqual({
          did: "did:signum:token:34567890123456789012",
          method: "signum",
          network: "mainnet",
          type: "token",
          identifier: "34567890123456789012",
        });
      });
    });

    describe("invalid DIDs", () => {
      it("should throw on empty string", () => {
        expect(() => parser.parse("")).toThrow(DidParseError);
        expect(() => parser.parse("")).toThrow(
          "DID must be a non-empty string",
        );
      });

      it('should throw on DID without "did:" prefix', () => {
        expect(() => parser.parse("signum:tx:12345678901234567890")).toThrow(
          DidParseError,
        );
        expect(() => parser.parse("signum:tx:12345678901234567890")).toThrow(
          'must start with "did:"',
        );
      });

      it("should throw on wrong method", () => {
        expect(() =>
          parser.parse("did:ethereum:tx:12345678901234567890"),
        ).toThrow(DidParseError);
        expect(() =>
          parser.parse("did:ethereum:tx:12345678901234567890"),
        ).toThrow("Invalid Signum DID format");
      });

      it("should throw on invalid network", () => {
        expect(() =>
          parser.parse("did:signum:invalidnet:tx:12345678901234567890"),
        ).toThrow(DidParseError);
      });

      it("should throw on invalid type", () => {
        expect(() =>
          parser.parse("did:signum:invalidtype:12345678901234567890"),
        ).toThrow(DidParseError);
      });

      it("should throw on empty identifier", () => {
        expect(() => parser.parse("did:signum:tx:")).toThrow(DidParseError);
        expect(() => parser.parse("did:signum:tx:")).toThrow(
          "Invalid Signum DID format",
        );
      });

      it("should throw on invalid transaction ID (too short)", () => {
        expect(() => parser.parse("did:signum:tx:12345")).toThrow(
          DidParseError,
        );
        expect(() => parser.parse("did:signum:tx:12345")).toThrow(
          "Must be 18-23 digit numeric ID",
        );
      });

      it("should throw on invalid transaction ID (too long)", () => {
        expect(() =>
          parser.parse("did:signum:tx:1234567890123456789012345"),
        ).toThrow(DidParseError);
      });

      it("should throw on invalid transaction ID (non-numeric)", () => {
        expect(() => parser.parse("did:signum:tx:abc123def456")).toThrow(
          DidParseError,
        );
      });

      it("should throw on invalid account RS-address format", () => {
        expect(() => parser.parse("did:signum:acc:INVALID-ADDRESS")).toThrow(
          DidParseError,
        );
        expect(() => parser.parse("did:signum:acc:S-ABC")).toThrow(
          DidParseError,
        );
      });

      it("should throw on invalid alias format", () => {
        expect(() => parser.parse("did:signum:alias:invalid@name")).toThrow(
          DidParseError,
        );
        expect(() => parser.parse("did:signum:alias:tld:name:extra")).toThrow(
          DidParseError,
        );
      });
    });

    describe("whitespace handling", () => {
      it("should trim whitespace from DID", () => {
        const result = parser.parse("  did:signum:tx:12345678901234567890  ");
        expect(result.did).toBe("did:signum:tx:12345678901234567890");
      });
    });
  });

  describe("isValid()", () => {
    it("should return true for valid DIDs", () => {
      expect(parser.isValid("did:signum:tx:12345678901234567890")).toBe(true);
      expect(
        parser.isValid("did:signum:testnet:acc:S-9K9L-4CB5-88Y5-F5G4Z"),
      ).toBe(true);
      expect(parser.isValid("did:signum:acc:TS-9K9L-4CB5-88Y5-F5G4Z")).toBe(
        true,
      );
      expect(parser.isValid("did:signum:alias:web3:ohager")).toBe(true);
    });

    it("should return false for invalid DIDs", () => {
      expect(parser.isValid("")).toBe(false);
      expect(parser.isValid("not-a-did")).toBe(false);
      expect(parser.isValid("did:ethereum:tx:123")).toBe(false);
      expect(parser.isValid("did:signum:tx:invalid")).toBe(false);
    });
  });

  describe("build()", () => {
    it("should build mainnet DID without network prefix", () => {
      const did = parser.build("tx", "12345678901234567890");
      expect(did).toBe("did:signum:tx:12345678901234567890");
    });

    it("should build mainnet DID when explicitly specified", () => {
      const did = parser.build("tx", "12345678901234567890", "mainnet");
      expect(did).toBe("did:signum:tx:12345678901234567890");
    });

    it("should build testnet DID with network prefix", () => {
      const did = parser.build("acc", "S-9K9L-4CB5-88Y5-F5G4Z", "testnet");
      expect(did).toBe("did:signum:testnet:acc:S-9K9L-4CB5-88Y5-F5G4Z");
    });

    it("should build alias DID with TLD", () => {
      const did = parser.build("alias", "web3:ohager");
      expect(did).toBe("did:signum:alias:web3:ohager");
    });

    it("should build token DID", () => {
      const did = parser.build("token", "34567890123456789012");
      expect(did).toBe("did:signum:token:34567890123456789012");
    });

    it("should build contract DID", () => {
      const did = parser.build("contract", "23456789012345678901");
      expect(did).toBe("did:signum:contract:23456789012345678901");
    });
  });
});
