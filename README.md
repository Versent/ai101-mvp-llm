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


> think of a random number, then make a haiku about it and save it for later

> make a haiku about programming, then take a random word from that haiku, save that word as the 'best word'

> save the most important parts of the agile manifest, please

## Model suggestion

Excellent tool usage from the following

qwen3:0.6b
qwen3:1.7b
