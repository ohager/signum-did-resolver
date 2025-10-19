/**
 * DID Types for Signum Network
 * Based on W3C DID Core 1.0 Specification
 */

import type { src44 } from "@signumjs/standards";

/**
 * Signum structured data descriptor
 */
export type Src44Data = src44.SRC44Descriptor;

/**
 * Supported Signum networks
 */
export type SignumNetwork = 'mainnet' | 'testnet';

/**
 * Supported DID entity types on Signum blockchain
 */
export type SignumDidType = 'tx' | 'acc' | 'alias' | 'contract' | 'token';

/**
 * Parsed DID components
 */
export interface ParsedDid {
  /** Full DID string */
  did: string;
  /** DID method (always 'signum') */
  method: 'signum';
  /** Network identifier (defaults to 'mainnet' if not specified) */
  network: SignumNetwork;
  /** Entity type */
  type: SignumDidType;
  /** Entity identifier (numeric ID, RS-address, or alias name) */
  identifier: string;
}

/**
 * W3C DID Document Verification Method
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
}

/**
 * W3C DID Document Service Endpoint
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string | Record<string, unknown>;
}

/**
 * W3C DID Document
 * @see https://www.w3.org/TR/did-core/#did-document-properties
 */
export interface DidDocument {
  '@context': string | string[];
  id: string;
  controller?: string | string[];
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  capabilityInvocation?: (string | VerificationMethod)[];
  capabilityDelegation?: (string | VerificationMethod)[];
  service?: ServiceEndpoint[];
  alsoKnownAs?: string[];
  /** SRC44 metadata (Signum-specific) */
  src44?: Src44Data;
  /** Additional properties allowed for extensibility */
  [key: string]: unknown;
}

/**
 * DID Resolution Metadata
 * @see https://w3c.github.io/did-resolution/#did-resolution-metadata
 */
export interface DidResolutionMetadata {
  contentType?: string;
  error?: DIDResolutionError;
  [key: string]: unknown;
}

/**
 * DID Document Metadata
 * @see https://w3c.github.io/did-resolution/#did-document-metadata
 */
export interface DidDocumentMetadata {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  versionId?: string;
  nextUpdate?: string;
  nextVersionId?: string;
  /** Block height where DID was created (Signum-specific) */
  blockHeight?: number;
  /** Number of confirmations (Signum-specific) */
  confirmations?: number;
  /** Whether this DID is immutable (e.g., transaction DIDs) */
  immutable?: boolean;
  [key: string]: unknown;
}

/**
 * Complete DID Resolution Result
 * @see https://w3c.github.io/did-resolution/#did-resolution-result
 */
export interface DidResolutionResult {
  didResolutionMetadata: DidResolutionMetadata;
  didDocument: DidDocument | null;
  didDocumentMetadata: DidDocumentMetadata;
}

/**
 * DID Resolution Errors
 * @see https://w3c.github.io/did-resolution/#errors
 */
export type DIDResolutionError =
  | 'invalidDid'
  | 'notFound'
  | 'representationNotSupported'
  | 'methodNotSupported'
  | 'invalidDidDocument'
  | 'internalError';
