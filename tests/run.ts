import { generateText, LanguageModel } from 'ai';
import { SYSTEM_MESSAGE } from '../src/cli/SYSTEM_MESSAGE';
import { tools } from '../src/llm/tools';
import { tools as ragTools } from '../src/rag/tools';
import { Test } from './benchmark.test';

export interface Result {
  text: string
  error: any
  duration: number
  toolsUsed: string[]
}

export async function run(model: LanguageModel, test: Test): Promise<Result> {

  // run the test
  let text: string = ''
  let error: any = undefined
  let duration = 0
  const toolsUsed: string[] = []
  try {

    const start = Date.now()
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        { role: 'user', content: test.input },
      ],
      tools: { ...tools, ...ragTools },
      maxSteps: 10,
      onStepFinish: (step) => {
        step.toolResults.forEach((r) => {
          toolsUsed.push(r.toolName)
        })
      }
    })
    duration = Date.now() - start

    text = result.text.trim()

  } catch (e: any) {
    error = e
  }

  return {
    text,
    error,
    duration,
    toolsUsed,
  }

}
