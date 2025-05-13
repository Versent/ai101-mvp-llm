import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import dedent from 'dedent';
import { ollama } from 'ollama-ai-provider';
import z from 'zod';
import { SYSTEM_MESSAGE } from '../../src/cli/SYSTEM_MESSAGE';
import { Result } from '../run';
import { Test } from '../tests';

// the model to use for verification
// the better the model, the better results
// I have found only the foundation models are worth your time
export const verifierModel = process.env.OPENAI_API_KEY ?
  openai('gpt-4.1-nano-2025-04-14') : ollama('qwen2.5-coder:0.5b')

export interface Review {
  reason: string
  points: number
}

export async function evaluate(test: Test, result: Result): Promise<Review> {

  const review = await generateObject({
    model: verifierModel,
    prompt: `
      Your role is to evaluate the output of an Assistant AI
      
      Score the Assistant Output, giving one point for each of the following:
      
      - an output was produced (1 point)
      - no errors were produced (1 point)
      - the system prompt was followed (1 point)
      - the output is relevant and concise (1 point)

      Then give a brief summary why you did not give full points.
      
      Below is the data and context which for you to evaluate the assistant's output
      
      ## Assistant System Prompt
      """
      ${SYSTEM_MESSAGE}
      """
      
      ## User Input
      """
      ${test.input}
      """

      ## Recommendations to Assess (curated by our human test team)
      """
      ${test.assess}
      """

      ## Actual Assistant Output
      """
      ${result.text || '(empty)'}
      """

      ## Assistant Error
      """
      ${result.error?.message || '(none)'}
      """
    `,
    schema: z.object({
      reason: z.string().describe(dedent`
        brief summary for your decision, limit to 10 words.
        No fluff, no adjectives.
      `),
      points: z.number().min(0).describe('points scored'),
    }),
    temperature: 0,
  })

  return review.object as Review

}
