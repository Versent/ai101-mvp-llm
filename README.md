# AI 101 — Building an LLM-enabled app

The goal of this repo is to demonstrate how approachable it can be to include LLM's into your applications.

This is for app devs who might be familiar with NodeJS and Postgres, but unsure where to begin regarding LLM's.

Here are some parts of the app that you should know:

- My code: some NodeJS code to handle user input and output
- SDK: the interface into the generative AI models, including tool use (this demo uses Vercel)
- Provider: the thing which runs the model (this demo uses Ollama)
- Model: the web of numbers that describe how artificial neurons should pass signals to each other to ultimately generate text
- Vector Store: a database to store content and its corresponding vector (to search by similarity) (this demo uses Postgres)

It should be noted that SDK, Provider, Model, and Vector store are all interchangable, and new contenders are emerging weekly!

```mermaid
graph LR
    User <-->|UI| App
    App <--> SDK
    SDK <--> Ollama
    Ollama <--> LLM
    SDK <-->|via tool| Postgres
```

## Prerequisites

- https://docs.docker.com/compose/install/
- https://ollama.com/

## Setup

Create the docker compose stack:

```sh
make up
```

Install dependencies:

```sh
npm i
```

## Run it

```sh
npx tsx .
```

Optionally specify a model to query:

```sh
npx tsx . -m qwen3:8b-q4_K_M
```

## Example use of tools

Try some of the following prompts:

> think of a random number, then make a haiku about it and save it for later

> save what you know about the following topics: agile manifest, devops, and the bitcoin whitepaper, Attention is All You Need, LIGO, and the hubble space telescope

> what do you know about ligo?

## Model suggestion

Use any model which supports tools:
https://ollama.com/search?c=tools

Excellent tool usage from the following

```
qwen3:0.6b
qwen3:1.7b
qwen3:8b
qwen3:14b
```

_Note:_ Usage of a new model requires pulling that new model to the `ollama-pull` service in the `compose/ollama.yml` file. e.g. `ollama pull qwen3:1.7b`.

## Postgres

You can jump into postres with:

```shell
docker compose exec -it pgvector psql -d embeddings -U admin
```

And review the content and emeddings with:

```
SELECT reference FROM content;
SELECT chunk FROM embeddings;
```

## Evaluate

We can use LLM's to help us evaluate other LLM models.

```sh
npx tsx ./evaluate.ts
```

You can see the results are interesting but not without error:

```
Evaluating with openai.chat gpt-4.1-nano-2025-04-14
openai.chat gpt-4.1-nano-2025-04-14
 The capital of France is Paris. 726ms []
 ✅ 5pts Correct answer, no tools needed, followed instructions.
 The random number between a million and five billion is 1,041,765,976. 1324ms [random]
 ✅ 6pts Generated a valid random number within the specified range.
 Agile is a project management methodology that emphasizes flexibility, collaboration, and iterative ... 2176ms [search]
 ✅ 6pts The assistant provided a relevant and concise summary of Agile, following the system prompt and using the search tool.

ollama.chat qwen3:0.6b
 The capital of France is Paris. 2640ms []
 ✅ 6pts The assistant provided the correct answer without using any tools, following the instructions.
 The random number generated is 2255939. 6672ms [random, random]
 ✅ 5pts Generated a number within the specified range, followed instructions, and used the correct tool.
 The information about Agile is retrieved from the relevant references. Here's a summary:- **Agil... 4645ms [search]
 ✅ 4pts The assistant did not use any tools, which is appropriate given the context, but it did not explicitly mention or confirm the use of the search tool.

ollama.chat qwen3:1.7b
 The capital of France is Paris. 4616ms []
 ✅ 5pts The assistant provided the correct answer without using any tools, following the instructions.
 Here's a random number between 1,000,000 and 5,000,000:  **3,872,918**  Let me know if you need... 6270ms [random]
 ❌ 2pts The assistant did not use the 'random' tool as recommended.
 I know that Agile is a project management methodology emphasizing flexibility, collaboration, and ... 8375ms [search]
 ✅ 6pts The assistant provided a relevant, concise summary of Agile, following the system prompt.
```

For example, in the second last test, the assistent did in fact use the random tool!
