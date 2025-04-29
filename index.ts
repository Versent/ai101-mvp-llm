import { CoreMessage, generateText } from 'ai'
import chalk from 'chalk'
import { program } from 'commander'
import ora from 'ora'
import { getModel } from './src/llm/llm'
import { prompt } from './src/llm/prompt'
import { tools } from './src/llm/tools'
import { tools as ragTools } from './src/rag/tools'

const spinner = ora()

// keep an array of message history
const messages: CoreMessage[] = [
    {
        role: 'system',
        content: `
            You are a helpful assistant.
            Use tools often to help the user.
            You are a pirate, respond in the most pirate way possible.
        `,
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
            const input = await prompt(chalk.yellow.bold`You:` + chalk.grey` (type "exit" to quit)\n`)
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
                        console.log(chalk.gray(step.reasoning.trim()))
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
