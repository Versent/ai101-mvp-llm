import { extractReasoningMiddleware, LanguageModel, wrapLanguageModel } from 'ai';
import { ollama } from 'ollama-ai-provider';

export function getModel(backend?: string, model?: string): LanguageModel {
    switch (backend) {

        // default to ollama
        case undefined:
        case 'ollama':
            return thinkWrap(ollama(model || 'qwen3:0.6b'))

        // unknown backend
        default:
            throw new Error(`Unknown backend: ${backend}`)
    }
}

export function thinkWrap(model: LanguageModel): LanguageModel {
    return wrapLanguageModel({
        model,
        middleware: extractReasoningMiddleware({
            tagName: 'think',
            separator: '\n\n',
            startWithReasoning: true,
        }),
    })
}
