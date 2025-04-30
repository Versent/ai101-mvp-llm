import { generateObject, generateText, LanguageModel } from 'ai'
import chalk from 'chalk'
import { ollama } from 'ollama-ai-provider'
import ora from 'ora'
import z from 'zod'
import { tools } from './src/llm/tools'
import { tools as ragTools } from './src/rag/tools'
import { openai } from '@ai-sdk/openai'
import { thinkWrap } from './src/llm/llm'

const spinner = ora()

// const verifierModel = openai('gpt-4.1-nano-2025-04-14')
const verifierModel = ollama('gemma3:12b')

// a list of models to test
const models: LanguageModel[] = [
    openai('gpt-4.1-nano-2025-04-14'),
    thinkWrap(ollama('qwen3:0.6b')),
    thinkWrap(ollama('qwen3:1.7b')),
    thinkWrap(ollama('qwen3:8b')),
    thinkWrap(ollama('qwen3:14b')),
    ollama('llama3.2:1b'),
    ollama('llama3.2:1b-instruct-q2_K'),
    ollama('llama3.2:3b'),
    ollama('llama3.2:3b-instruct-q2_K'),
]

// tests for each model to run
interface Test {
    input: string
    output: string
    toolsUsed: string[]
}
const tests: Test[] = [
    {
        input: 'What is the capital of France?',
        output: 'The capital of France is Paris.',
        toolsUsed: [],
    },
    {
        input: 'give a random number between a million and five billion',
        output: 'the assistant uses the random tool to return a random number between 1,000,000 and 5,000,000,000',
        toolsUsed: ['random'],
    },
    // TODO: automatic database setup — currently you have to put some data in there
    {
        input: 'what do you know about agile?',
        output: 'search tool yeilds a result about the agile manifesto',
        toolsUsed: ['search'],
    },
]

const SYSTEM_MESSAGE = `
    You are a helpful assistant.
    Use tools often to help the user.
`

async function run() {

    // run each model
    for (const model of models) {

        // run each test
        console.log(`${model.provider} ${ chalk.bold(model.modelId) }`)
        for (const test of tests) {
            await assert(model, test)
        }
        console.log()

    }

}

run()

async function assert(model: LanguageModel, test: Test) {

    // run the test
    let text: string = ''
    let error: any = undefined
    let duration = 0
    const toolsUsed: string[] = []
    try {
        spinner.start(`Testing ...`)
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
    
        // print the result
        spinner.stop()
        console.log(chalk.gray(
            (" ") +
            (result.text.length > 100 ? result.text.slice(0, 100) + '...' : result.text).replaceAll('\n', '') +
            (chalk.cyan(` ${ Math.round( duration ) }ms`)) +
            (chalk.gray(` ${toolsUsed.join(', ')}`))
        ))

        text = result.text

    } catch (e: any) {
        error = e
    }
    
    // check the result
    spinner.start(`Verifying ...`)
    const review = await generateObject({
        model: verifierModel,
        prompt: `
            Your role is to verify that the results of an LLM are correct.

            You should check two things:
            1. The assistant did what the user asks, and follows the system prompt.
            2. The right tools were used, and no extra tools were used.
            
            Additionally, rate the quality of the output from 1 to 5 (like a star rating), one point for each of the following:
            - an output was produced
            - the right tool was used
            - the system prompt was followed
            - the output is relevant and concise
            - the response was within the expected time (under 20 seconds)

            Example results:
            {
                pass: true,
                reason: 'followed instruction, used the right tool',
                quality: 5
            }
            {
                pass: false,
                reason: 'assistant resulted in error',
                quality: 0
            }
            {
                pass: true,
                reason: 'right tool used, but too many times, and otherwise followed instruction',
                quality: 3
            }
            {
                pass: true,
                reason: 'wrong tool used, but otherwise followed instruction',
                quality: 3
            }
            {
                pass: true,
                reason: 'right tool, good answer, but took too long',
                quality: 4
            }
            
            System Prompt:
            ${SYSTEM_MESSAGE}

            User Input:
            ${test.input}

            Assistant Output:
            ${text || 'no output'}

            Assistant Error:
            ${error?.message || 'no errors'}

            Desired Output:
            ${test.output}

            Tools used:
            ${toolsUsed.join(', ')}
            
            Tools wanted:
            ${test.toolsUsed.join(', ')}

            Duration:
            ${duration}ms
        `,
        schema: z.object({
            pass: z.boolean().describe('pass or fail'),
            reason: z.string().describe('very brief summary for your decision, no more than 10 words'),
            quality: z.number().min(0).max(5).describe('a rating of 1 to 5 representing the quality of the output'),
        })
    })

    // check the result
    spinner.stop()
    console.log(
        (" ") +
        (review.object.pass ? "✅" : "❌") +
        (chalk.yellow(` ${ Math.round( review.object.quality ) }/5`)) +
        (chalk.gray(` ${review.object.reason}`))
    )
    
}