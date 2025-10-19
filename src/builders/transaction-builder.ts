/**
 * Transaction DID Document Builder
 * Builds DID documents for Signum transactions with SRC44 data
 */

import {BaseDidDocumentBuilder} from './base-builder';
import type {DidDocument, DidDocumentMetadata, ParsedDid, Src44Data} from '@/types/did';
import {ChainTime} from "@signumjs/util";


/**
 * Transaction data required for building DID document
 */
export interface TransactionData {
    transactionId: string;
    senderPublicKey: string;
    senderId: string;
    senderRS: string;
    blockTimestamp: number;
    blockHeight: number;
    confirmations: number;
    src44?: Src44Data;
}

/**
 * Builder for Transaction DID Documents
 */
export class TransactionDidDocumentBuilder extends BaseDidDocumentBuilder {
    private readonly txData: TransactionData;

    constructor(parsedDid: ParsedDid, txData: TransactionData) {
        super(parsedDid);
        this.txData = txData;
    }

    /**
     * Build the DID document for a transaction
     */
    async build(): Promise<{
        didDocument: DidDocument;
        didDocumentMetadata: DidDocumentMetadata;
    }> {
        const doc = this.createBaseDocument();

        // Add W3C security context for Ed25519
        doc['@context'] = [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ];

        // Controller is the sender account
        const controllerDid = `did:signum:${this.parsedDid.network === 'mainnet' ? '' : this.parsedDid.network + ':'}acc:${this.txData.senderRS}`;
        doc.controller = controllerDid;

        // Verification method using sender's public key
        const verificationMethodId = `${this.parsedDid.did}#creator`;
        const publicKeyMultibase = `f${this.txData.senderPublicKey.toLowerCase()}`;

        doc.verificationMethod = [
            this.createVerificationMethod(verificationMethodId, controllerDid, publicKeyMultibase),
        ];

        // Add SRC44 data if present
        if (this.txData.src44) {
            doc.src44 = this.txData.src44;
        }

        // Create metadata
        const createdDate = ChainTime.fromChainTimestamp(this.txData.blockTimestamp).getDate().toISOString();
        const metadata: DidDocumentMetadata = {
            created: createdDate,
            blockHeight: this.txData.blockHeight,
            confirmations: this.txData.confirmations,
            immutable: true, // Transactions are immutable
        };

        return {
            didDocument: doc,
            didDocumentMetadata: metadata,
        };
    }
}
