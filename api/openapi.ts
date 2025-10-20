/**
 * OpenAPI Documentation Endpoint
 * Serves the OpenAPI 3.1 specification for the Signum DID Resolver API
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Serve OpenAPI specification
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only support GET
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET requests are supported",
    });
  }

  try {
    // Read OpenAPI spec from file
    const openapiPath = join(process.cwd(), "openapi.yaml");
    const openapiSpec = readFileSync(openapiPath, "utf-8");

    // Set appropriate content type for YAML
    res.setHeader("Content-Type", "application/x-yaml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    return res.status(200).send(openapiSpec);
  } catch (error) {
    console.error("Error serving OpenAPI spec:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to load OpenAPI specification",
    });
  }
}
