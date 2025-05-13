import { CoreMessage, generateText } from 'ai'
import chalk from 'chalk'
import { program } from 'commander'
import { createInterface } from 'node:readline/promises'
import ora from 'ora'
import { getModel } from '../llm/llm'
import { tools } from '../llm/tools'
import { tools as ragTools } from '../rag/tools'
import { SYSTEM_MESSAGE } from './SYSTEM_MESSAGE'

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
