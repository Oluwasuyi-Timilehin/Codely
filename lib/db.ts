import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL!);

export async function getSnippets() {
  try {
    const result = await sql`SELECT * FROM snippets ORDER BY created_at DESC`;
    return result as any[];
  } catch (error) {
    console.error('Error fetching snippets:', error);
    throw error;
  }
}

export async function getSnippetById(id: string) {
  try {
    const result = await sql`SELECT * FROM snippets WHERE id = ${id}`;
    return result[0] as any;
  } catch (error) {
    console.error('Error fetching snippet:', error);
    throw error;
  }
}

export async function createSnippet(
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[]
) {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    const result = await sql`
      INSERT INTO snippets (id, title, description, code, language, tags, created_at, updated_at) 
      VALUES (${id}, ${title}, ${description}, ${code}, ${language}, ${tags}, ${createdAt}, ${createdAt}) 
      RETURNING *
    `;

    return result[0] as any;
  } catch (error) {
    console.error('[v0] Error creating snippet:', error);
    throw error;
  }
}

export async function updateSnippet(
  id: string,
  title: string,
  description: string,
  code: string,
  language: string,
  tags: string[]
) {
  try {
    const updatedAt = new Date();

    const result = await sql`
      UPDATE snippets 
      SET title = ${title}, description = ${description}, code = ${code}, language = ${language}, tags = ${tags}, updated_at = ${updatedAt} 
      WHERE id = ${id} 
      RETURNING *
    `;

    return result[0] as any;
  } catch (error) {
    console.error('[v0] Error updating snippet:', error);
    throw error;
  }
}

export async function updateSnippetNft(
  id: string,
  nftTransactionHash: string,
  nftMetadata: Record<string, unknown>
) {
  try {
    const updatedAt = new Date();

    const result = await sql`
      UPDATE snippets
      SET nft_transaction_hash = ${nftTransactionHash},
          nft_metadata = ${JSON.stringify(nftMetadata)},
          updated_at = ${updatedAt}
      WHERE id = ${id}
      RETURNING *
    `;

    return result[0] as any;
  } catch (error) {
    console.error('[v0] Error updating snippet NFT:', error);
    throw error;
  }
}

export async function deleteSnippet(id: string) {
  try {
    await sql`DELETE FROM snippets WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Error deleting snippet:', error);
    throw error;
  }
}