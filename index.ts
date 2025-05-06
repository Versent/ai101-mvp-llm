import { CoreMessage, generateText } from 'ai'
import chalk from 'chalk'
import { program } from 'commander'
import { createInterface } from 'node:readline/promises'
import ora from 'ora'
import { getModel } from './src/llm/llm'
import { tools } from './src/llm/tools'
import { tools as ragTools } from './src/rag/tools'

// spinner for visual interest while waiting for the model
const spinner = ora({
    isSilent: true, // TODO: out of nowhere this stopped working, so i disabled it here as it crashes the program
})

// create a readline interface for collecting user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
})

// System Message defines the role of the assistant, instructions, tone, and any other information
export const SYSTEM_MESSAGE = `
You are a helpful assistant who provides information to staff about our company and the work we have done in the past.

If you don't know the answer to a question, use the tools at your disposal to find the answer.

If the user wants to tell you something worth keeping to help you learn, use the "save" tool (don't ask, just do).

# Company Context
Versent is an Australian-born technology consultancy specializing in digital transformation, cloud-native solutions, and managed services. Founded in 2014, it has offices across Australia, Singapore, and the United States. Versent offers cloud strategy and migration, data modernization, security and identity management, and digital experience design services. It has deep expertise in AWS and partnerships with Microsoft Azure and Databricks. In October 2023, Versent was acquired by Telstra. As of 2025, Versent employs over 600 professionals and has delivered more than 1,300 projects.

# Your Personality
- Friendly but professional, like a helpful colleague
- Curious and enthusiastic, but never overbearing
- Concise and respectful of people's time

# Tools Usage
Unless you are absolutely sure of the answer, you should always use tools to gather more information.
`

// message history keeps track of the conversation
const messages: CoreMessage[] = [
    {
        role: 'system',
        content: SYSTEM_MESSAGE,
    },
]

// define the CLI command
program
    .version('0.0.0')
    .description('LLM CLI')
    .option('-b, --provider <provider>', 'Which provider to use')
    .option('-m, --model <model>', 'Which model to use')
    .action(async (options) => {

        // instantiate the model
        const model = getModel(options.provider, options.model)
        console.log(`You are chatting with ${chalk.bold.yellow(model.provider)} ${chalk.bold.green(model.modelId)}\n`)

        // loop until the user types "exit"
        while (true) {
            // get the input
            const input = await rl.question(chalk.yellow.bold`You:` + chalk.grey` (type "exit" to quit)\n`)
            if (input === 'exit') break
            console.log()
            console.log(chalk.cyan.bold`AI:`)

            // add the input to the messages
            messages.push({ role: 'user', content: input })

            // ask the model
            spinner.start('thinking ...')
            const start = Date.now()
            const result = await generateText({
                model,
                messages,
                tools: { ...tools, ...ragTools },
                maxSteps: 10,
                onStepFinish: (step) => {
                    spinner.stop()
                    if (step.reasoning) {
                        console.log(chalk.gray(step.reasoning.replace(/<\/?think>/g, '')?.trim()))
                    }
                    step.toolResults.forEach((r) => {
                        console.log(chalk.gray(` > ${r.toolName} (${JSON.stringify(r.args)}) = ${JSON.stringify(r.result)}`))
                    })
                    spinner.start()
                }
            })
            spinner.stop()

            // add the result to the messages
            messages.push({ role: 'assistant', content: result.text })

            // print the result
            console.log(result.text.trim())
            console.log(chalk.gray(`(took ${Date.now() - start}ms)`))
            console.log()
        }
    })

program.parse(process.argv)
