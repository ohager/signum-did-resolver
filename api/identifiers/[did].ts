/**
 * Vercel Serverless Function for DID Resolution
 * Implements W3C DID Resolution HTTP(S) Binding
 * @see https://w3c-ccg.github.io/did-resolution/#bindings-https
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignumDidResolver } from "../../src/resolver";
import { DidParser } from "../../src/parser";
import type { DIDResolutionError, SignumNetwork } from "../../src/types/did";
import { Ledger, LedgerClientFactory } from "@signumjs/core";

/**
 * Get node URL from environment variables or fallback to defaults
 */
function getNodeUrl(network: SignumNetwork): string {
  if (network === "mainnet") {
    return process.env.SIGNUM_MAINNET_NODE || "https://europe.signum.network";
  } else {
    return (
      process.env.SIGNUM_TESTNET_NODE ||
      "https://europe3.testnet.signum.network"
    );
  }
}

/**
 * Create Ledger client for a specific network
 */
export function createLedgerClient(network: SignumNetwork): Ledger {
  const nodeHost = getNodeUrl(network);

  return LedgerClientFactory.createClient({
    nodeHost,
  });
}

/**
 * Map DID resolution errors to HTTP status codes
 */
function getHttpStatus(error?: DIDResolutionError): number {
  if (!error) return 200;

  switch (error) {
    case "invalidDid":
      return 400;
    case "notFound":
      return 404;
    case "methodNotSupported":
      return 501;
    case "representationNotSupported":
      return 406;
    case "invalidDidDocument":
    case "internalError":
    default:
      return 500;
  }
}

/**
 * Determine content type based on Accept header
 * Browsers get application/json for nice rendering
 * API clients get application/did+ld+json per W3C spec
 */
function getContentType(acceptHeader?: string): string {
  if (!acceptHeader) {
    return "application/did+ld+json";
  }

  // Browser requests (Accept: text/html or */*)
  if (
    acceptHeader.includes("text/html") ||
    acceptHeader === "*/*" ||
    acceptHeader.startsWith("*/")
  ) {
    return "application/json";
  }

  // Explicit DID content types
  if (acceptHeader.includes("application/did+ld+json")) {
    return "application/did+ld+json";
  }

  if (acceptHeader.includes("application/did+json")) {
    return "application/did+json";
  }

  // Generic JSON
  if (acceptHeader.includes("application/json")) {
    return "application/json";
  }

  // Default to W3C spec format
  return "application/did+ld+json";
}

/**
 * Main handler for DID resolution
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    // Only support GET and OPTIONS
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed",
        message: "Only GET requests are supported",
      });
    }

    // Extract DID from URL path
    // URL format: /api/identifiers/{did}
    const didParam = req.query.did as string;

    if (!didParam) {
      return res.status(400).json({
        didResolutionMetadata: {
          error: "invalidDid",
          message: "DID parameter is required",
        },
        didDocument: null,
        didDocumentMetadata: {},
      });
    }

    // Decode DID (URL encoded colons)
    const did = decodeURIComponent(didParam);

    console.log(`[DID Resolution] Resolving: ${did}`);

    // Parse DID to determine network
    const parser = new DidParser();
    let network: "mainnet" | "testnet";

    try {
      const parsed = parser.parse(did);
      network = parsed.network;
    } catch (error) {
      console.error(`[DID Resolution] Invalid DID format: ${did}`, error);
      return res.status(400).json({
        didResolutionMetadata: {
          error: "invalidDid",
          message:
            error instanceof Error ? error.message : "Invalid DID format",
        },
        didDocument: null,
        didDocumentMetadata: {},
      });
    }

    // Create Ledger client for the appropriate network
    const ledger = createLedgerClient(network);

    // Create resolver and resolve DID
    const resolver = new SignumDidResolver(ledger);
    const result = await resolver.resolve(did);

    // Determine response content type
    const acceptHeader = req.headers.accept;
    const contentType = getContentType(acceptHeader);

    // Get HTTP status from resolution result
    const status = getHttpStatus(result.didResolutionMetadata.error);

    // Log resolution result
    const duration = Date.now() - startTime;
    console.log(
      `[DID Resolution] ${did} - Status: ${status} - Duration: ${duration}ms - Network: ${network}`,
    );

    // Set caching headers for successful resolutions
    if (status === 200) {
      // Transaction DIDs are immutable - cache aggressively
      if (result.didDocumentMetadata.immutable) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=31536000, immutable", // 1 year
        );
        res.setHeader("CDN-Cache-Control", "public, max-age=31536000");
      } else {
        // Account DIDs can change - cache for shorter period
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=60"); // 5 min browser, 1 min CDN
        res.setHeader("CDN-Cache-Control", "public, max-age=60");
      }
    } else {
      // Don't cache errors
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    // Set content type and return result
    res.setHeader("Content-Type", contentType);
    return res.status(status).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[DID Resolution] Internal error - Duration: ${duration}ms`,
      error,
    );

    return res.status(500).json({
      didResolutionMetadata: {
        error: "internalError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      didDocument: null,
      didDocumentMetadata: {},
    });
  }
}
