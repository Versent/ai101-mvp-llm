CREATE EXTENSION IF NOT EXISTS vector;

-- Create the content table
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

-- Create the embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  content_id INT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  embedding VECTOR(768), -- Adjust the dimension as needed
  embedding_model TEXT NOT NULL,
  chunk TEXT NOT NULL
);

-- Add an approximate index for embeddings
CREATE INDEX ON embeddings USING hnsw (embedding vector_l2_ops);
