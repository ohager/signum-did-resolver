/**
 * Token (Asset) DID Document Builder
 * Builds DID documents for Signum tokens/assets with optional SRC44 data
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
 * Token/Asset data required for building DID document
 */
export interface TokenData {
  asset: string; // Asset ID
  name: string;
  description?: string;
  accountId: string; // Issuer account ID
  accountRS: string; // Issuer RS address
  decimals: number;
  quantityQNT: string;
  timestamp: number;
  height: number;
  src44?: Src44Data;
}

/**
 * Builder for Token/Asset DID Documents
 */
export class TokenDidDocumentBuilder extends BaseDidDocumentBuilder {
  private readonly tokenData: TokenData;

  constructor(parsedDid: ParsedDid, tokenData: TokenData) {
    super(parsedDid);
    this.tokenData = tokenData;
  }

  /**
   * Build the DID document for a token/asset
   */
  async build(): Promise<{
    didDocument: DidDocument;
    didDocumentMetadata: DidDocumentMetadata;
  }> {
    const doc = this.createBaseDocument();

    // Controller is the issuer account
    doc.controller = `did:signum:${this.parsedDid.network === "mainnet" ? "" : this.parsedDid.network + ":"}acc:${this.tokenData.accountRS}`;

    // Add token metadata as service endpoint
    doc.service = [
      {
        id: `${this.parsedDid.did}#token-info`,
        type: "TokenService",
        serviceEndpoint: {
          name: this.tokenData.name,
          decimals: this.tokenData.decimals,
          totalSupply: this.tokenData.quantityQNT,
        },
      },
    ];

    // Add SRC44 data if present (from asset description)
    if (this.tokenData.src44) {
      doc.src44 = this.tokenData.src44;
    }

    // Create metadata
    const createdDate = ChainTime.fromChainTimestamp(this.tokenData.timestamp)
      .getDate()
      .toISOString();
    const metadata: DidDocumentMetadata = {
      created: createdDate,
      blockHeight: this.tokenData.height,
      immutable: true, // Token metadata is immutable once created
    };

    return {
      didDocument: doc,
      didDocumentMetadata: metadata,
    };
  }
}
