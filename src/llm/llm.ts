import { extractReasoningMiddleware, LanguageModel, wrapLanguageModel } from 'ai';
import { ollama } from 'ollama-ai-provider';

export function getModel(backend?: string, model?: string): LanguageModel {
    switch (backend) {

        // default to ollama
        case undefined:
        case 'ollama':
            const m = ollama(model || 'qwen3:0.6b')
            return wrapLanguageModel({
                model: m,
                middleware: extractReasoningMiddleware({
                    tagName: 'think',
                    separator: '\n\n',
                    startWithReasoning: true,
                }),
            })

        // unknown backend
        default:
            throw new Error(`Unknown backend: ${backend}`)
    }
}
