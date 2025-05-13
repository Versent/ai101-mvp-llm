import { openai } from "@ai-sdk/openai";
import { LanguageModel } from "ai";
import { ollama } from "ollama-ai-provider";
import { thinkWrap } from '../src/llm/llm';

// a list of models to test
export const MODELS_TO_EVALUATE: LanguageModel[] = [

  // openai is the best at following instructions, using tools, and being fast
  openai('gpt-4.1-nano-2025-04-14'),
  openai('gpt-4.1-mini-2025-04-14'),

  // QWEN is great
  thinkWrap(ollama('qwen3:0.6b')),
  thinkWrap(ollama('qwen3:1.7b')),
  thinkWrap(ollama('qwen3:8b')),
  thinkWrap(ollama('qwen3:14b')),
  thinkWrap(ollama('qwen3:30b')),
  thinkWrap(ollama('qwen2.5-coder:0.5b')),
  thinkWrap(ollama('qwen2.5-coder:7b')),

  // mistral fails to use tools, even though it advertises it does
  ollama('mistral:7b-instruct'),
  ollama('mistral:7b-instruct-q2_K'),

  // phi4 doesn't work for me
  ollama('phi4:14b'),
  ollama('phi4:14b-q4_K_M'),

  // llama is no good at tools!
  ollama('llama3.2:1b'),
  ollama('llama3.2:1b-instruct-q2_K'),
  ollama('llama3.2:3b'),
  ollama('llama3.2:3b-instruct-q2_K'),
]
