/**
 * Base DID Document Builder
 * Abstract class for building W3C-compliant DID documents
 */

import type {
  DidDocument,
  DidDocumentMetadata,
  ParsedDid,
  VerificationMethod,
} from "../types/did.js";

/**
 * Abstract base class for DID document builders
 */
export abstract class BaseDidDocumentBuilder {
  protected readonly parsedDid: ParsedDid;

  constructor(parsedDid: ParsedDid) {
    this.parsedDid = parsedDid;
  }

  /**
   * Build the complete DID document
   * Must be implemented by subclasses
   */
  abstract build(): Promise<{
    didDocument: DidDocument;
    didDocumentMetadata: DidDocumentMetadata;
  }>;

  /**
   * Create base DID document structure
   */
  protected createBaseDocument(): DidDocument {
    return {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: this.parsedDid.did,
    };
  }

  /**
   * Create verification method for a public key
   */
  protected createVerificationMethod(
    id: string,
    controller: string,
    publicKeyMultibase: string,
  ): VerificationMethod {
    return {
      id,
      type: "Ed25519VerificationKey2020",
      controller,
      publicKeyMultibase,
    };
  }

  /**
   * Create base document metadata
   */
  protected createBaseMetadata(
    created?: string,
    updated?: string,
  ): DidDocumentMetadata {
    return {
      created,
      updated,
      immutable: false,
    };
  }
}
