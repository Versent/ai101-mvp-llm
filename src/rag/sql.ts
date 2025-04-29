export const INSERT_CONTENT = `
INSERT INTO content (reference, content, content_hash)
VALUES ($1, $2, $3)
ON CONFLICT (reference) DO NOTHING
RETURNING id
`;

export const INSERT_EMBEDDINGS = `
INSERT INTO embeddings (content_id, chunk, embedding, embedding_model)
VALUES ($1, $2, $3, $4)
`;

export const GET_EMBEDDINGS = `
WITH documents AS (
    SELECT
        c.reference,
        e.chunk AS content,
        1 - (e.embedding <=> $1) AS similarity
    FROM embeddings e
    JOIN content c ON e.content_id = c.id
)
SELECT
    reference,
    content,
    similarity
FROM documents
WHERE content ILIKE ANY ($2) OR similarity > 0.3
ORDER BY similarity DESC
LIMIT 10
`

