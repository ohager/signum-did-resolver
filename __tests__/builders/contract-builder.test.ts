/**
 * Unit tests for ContractBuilder
 */

import { describe, it, expect } from "vitest";
import {
  ContractDidDocumentBuilder,
  type ContractData,
} from "../../src/builders";
import type { ParsedDid } from "../../src/types/did.js";

describe("ContractDidDocumentBuilder", () => {
  const createParsedDid = (identifier: string): ParsedDid => ({
    did: `did:signum:contract:${identifier}`,
    method: "signum",
    network: "mainnet",
    type: "contract",
    identifier,
  });

  const createContractData = (
    overrides?: Partial<ContractData>,
  ): ContractData => ({
    at: "12345678901234567890",
    atRS: "S-CONT-RACT-ADDR-ESSID",
    creator: "9876543210987654321",
    creatorRS: "S-CREA-TOR-ADDR-ESSID",
    creationBlock: 1234567,
    creationBlockTimestamp: 240000000,
    name: "MyContract",
    description: "A test smart contract",
    ...overrides,
  });

  describe("build", () => {
    it("should build DID document for contract", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const contractData = createContractData();
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:contract:12345678901234567890",
      );
      expect(result.didDocument["@context"]).toEqual([
        "https://www.w3.org/ns/did/v1",
      ]);
      expect(result.didDocument.controller).toBe(
        "did:signum:acc:S-CREA-TOR-ADDR-ESSID",
      );
    });

    it("should include alsoKnownAs with RS address", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const contractData = createContractData();
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:contract:S-CONT-RACT-ADDR-ESSID",
      ]);
    });

    it("should include SRC44 data when present", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const src44Data = {
        vs: 1,
        nm: "My Contract",
        ds: "Test contract description",
      };
      const contractData = createContractData({ src44: src44Data });
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocument.src44).toEqual(src44Data);
    });

    it("should set immutable to false in metadata", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const contractData = createContractData();
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocumentMetadata.immutable).toBe(false);
      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(result.didDocumentMetadata.blockHeight).toBe(1234567);
    });

    it("should handle testnet network", async () => {
      const parsedDid: ParsedDid = {
        did: "did:signum:testnet:contract:12345678901234567890",
        method: "signum",
        network: "testnet",
        type: "contract",
        identifier: "12345678901234567890",
      };
      const contractData = createContractData();
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:testnet:contract:12345678901234567890",
      );
      expect(result.didDocument.controller).toBe(
        "did:signum:testnet:acc:S-CREA-TOR-ADDR-ESSID",
      );
      expect(result.didDocument.alsoKnownAs).toEqual([
        "did:signum:testnet:contract:S-CONT-RACT-ADDR-ESSID",
      ]);
    });

    it("should handle contract without name and description", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const contractData = createContractData({
        name: undefined,
        description: undefined,
      });
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocument.id).toBe(
        "did:signum:contract:12345678901234567890",
      );
      expect(result.didDocument.src44).toBeUndefined();
    });

    it("should include creation timestamp in metadata", async () => {
      const parsedDid = createParsedDid("12345678901234567890");
      const contractData = createContractData({
        creationBlockTimestamp: 250000000,
      });
      const builder = new ContractDidDocumentBuilder(parsedDid, contractData);

      const result = await builder.build();

      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(typeof result.didDocumentMetadata.created).toBe("string");
    });
  });
});
