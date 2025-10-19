/**
 * Signum DID Resolver
 * Main resolver class that handles DID resolution using @signumjs
 */

import { Ledger } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { DidParser } from "../parser/did-parser.js";
import { TransactionDidDocumentBuilder } from "../builders/transaction-builder.js";
import { AccountDidDocumentBuilder } from "../builders/account-builder.js";
import type {
  DidResolutionResult,
  ParsedDid,
  DIDResolutionError,
  Src44Data,
} from "../types/did.js";

/**
 * Signum DID Resolver
 * Resolves Signum DIDs to W3C-compliant DID Documents
 */
export class SignumDidResolver {
  private readonly parser: DidParser;

  constructor(private ledgerClient: Ledger) {
    this.parser = new DidParser();
  }

  /**
   * Resolve a DID to a DID Document
   *
   * @param did - The DID to resolve
   * @returns DID Resolution Result
   */
  async resolve(did: string): Promise<DidResolutionResult> {
    // Parse DID
    let parsedDid: ParsedDid;
    try {
      parsedDid = this.parser.parse(did);
    } catch (error) {
      return this.createErrorResult(
        "invalidDid",
        error instanceof Error ? error.message : "Invalid DID format",
      );
    }

    // Route to appropriate resolver based on type
    try {
      switch (parsedDid.type) {
        case "tx":
          return await this.resolveTransaction(parsedDid);
        case "acc":
          return await this.resolveAccount(parsedDid);
        case "alias":
        case "contract":
        case "token":
          return this.createErrorResult(
            "methodNotSupported",
            `DID type '${parsedDid.type}' not yet implemented`,
          );
        default:
          return this.createErrorResult(
            "invalidDid",
            `Unknown DID type: ${parsedDid.type}`,
          );
      }
    } catch (error) {
      return this.createErrorResult(
        "internalError",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private getSrc44Data(attachment: string) {
    try {
      return src44.DescriptorData.parse(attachment, false).raw;
    } catch (error) {
      // ignore
    }
  }

  /**
   * Resolve a transaction DID
   */
  private async resolveTransaction(
    parsedDid: ParsedDid,
  ): Promise<DidResolutionResult> {
    try {
      // Fetch transaction from blockchain
      const tx = await this.ledgerClient.transaction.getTransaction(
        parsedDid.identifier,
      );

      // Parse SRC44 from message attachment if present
      let src44: Src44Data | undefined;
      if (tx.attachment?.message && tx.attachment.messageIsText) {
        src44 = this.getSrc44Data(tx.attachment.message);
      }

      // Build DID document using builder
      const builder = new TransactionDidDocumentBuilder(parsedDid, {
        transactionId: tx.transaction,
        senderPublicKey: tx.senderPublicKey,
        senderId: tx.sender,
        senderRS: tx.senderRS,
        blockTimestamp: tx.blockTimestamp,
        blockHeight: tx.height,
        confirmations: tx.confirmations || 0,
        src44,
      });

      const { didDocument, didDocumentMetadata } = await builder.build();

      return {
        didResolutionMetadata: {
          contentType: "application/did+ld+json",
        },
        didDocument,
        didDocumentMetadata,
      };
    } catch (error) {
      // Check if transaction not found
      if (
        error instanceof Error &&
        error.message.includes("Unknown transaction")
      ) {
        return this.createErrorResult(
          "notFound",
          `Transaction ${parsedDid.identifier} not found`,
        );
      }
      throw error;
    }
  }

  /**
   * Resolve an account DID
   */
  private async resolveAccount(
    parsedDid: ParsedDid,
  ): Promise<DidResolutionResult> {
    try {
      // Fetch account from blockchain
      const account = await this.ledgerClient.account.getAccount({
        accountId: parsedDid.identifier,
        includeCommittedAmount: false,
        includeEstimatedCommitment: false,
      });

      let src44: Src44Data | undefined;
      if (account.description) {
        src44 = this.getSrc44Data(account.description);
      }

      // Build DID document using builder
      const builder = new AccountDidDocumentBuilder(parsedDid, {
        accountId: account.account,
        accountRS: account.accountRS,
        publicKey: account.publicKey,
        name: account.name,
        description: account.description,
        src44,
      });

      const { didDocument, didDocumentMetadata } = await builder.build();

      return {
        didResolutionMetadata: {
          contentType: "application/did+ld+json",
        },
        didDocument,
        didDocumentMetadata,
      };
    } catch (error) {
      // Check if account not found
      if (error instanceof Error && error.message.includes("Unknown account")) {
        return this.createErrorResult(
          "notFound",
          `Account ${parsedDid.identifier} not found`,
        );
      }
      throw error;
    }
  }

  /**
   * Create an error resolution result
   */
  private createErrorResult(
    error: DIDResolutionError,
    message: string,
  ): DidResolutionResult {
    return {
      didResolutionMetadata: {
        error,
        message,
      },
      didDocument: null,
      didDocumentMetadata: {},
    };
  }
}
