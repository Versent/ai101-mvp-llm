import { openai } from '@ai-sdk/openai'
import { generateObject, generateText, LanguageModel } from 'ai'
import chalk from 'chalk'
import dedent from 'dedent'
import fs from 'fs'
import { ollama } from 'ollama-ai-provider'
import ora from 'ora'
import path from 'path'
import z from 'zod'
import { SYSTEM_MESSAGE } from '.'
import { thinkWrap } from './src/llm/llm'
import { tools } from './src/llm/tools'
import { tools as ragTools } from './src/rag/tools'

const spinner = ora()

// the model to use for verification
// the better the model, the better results
// I have found only the foundation models are worth your time
const verifierModel = process.env.OPENAI_API_KEY ? 
    openai('gpt-4.1-nano-2025-04-14') : ollama('qwen2.5-coder:0.5b')

// a list of models to test
const models: LanguageModel[] = [

    // openai is the best at following instructions, using tools, and being fast
    openai('gpt-4.1-nano-2025-04-14'),

    // QWEN is great
    thinkWrap(ollama('qwen3:0.6b')),
    thinkWrap(ollama('qwen3:1.7b')),
    thinkWrap(ollama('qwen3:8b')),
    // thinkWrap(ollama('qwen3:14b')),
    // thinkWrap(ollama('qwen3:30b')),
    thinkWrap(ollama('qwen2.5-coder:0.5b')),
    thinkWrap(ollama('qwen2.5-coder:7b')),

    // mistral fails to use tools, even though it advertises it does
    // ollama('mistral:7b-instruct'),
    // ollama('mistral:7b-instruct-q2_K'),

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
const debugLogPath = path.join(outputDir, `${Date.now()}.md`)
fs.appendFileSync(debugLogPath,
    `# Evaluation Log\n` +
    `Run at: ${new Date().toISOString()}\n` +
    `Evaluated by: ${verifierModel.provider} ${verifierModel.modelId}\n` +
    `Evaluated models: ${models.map((m) => `${m.provider} ${m.modelId}`).join(', ')}\n` +
    `# System Prompt\n` +
    `${SYSTEM_MESSAGE}\n`
)

// tests for each model to run
interface Test {
    input: string
    assess: string
    toolsUsed: string[]
}
const tests: Test[] = [
    {
        input: 'Who do you work for?',
        assess: 'This is a simple question about our company can be answered from the system prompt. The output should include Versent and some history.',
        toolsUsed: [],
    },
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

interface Result {
    model: LanguageModel
    test: Test
    result: {
        text: string
        error: any
        duration: number
        toolsUsed: string[]
    }
    review: {
        pass: boolean
        reason: string
        points: number
    }
}

const results: Result[] = []

const EVALUTION_INSTRUCTIONS = `
# Instructions
Your role is to evaluate the output of an Assistant AI

# Score

Score the Assistant Output, giving one point for each of the following:

- an output was produced (1 point)
- no errors were produced (1 point)
- the system prompt was followed (1 point)
- the output is relevant and concise (1 point)
- the execution time was under 10 seconds (1 point)

# Context to evaluate

Below is the data and context which for you to evaluate the assistant's output

`

async function run() {

    console.log(`Evaluating with ${ verifierModel.provider } ${ chalk.magenta(verifierModel.modelId) }\n`)

    // run each model
    for (const model of models) {

        // run each test
        console.log(`${model.provider} ${ chalk.bold(model.modelId) }`)
        for (const test of tests) {
            const result = await assert(model, test)
            results.push(result)
        }
        console.log()

    }

    // print the results
    console.log(chalk.gray('----------- Test Complete -----------'))
    console.log(chalk.gray(`Debug log: ${debugLogPath}\n`))
    
    // rank the models, sorted by points
    console.log(chalk.bold.blue('Ranking:'))
    const scores = results
        .reduce((acc, result) => {
            if (!acc[result.model.modelId]) {
                acc[result.model.modelId] = {
                    model: result.model.modelId,
                    score: 0,
                }
            }
            acc[result.model.modelId].score += result.review.points
            return acc
        }, {} as Record<string, { model: string, score: number }>)
    Object.values(scores)
        .sort((a, b) => b.score - a.score)
        .forEach((result) => {
            console.log( chalk.yellow(`${result.score}pts `) + result.model )
        })
}

run()

async function assert(model: LanguageModel, test: Test): Promise<Result> {

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
    const input = dedent`
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

        ## Execution Duration (milliseconds)
        ${duration}ms
    `
    const review = await generateObject({
        model: verifierModel,
        prompt:
            EVALUTION_INSTRUCTIONS +
            dedent`
                ## Assistant System Prompt
                """
                ${SYSTEM_MESSAGE}
                """

            ` +
            input,
        schema: z.object({
            pass: z.boolean().describe('pass or fail'),
            reason: z.string().describe('brief summary for your decision, or the reason it did not pass, limit to 2 reasons and 10 words. No fluff, no adjectives.'),
            points: z.number().min(0).describe('points scored'),
        }),
        temperature: 0,
    })

    // codify the tool check by comparing the tools used to the tools suggested
    // +1 point for each correct tool used, and -1 point for each incorrect tool used
    const wantCopy = test.toolsUsed.slice()
    const gotCopy = toolsUsed.slice()
    let toolScore = 0
    for (let i = 0; i < wantCopy.length; i++) {
        const tool = wantCopy[i]
        if (gotCopy.includes(tool)) {
            // tool hit, remove it from both lists
            wantCopy.splice(i, 1)
            gotCopy.splice(gotCopy.indexOf(tool), 1)
            toolScore++
        }
    }
    toolScore = toolScore - wantCopy.length - gotCopy.length

    // check the result
    spinner.stop()
    console.log(
        (" ") +
        (review.object.pass ? "✅" : "❌") +
        (chalk.yellow(` ${ review.object.points }pts`)) +
        ( toolScore == 0 ? "" : " (" + (toolScore > 0 ? chalk.green(`+${toolScore}`) : chalk.red(`${toolScore}`)) + ")") +
        (chalk.gray(` ${review.object.reason}`)) +
        ( error ? chalk.red(` ${error.message.slice(0, 50)}...`) : "" )
    )
    review.object.points += toolScore

    // write a debug entry
    fs.appendFileSync(debugLogPath,
        `\n# Evaluted Model\n` +
        `\nProvider: ${model.provider}` +
        `\nModel ID: ${model.modelId}` +
        `\n\n# Evaluation Input\n` +
        input +
        `\n\n# Evaluation Output\n` +
        `\nResult: ${review.object.pass ? "Pass ✅" : "Fail ❌"}`+
        `\nScore:  ${review.object.points} pts` +
        `\nReason: ${review.object.reason}`
    )

    // save the result
    return {
        model,
        test,
        result: {
            text,
            error,
            duration,
            toolsUsed,
        },
        review: {
            pass: review.object.pass,
            reason: review.object.reason,
            points: review.object.points,
        }
    }
    
}