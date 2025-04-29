
import { createHash } from 'crypto'
import ollama from 'ollama'
import pgvector from 'pgvector'
import { pool } from './db'

const embedding_model = 'nomic-embed-text'

export const insert_embeddings = `
INSERT INTO embeddings (reference, content, embedding, embedding_model, content_hash)
VALUES ($1, $2, $3, $4, $5)
`

export async function put (content: string, reference: string): Promise<string> {
  const hash = createHash('sha256').update(content).digest('hex')

  // get embeddings
  const result = await ollama.embeddings({ model: embedding_model, prompt: content })

  // save
  await pool.query(insert_embeddings, [
    reference,
    content,
    pgvector.toSql(result.embedding),
    embedding_model,
    hash
  ])
  return hash
}

export const get_embeddings = `
WITH documents AS (
    SELECT
        reference,
        content,
        1 - (embedding <=> $1) AS similarity
    FROM embeddings
)
SELECT
    reference,
    content,
    similarity
FROM documents
WHERE content ILIKE ANY ($2) --OR similarity > 0.5
ORDER BY similarity DESC
LIMIT 10
`

export interface RAGResponse {
  similarity: number
  reference: string
  content: string
}

export async function get (
  similar_to: string,
  keywords: string[] = []
): Promise<RAGResponse[]> {
  // get embeddings
  const result = await ollama.embeddings({ model: embedding_model, prompt: similar_to })

  // find
  const nearest = await pool.query(
    get_embeddings,
    [
      pgvector.toSql(result.embedding),
      keywords.map((keyword) => `%${keyword}%`)
    ])

  // return the references
  return nearest.rows.map((row) => ({
    similarity: row.similarity,
    reference: row.reference,
    content: row.content
  }))
}
