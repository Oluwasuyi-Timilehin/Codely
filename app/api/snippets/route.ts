import { NextRequest, NextResponse } from "next/server";
import { getSnippets, createSnippet } from "@/lib/db";
import { verifyAuthentication } from "@/lib/auth-middleware";

export async function GET() {
  try {
    const snippets = await getSnippets();
    return NextResponse.json(snippets);
  } catch (error) {
    console.error("[v0] Error fetching snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuthentication(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Please authenticate with your wallet" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { title, description, code, language, tags } = body;

    if (
      !title ||
      !description ||
      !code ||
      !language ||
      !tags ||
      tags.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, code, language, tags",
        },
        { status: 400 },
      );
    }

    // Create snippet with owner (wallet address)
    const snippet = await createSnippet(
      title,
      description,
      code,
      language,
      tags,
      auth.walletAddress, // Add wallet address as owner
    );

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 },
    );
  }
}
