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
        1 - (e.embedding <=> $1) AS similarity,
        e.chunk ILIKE ANY ($2) AS keyword_match
    FROM embeddings e
    JOIN content c ON e.content_id = c.id
)
SELECT
    reference,
    content,
    similarity,
    keyword_match
FROM documents
WHERE keyword_match OR similarity > 0.4
ORDER BY similarity DESC
LIMIT 10
`

