# AI 101 — MVP LLM App with RAG

The goal of this repo is to demonstrate how approachable it can be to include LLM's into your applications.

This is for app devs who might be familiar with NodeJS and Postgres, but unsure where to begin regarding LLM's.

## Prerequisites

https://docs.docker.com/compose/install/
https://ollama.com/

## setup

Start Postgres with pgvector:

```sh
docker compose up -d
```

Install dependancies

```sh
npm i
```

## Run it

```sh
npx tsx . -m qwen3:8b-q4_K_M 
```

## Example use of tools

Try some of the following prompts:

> think of a random number, then make a haiku about it and save it for later

> save what you know about the following topics: agile manifest, devops, and the bitcoin whitepaper, Attention is All You Need, LIGO, and the hubble space telescope
> what do you know about ligo?

## Model suggestion

Excellent tool usage from the following

qwen3:0.6b
qwen3:1.7b
qwen3:14b-q4_K_M
