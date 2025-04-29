import { tool } from "ai"
import { z } from "zod"

export const tools = {
    random: tool({
        description: `
                            Generate a random number between min and max
                        `,
        parameters: z.object({
            min: z.number().optional().default(0),
            max: z.number().optional().default(100),
        }),
        execute: async (args) => {
            return Math.floor(Math.random() * (args.max - args.min + 1)) + args.min
        }
    }),
}
