
import { tool, ToolSet } from 'ai'
import z from 'zod'
import { get, put } from './vector'

export const tools: ToolSet = {

  search: tool({
    description: `
      Search for a document, quote, or any piece of information
      Example: "Search for any info about the weather"
      Example: "Do we have any documents about the Bob or Alice?"
    `,
    parameters: z.object({
      topic: z.string().describe('the general topic to search for'),
      keywords: z.array(z.string()).describe('any specific keywords to find, single words only, useful for initialisms')
    }),
    execute: async ({ topic, keywords }) => {
      const docs = await get(topic, keywords)
      return JSON.stringify(docs)
    }
  }),

  save: tool({
    description: `
      Save a quote, document, or any piece of information.
      Be sure to use a reference that is unique and descriptive.
      If no reference is provided, you need to come up with a useful title or summary.
      Example: "Save this info for later: Today I ate a sandwich"
    `,
    parameters: z.object({
      content: z.string().describe('the content of the document'),
      reference: z.string().describe('the reference for the document, like a title, URL, or file path, could also be a persons name if coming from a conversation')
    }),
    execute: async ({ content, reference }) => {
      await put(content, reference)
      return `Saved content for ${reference}`
    }
  }),
}
