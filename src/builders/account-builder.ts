/**
 * Account DID Document Builder
 * Builds DID documents for Signum accounts with optional SRC44 data
 */

import { BaseDidDocumentBuilder } from './base-builder';
import type { DidDocument, DidDocumentMetadata, ParsedDid, Src44Data } from '@/types/did';
/**
 * Account data required for building DID document
 */
export interface AccountData {
  accountId: string;
  accountRS: string;
  publicKey?: string;
  name?: string;
  description?: string;
  src44?: Src44Data;
}

/**
 * Builder for Account DID Documents
 */
export class AccountDidDocumentBuilder extends BaseDidDocumentBuilder {
  private readonly accountData: AccountData;

  constructor(parsedDid: ParsedDid, accountData: AccountData) {
    super(parsedDid);
    this.accountData = accountData;
  }

  /**
   * Build the DID document for an account
   */
  async build(): Promise<{
    didDocument: DidDocument;
    didDocumentMetadata: DidDocumentMetadata;
  }> {
    const doc = this.createBaseDocument();

    // Add also known as (numeric ID if RS-address was used, or vice versa)
    const isRSAddress = this.parsedDid.identifier.startsWith('S-') ||
                        this.parsedDid.identifier.startsWith('TS-');

    if (isRSAddress) {
      const numericDid = `did:signum:${this.parsedDid.network === 'mainnet' ? '' : this.parsedDid.network + ':'}acc:${this.accountData.accountId}`;
      doc.alsoKnownAs = [numericDid];
    } else {
      const rsDid = `did:signum:${this.parsedDid.network === 'mainnet' ? '' : this.parsedDid.network + ':'}acc:${this.accountData.accountRS}`;
      doc.alsoKnownAs = [rsDid];
    }

    // Add verification method if public key is available
    if (this.accountData.publicKey) {
      doc['@context'] = [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ];

      const verificationMethodId = `${this.parsedDid.did}#key-1`;
      const publicKeyMultibase = `f${this.accountData.publicKey.toLowerCase()}`;

      doc.verificationMethod = [
        this.createVerificationMethod(verificationMethodId, this.parsedDid.did, publicKeyMultibase),
      ];

      // Account can authenticate
      doc.authentication = [verificationMethodId];
    }

    // Add SRC44 data if present (from account description)
    if (this.accountData.src44) {
      doc.src44 = this.accountData.src44;
    }

    // Create metadata
    const metadata: DidDocumentMetadata = {
      immutable: false, // Accounts can be updated
    };

    return {
      didDocument: doc,
      didDocumentMetadata: metadata,
    };
  }
}
