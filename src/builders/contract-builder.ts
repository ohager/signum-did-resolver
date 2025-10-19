/**
 * Contract DID Document Builder
 * Builds DID documents for Signum smart contracts with optional SRC44 data
 */

import { BaseDidDocumentBuilder } from "./base-builder.js";
import type {
  DidDocument,
  DidDocumentMetadata,
  ParsedDid,
  Src44Data,
} from "../types/did.js";
import { ChainTime } from "@signumjs/util";

/**
 * Contract data required for building DID document
 */
export interface ContractData {
  at: string; // Contract ID
  atRS: string; // Contract RS address
  creator: string; // Creator account ID
  creatorRS: string; // Creator RS address
  creationBlock: number;
  creationBlockTimestamp: number;
  name?: string;
  description?: string;
  src44?: Src44Data;
}

/**
 * Builder for Contract DID Documents
 */
export class ContractDidDocumentBuilder extends BaseDidDocumentBuilder {
  private readonly contractData: ContractData;

  constructor(parsedDid: ParsedDid, contractData: ContractData) {
    super(parsedDid);
    this.contractData = contractData;
  }

  /**
   * Build the DID document for a contract
   */
  async build(): Promise<{
    didDocument: DidDocument;
    didDocumentMetadata: DidDocumentMetadata;
  }> {
    const doc = this.createBaseDocument();

    // Controller is the creator account
    doc.controller = `did:signum:${this.parsedDid.network === "mainnet" ? "" : this.parsedDid.network + ":"}acc:${this.contractData.creatorRS}`;

    // Add also known as with RS address format
    const contractRSDid = `did:signum:${this.parsedDid.network === "mainnet" ? "" : this.parsedDid.network + ":"}contract:${this.contractData.atRS}`;
    doc.alsoKnownAs = [contractRSDid];

    // Add SRC44 data if present
    if (this.contractData.src44) {
      doc.src44 = this.contractData.src44;
    }

    // Create metadata
    const createdDate = ChainTime.fromChainTimestamp(
      this.contractData.creationBlockTimestamp,
    )
      .getDate()
      .toISOString();
    const metadata: DidDocumentMetadata = {
      created: createdDate,
      blockHeight: this.contractData.creationBlock,
      immutable: false, // Contract state can change (but contract itself is immutable)
    };

    return {
      didDocument: doc,
      didDocumentMetadata: metadata,
    };
  }
}
