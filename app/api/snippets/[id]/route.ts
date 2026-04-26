import { NextRequest, NextResponse } from "next/server";
import {
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  createSnippetVersion,
  getVersionHistory,
  getVersionById,
  restoreVersion,
} from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle version history request
    if (action === "versions") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

      const history = await getVersionHistory(id, page, pageSize);
      return NextResponse.json(history);
    }

    // Handle single version request
    if (action === "version") {
      const versionId = url.searchParams.get("versionId");
      if (!versionId) {
        return NextResponse.json(
          { error: "versionId is required" },
          { status: 400 },
        );
      }
      const version = await getVersionById(versionId);
      if (!version) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(version);
    }

    // Default: get snippet by ID
    const snippet = await getSnippetById(id);

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("[v0] Error fetching snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle version restore request
    if (action === "restore") {
      const body = await req.json();
      const { versionId, editorId } = body;

      if (!versionId) {
        return NextResponse.json(
          { error: "versionId is required for restore action" },
          { status: 400 },
        );
      }

      const restored = await restoreVersion(versionId, editorId || null);
      return NextResponse.json(restored);
    }

    // Default: update snippet
    const body = await req.json();
    const { title, description, code, language, tags, editorId } = body;

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

    // Get current snippet to create version before updating
    const currentSnippet = await getSnippetById(id);
    if (!currentSnippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    // Create a version entry before updating
    await createSnippetVersion(
      id,
      {
        title: currentSnippet.title,
        description: currentSnippet.description,
        code: currentSnippet.code,
        language: currentSnippet.language,
        tags: Array.isArray(currentSnippet.tags) ? currentSnippet.tags : [],
      },
      editorId || null,
    );

    // Update the snippet
    const snippet = await updateSnippet(
      id,
      title,
      description,
      code,
      language,
      tags,
    );

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("[v0] Error updating snippet:", error);
    return NextResponse.json(
      { error: "Failed to update snippet" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteSnippet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting snippet:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 },
    );
  }
}
