import { createHash } from 'crypto'
import ollama from 'ollama'
import pgvector from 'pgvector'
import { pool } from './db'
import * as sql from './sql'

const embedding_model = 'nomic-embed-text'

export async function put (content: string, reference: string): Promise<void> {
  const hash = createHash('sha256').update(content).digest('hex')

  // Insert into content table
  const contentResult = await pool.query(sql.INSERT_CONTENT, [reference, content, hash])
  const contentId = contentResult.rows[0]?.id
  if (!contentId) {
    return
  }

  // Chunk the content into smaller pieces
  const chunks = chunkBySentances(content)

  // Save embeddings for each chunk
  for (const chunk of chunks) {
    const result = await ollama.embeddings({ model: embedding_model, prompt: chunk })
    await pool.query(sql.INSERT_EMBEDDINGS, [
      contentId,
      chunk,
      pgvector.toSql(result.embedding),
      embedding_model
    ])
  }
}

export interface RAGResponse {
  similarity: number
  reference: string
  content: string
  relevant: string
}

export async function get (
  similar_to: string,
  keywords: string[] = []
): Promise<RAGResponse[]> {
  // get embeddings
  const result = await ollama.embeddings({ model: embedding_model, prompt: similar_to })

  // find
  const nearest = await pool.query(
    sql.GET_EMBEDDINGS,
    [
      pgvector.toSql(result.embedding),
      keywords.map((keyword) => `%${keyword}%`)
    ])

  // return the references
  return nearest.rows.map((row) => ({
    similarity: row.similarity,
    reference: row.reference,
    content: row.content,
    relevant: row.similarity > 0.5 ? 'relevant' : 'not relevant'
  }))
}

// split by punctuation
const sentenceSplitRegex = /[.?!]+/g
export function chunkBySentances (text: string): string[] {
  return text

    // split
    .split(sentenceSplitRegex)

    // trim whitespace
    .map(sentence => sentence.trim())

    // remove short sentences
    .filter(sentence => sentence.length >= 3)
}
