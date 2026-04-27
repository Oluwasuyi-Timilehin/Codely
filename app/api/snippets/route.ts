import { NextRequest, NextResponse } from "next/server";
import { SnippetService } from "./snippet.service";
import { SnippetRepository } from "./snippet.repository";
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
    const body = await req.json();
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
