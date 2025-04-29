CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  embedding VECTOR(768), -- Adjust the dimension as needed
  embedding_model TEXT,
  content TEXT,
  content_hash TEXT,
  reference TEXT
);

-- https://github.com/pgvector/pgvector-node#:~:text=%5D)%3B-,Add%20an%20approximate%20index,-await%20client.
CREATE INDEX ON embeddings USING hnsw (embedding vector_l2_ops)
