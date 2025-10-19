/**
 * Alias DID Document Builder
 * Builds DID documents for Signum aliases with optional SRC44 data
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
 * Alias data required for building DID document
 */
export interface AliasData {
  aliasId: string;
  aliasName: string;
  tld?: string; // TLD (top-level domain), defaults to 'signum' if not specified
  aliasURI?: string; // Actually the description field, can contain SRC44 data
  accountId: string;
  accountRS: string;
  timestamp: number;
  src44?: Src44Data;
}

/**
 * Builder for Alias DID Documents
 */
export class AliasDidDocumentBuilder extends BaseDidDocumentBuilder {
  private readonly aliasData: AliasData;

  constructor(parsedDid: ParsedDid, aliasData: AliasData) {
    super(parsedDid);
    this.aliasData = aliasData;
  }

  /**
   * Build the DID document for an alias
   */
  async build(): Promise<{
    didDocument: DidDocument;
    didDocumentMetadata: DidDocumentMetadata;
  }> {
    const doc = this.createBaseDocument();

    // Determine TLD (defaults to 'signum')
    const tld = this.aliasData.tld || "signum";
    const fullAliasName = `${tld}:${this.aliasData.aliasName}`;

    // Add also known as (numeric ID if name was used, or vice versa)
    const isNumericIdentifier = /^\d{18,23}$/.test(this.parsedDid.identifier);
    const networkPrefix =
      this.parsedDid.network === "mainnet" ? "" : this.parsedDid.network + ":";

    if (isNumericIdentifier) {
      // DID is numeric, add name version
      const nameDid = `did:signum:${networkPrefix}alias:${fullAliasName}`;
      doc.alsoKnownAs = [nameDid];
    } else {
      // DID is name-based, add numeric version
      const numericDid = `did:signum:${networkPrefix}alias:${this.aliasData.aliasId}`;
      doc.alsoKnownAs = [numericDid];
    }

    // Controller is the account that owns the alias
    const controllerDid = `did:signum:${networkPrefix}acc:${this.aliasData.accountRS}`;
    doc.controller = controllerDid;

    // Add SRC44 data if present (parsed from aliasURI which is actually the description)
    if (this.aliasData.src44) {
      doc.src44 = this.aliasData.src44;
    }

    // Create metadata
    const createdDate = ChainTime.fromChainTimestamp(this.aliasData.timestamp)
      .getDate()
      .toISOString();
    const metadata: DidDocumentMetadata = {
      created: createdDate,
      immutable: false, // Aliases can be updated by owner
    };

    return {
      didDocument: doc,
      didDocumentMetadata: metadata,
    };
  }
}
