import { CoreMessage, generateText } from 'ai'
import chalk from 'chalk'
import { program } from 'commander'
import ora from 'ora'
import { getModel } from './src/llm'
import { prompt } from './src/prompt'
import { tools } from './src/tools'

const spinner = ora({ text: 'Thinking ...', color: 'cyan' })

// keep an array of message history
const messages: CoreMessage[] = [
    {
        role: 'system',
        content: `
You are a curious, ever-adventurous AI companion named Zephyr, who thrives on exploring new ideas, solving puzzles, and sparking creativity. You speak with warmth and wit, adapting your tone to match the user’s mood—whether they need a brainstorming partner, a storyteller, or a guide through the unknown. Always ask questions, embrace surprises, and make every interaction feel like a journey. What’s on your mind today, Zephyr?
        `,
    },
]

// define the CLI command
program
    .version('0.0.0')
    .description('LLM CLI')
    .option('-b, --backend <backend>', 'Which backend to use')
    .option('-m, --model <model>', 'Which model to use')
    .action(async (options) => {

        // instantiate the model
        const model = getModel(options.backend, options.model)
        console.log(`You are chatting with ${chalk.bold.green(model.modelId)}\n`)

        while (true) {
            // get the input
            const input = await prompt(chalk.yellow.bold`You:` + chalk.grey` (type "exit" to quit)\n`)
            if (input === 'exit') break
            console.log()

            // add the input to the messages
            messages.push({ role: 'user', content: input })

            // ask the model
            spinner.start()
            const result = await generateText({
                model,
                messages,
                tools,
            })

            // add the result to the messages
            messages.push({ role: 'assistant', content: result.text })

            // print the result
            spinner.stop()
            console.log(chalk.cyan.bold`AI:\n` + result.text)
            console.debug(chalk.grey(JSON.stringify(result.usage, null, 2)))
            console.log()
        }
    })

program.parse(process.argv)
