import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Ensure crypto is available
import crypto from "crypto";

export async function getSnippets() {
  try {
    const result = await sql`SELECT * FROM snippets ORDER BY created_at DESC`;
    return result as any[];
  } catch (error) {
    console.error("Error fetching snippets:", error);
    throw error;
  }
}

export async function getSnippetById(id: string) {
  try {
    const result = await sql`SELECT * FROM snippets WHERE id = ${id}`;
    return result[0] as any;
  } catch (error) {
    console.error("Error fetching snippet:", error);
    throw error;
  }
}

export async function createSnippet(
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[],
  owner?: string,
) {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    console.log("[v0] Creating snippet:", {
      id,
      title,
      language,
      tagsLength: tags.length,
      owner,
    });
    const result = await sql`
      INSERT INTO snippets (id, title, description, code, language, tags, owner, created_at, updated_at) 
      VALUES (${id}, ${title}, ${description}, ${code}, ${language}, ${tags}, ${owner || null}, ${createdAt}, ${createdAt}) 
      RETURNING *
    `;
    console.log("[v0] Snippet created successfully:", result[0]);
    return result[0] as any;
  } catch (error) {
    console.error("[v0] Error creating snippet:", error);
    throw error;
  }
}

export async function updateSnippet(
  id: string,
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[],
) {
  try {
    const updatedAt = new Date();
    console.log("[v0] Updating snippet:", { id, title, language });
    const result = await sql`
      UPDATE snippets 
      SET title = ${title}, description = ${description}, code = ${code}, language = ${language}, tags = ${tags}, updated_at = ${updatedAt} 
      WHERE id = ${id} 
      RETURNING *
    `;
    console.log("[v0] Snippet updated successfully:", result[0]);
    return result[0] as any;
  } catch (error) {
    console.error("[v0] Error updating snippet:", error);
    throw error;
  }
}

export async function deleteSnippet(id: string) {
  try {
    await sql`DELETE FROM snippets WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("Error deleting snippet:", error);
    throw error;
  }
}
