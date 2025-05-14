# AI 101 - For Developers

Talking points

## What is an LLM?

Practical definition:

- good at working with language
- input: blob of text
- output: blob/stream of text

## What does the input look like?

The input is just a blob of text, but it can be structured in various ways to help the model understand the context and intent. Some common structures include:

- system prompt
- user prompt
- conversation history
- tools
- examples
- context
- instructions
- constraints
- metadata
- etc.

## What does the output look like?

Text!

## How can I invoke an LLM?

API (locally via Ollama, OpenAI, Anthropic, etc.)

## DEMO!

See README.md

## What models can I use?

Pick a provider, and review their documentation. Some examples include:

- https://ollama.com/library
- https://platform.openai.com/docs/models

## What even is a tool?

A protocol or scheme for imbuing a model with ways to interact with the outside world.

## What is RAG?

Retrieval Augmented Generation: A way to add knowledge to a model, outside of its training data.

This can be done via a tool, or a workflow.

## What is semantic search?

The ability to search for information based on meaning, rather than keywords.

eg. "AWS" might be synonymous with "Amazon Web Services" or "cloud computing".

## What is embedding? What is a vector?

Encoding a *concept* into a numerical representation
