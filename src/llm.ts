import { LanguageModel } from 'ai';
import { ollama } from 'ollama-ai-provider';

export function getModel(backend?: string, model?: string): LanguageModel {
    switch (backend) {

        // default to ollama
        case undefined:
        case 'ollama':
            return ollama(model || 'qwen3:0.6b')

        // unknown backend
        default:
            throw new Error(`Unknown backend: ${backend}`)
    }
}
