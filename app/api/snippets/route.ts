import { NextRequest, NextResponse } from "next/server";
import { SnippetService } from "./snippet.service";
import { SnippetRepository } from "./snippet.repository";
import { OwnershipMiddleware } from "./ownership.middleware";
import { ZodError } from "zod";

// Dependency Injection instantiation
const repository = new SnippetRepository();
const service = new SnippetService(repository);

export async function GET() {
  try {
    const snippets = await service.getAllSnippets();
    return NextResponse.json(snippets);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const limit = rateLimit(`snippet-create:${ip}`, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
    });

    if (!limit.allowed) {
      console.warn('[security] Snippet creation rate limit exceeded:', { ip });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: RATE_LIMIT_MAX_REQUESTS,
          window: `${RATE_LIMIT_WINDOW_MS / 1000}s`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Extract and inject the wallet address securely from headers
    const walletAddress = OwnershipMiddleware.extractWalletAddress(req);
    if (walletAddress) {
      body.ownerWalletAddress = walletAddress;
    }

    const snippet = await service.createSnippet(body);

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}