import { generateObject, generateText, LanguageModel } from 'ai'
import chalk from 'chalk'
import { ollama } from 'ollama-ai-provider'
import ora from 'ora'
import z from 'zod'
import { tools } from './src/llm/tools'
import { tools as ragTools } from './src/rag/tools'
import { openai } from '@ai-sdk/openai'
import { thinkWrap } from './src/llm/llm'
import fs from 'fs'
import path from 'path'

const spinner = ora()

// the model to use for verification
// the better the model, the better results
// I have found only the foundation models are worth your time
const verifierModel = process.env.OPENAI_API_KEY ? 
    openai('gpt-4.1-nano-2025-04-14') : ollama('qwen2.5-coder:0.5b')

// a list of models to test
const models: LanguageModel[] = [
    openai('gpt-4.1-nano-2025-04-14'),
    // ollama('mistral:7b-instruct'),
    // ollama('mistral:7b-instruct-q2_K'),
    thinkWrap(ollama('qwen3:0.6b')),
    thinkWrap(ollama('qwen3:1.7b')),
    thinkWrap(ollama('qwen3:8b')),
    thinkWrap(ollama('qwen3:14b')),
    thinkWrap(ollama('qwen3:30b')),
    thinkWrap(ollama('qwen2.5-coder:0.5b')),
    thinkWrap(ollama('qwen2.5-coder:7b')),

    // phi4 doesn't work for me
    // ollama('phi4:14b'),
    // ollama('phi4:14b-q4_K_M'),

    // llama is no good at tools!
    // ollama('llama3.2:1b'),
    // ollama('llama3.2:1b-instruct-q2_K'),
    // ollama('llama3.2:3b'),
    // ollama('llama3.2:3b-instruct-q2_K'),
]

// debug log
const outputDir = path.resolve(__dirname, 'results')
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
}
const debugLogPath = path.join(outputDir, `${Date.now()}.log`)

// tests for each model to run
interface Test {
    input: string
    assess: string
    toolsUsed: string[]
}
const tests: Test[] = [
    {
        input: 'What is the capital of France?',
        assess: 'This trivial fact does not need tools, the output should include The capital of France is Paris.',
        toolsUsed: [],
    },
    {
        input: 'give a random number between a million and five billion',
        assess: 'the assistant uses the random tool to return a random number between 1,000,000 and 5,000,000,000',
        toolsUsed: ['random'],
    },
    // TODO: automatic database setup — currently you have to put some data in there
    {
        input: 'what do you know about agile?',
        assess: 'search tool yeilds a result about the agile manifesto',
        toolsUsed: ['search'],
    },
]

const SYSTEM_MESSAGE = `
You are a helpful assistant.
Use tools often to help the user.
`

const EVALUTION_INSTRUCTIONS = `
# Instructions
Your role is to evaluate the output of an Assistant AI

You should check two things:
1. The assistant did what the user asks, and follows the system prompt.
2. The right tools were used, and no extra tools were used.

# Score

Score the Assistant Output, giving one point for each of the following:

- an output was produced (1 point)
- no errors were produced (1 point)
- the right tool was used (1 point)
- no extra tools were used (1 point)
- the system prompt was followed (1 point)
- the output is relevant and concise (1 point)
- the execution time was under 10 seconds (1 point)

# Context to evaluate

Below is the data and context which for you to evaluate the assistant's output

`

async function run() {

    console.log(`Evaluating with ${ verifierModel.provider } ${ chalk.magenta(verifierModel.modelId) }`)

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
            (chalk.gray(` [${toolsUsed.join(', ')}]`))
        ))

        text = result.text

    } catch (e: any) {
        error = e
    }
    
    // check the result
    spinner.start(`Evaluating ...`)
    const prompt = `
        ## System Prompt
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
        ${text || 'no output'}
        """

        ## Assistant Error
        """
        ${error?.message || 'no errors'}
        """
        
        ## Tools Suggested (curated by our human test team)
        [${test.toolsUsed.join(', ')}]

        ## Tools Used
        [${toolsUsed.join(', ')}]

        ## Execution Duration (milliseconds)
        ${duration}ms
    `
    const review = await generateObject({
        model: verifierModel,
        prompt: EVALUTION_INSTRUCTIONS + prompt,
        schema: z.object({
            pass: z.boolean().describe('pass or fail'),
            reason: z.string().describe('brief summary for your decision, or the reason it did not pass, limit to 2 reasons and 10 words. No fluff, no adjectives.'),
            points: z.number().min(0).describe('points scored'),
        }),
        temperature: 0,
    })

    // check the result
    spinner.stop()
    console.log(
        (" ") +
        (review.object.pass ? "✅" : "❌") +
        (chalk.yellow(` ${ review.object.points }pts`)) +
        (chalk.gray(` ${review.object.reason}`)) +
        ( error ? chalk.red(` ${error.message.slice(0, 50)}...`) : "" )
    )

    // write a debug entry
    fs.appendFileSync(debugLogPath, JSON.stringify({ prompt, review: review.object }, null, 2) + '\n', 'utf-8')
    
}