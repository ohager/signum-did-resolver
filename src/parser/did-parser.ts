/**
 * DID URI Parser for Signum Network
 * Parses and validates did:signum URIs according to W3C DID specification
 */

import type { ParsedDid, SignumNetwork, SignumDidType } from "../types/did.js";

/**
 * Parse error class for DID parsing failures
 */
export class DidParseError extends Error {
  constructor(
    message: string,
    public readonly did?: string,
  ) {
    super(message);
    this.name = "DidParseError";
  }
}

/**
 * DID Parser for Signum Network
 * Parses and validates did:signum URIs according to W3C DID specification
 *
 * @example
 * ```typescript
 * const parser = new DidParser();
 * const parsed = parser.parse('did:signum:tx:12345678901234567890');
 * // { did: '...', method: 'signum', network: 'mainnet', type: 'tx', identifier: '...' }
 *
 * const isValid = parser.isValid('did:signum:testnet:acc:S-9K9L-4CB5-88Y5-F5G4Z');
 * // true
 *
 * const did = parser.build('tx', '12345678901234567890');
 * // 'did:signum:tx:12345678901234567890'
 * ```
 */
export class DidParser {
  /**
   * Regular expression for validating Signum DID format
   * Format: did:signum:[network]:[type]:[identifier]
   * Network is optional (defaults to mainnet)
   */
  private static readonly DID_REGEX =
    /^did:signum:(?:(?<network>mainnet|testnet|stagenet):)?(?<type>tx|acc|alias|contract|token):(?<identifier>.+)$/;

  /**
   * Valid Signum networks
   */
  private static readonly VALID_NETWORKS: SignumNetwork[] = [
    "mainnet",
    "testnet",
  ];

  /**
   * Valid DID entity types
   */
  private static readonly VALID_TYPES: SignumDidType[] = [
    "tx",
    "acc",
    "alias",
    "contract",
    "token",
  ];

  /**
   * Parse a Signum DID URI into its components
   *
   * @param did - The DID URI to parse
   * @returns Parsed DID components
   * @throws {DidParseError} If DID format is invalid
   *
   * @example
   * ```typescript
   * const parser = new DidParser();
   * const parsed = parser.parse('did:signum:tx:12345678901234567890');
   * // { did: '...', method: 'signum', network: 'mainnet', type: 'tx', identifier: '...' }
   *
   * const parsed2 = parser.parse('did:signum:testnet:acc:S-9K9L-4CB5-88Y5-F5G4Z');
   * // { did: '...', method: 'signum', network: 'testnet', type: 'acc', identifier: '...' }
   * ```
   */
  public parse(did: string): ParsedDid {
    const trimmedDid = did.trim();

    if (!trimmedDid) {
      throw new DidParseError("DID must be a non-empty string", did);
    }

    if (!trimmedDid.startsWith("did:")) {
      throw new DidParseError('DID must start with "did:"', trimmedDid);
    }

    const match = trimmedDid.match(DidParser.DID_REGEX);

    if (!match || !match.groups) {
      throw new DidParseError(
        "Invalid Signum DID format. Expected: did:signum:[network]:[type]:[identifier]",
        trimmedDid,
      );
    }

    const { network, type, identifier } = match.groups;

    // Network defaults to mainnet if not specified
    const parsedNetwork = (network || "mainnet") as SignumNetwork;
    const parsedType = type as SignumDidType;

    // Validate network
    if (!DidParser.VALID_NETWORKS.includes(parsedNetwork)) {
      throw new DidParseError(`Invalid network: ${parsedNetwork}`, trimmedDid);
    }

    // Validate type
    if (!DidParser.VALID_TYPES.includes(parsedType)) {
      throw new DidParseError(`Invalid type: ${parsedType}`, trimmedDid);
    }

    // Validate identifier is not empty
    if (!identifier || identifier.trim().length === 0) {
      throw new DidParseError("Identifier cannot be empty", trimmedDid);
    }

    // Type-specific identifier validation
    this.validateIdentifier(parsedType, identifier, trimmedDid);

    return {
      did: trimmedDid,
      method: "signum",
      network: parsedNetwork,
      type: parsedType,
      identifier: identifier.trim(),
    };
  }

  /**
   * Check if a string is a valid Signum DID
   *
   * @param did - The string to validate
   * @returns true if valid, false otherwise
   *
   * @example
   * ```typescript
   * const parser = new DidParser();
   * parser.isValid('did:signum:tx:12345678901234567890'); // true
   * parser.isValid('did:invalid:tx:123'); // false
   * ```
   */
  public isValid(did: string): boolean {
    try {
      this.parse(did);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build a DID URI from components
   *
   * @param type - Entity type
   * @param identifier - Entity identifier
   * @param network - Network (optional, defaults to mainnet)
   * @returns Complete DID URI
   *
   * @example
   * ```typescript
   * const parser = new DidParser();
   * parser.build('tx', '12345678901234567890');
   * // 'did:signum:tx:12345678901234567890'
   *
   * parser.build('acc', 'S-9K9L-4CB5-88Y5-F5G4Z', 'testnet');
   * // 'did:signum:testnet:acc:S-9K9L-4CB5-88Y5-F5G4Z'
   * ```
   */
  public build(
    type: SignumDidType,
    identifier: string,
    network: SignumNetwork = "mainnet",
  ): string {
    // Include network in DID only if it's not mainnet
    if (network === "mainnet") {
      return `did:signum:${type}:${identifier}`;
    }
    return `did:signum:${network}:${type}:${identifier}`;
  }

  /**
   * Validate identifier format based on entity type
   *
   * @param type - Entity type
   * @param identifier - Identifier to validate
   * @param did - Full DID (for error reporting)
   * @throws {DidParseError} If identifier format is invalid
   */
  private validateIdentifier(
    type: SignumDidType,
    identifier: string,
    did: string,
  ): void {
    const trimmed = identifier.trim();

    switch (type) {
      case "tx":
      case "contract":
      case "token":
        if (!/^\d{10,24}$/.test(trimmed)) {
          throw new DidParseError(
            `Invalid ${type} identifier. Must be 18-23 digit numeric ID`,
            did,
          );
        }
        break;

      case "acc":
        // Account can be either numeric ID or RS-address
        const isNumeric = /^\d{18,23}$/.test(trimmed);
        const isRSAddress =
          /^T?S-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(trimmed);

        if (!isNumeric && !isRSAddress) {
          throw new DidParseError(
            "Invalid account identifier. Must be numeric ID or RS-address (S-XXXX-XXXX-XXXX-XXXXX)",
            did,
          );
        }
        break;

      case "alias":
        // Alias can be numeric ID or [tld:]name format
        const isAliasNumeric = /^\d{18,23}$/.test(trimmed);
        const isAliasName = /^(\w{1,40}:)?\w{1,100}$/.test(trimmed);

        if (!isAliasNumeric && !isAliasName) {
          throw new DidParseError(
            "Invalid alias identifier. Must be numeric ID or [tld:]name format",
            did,
          );
        }
        break;

      default:
        // This should never happen due to previous type validation
        throw new DidParseError(`Unknown type: ${type}`, did);
    }
  }
}
