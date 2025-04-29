import { createInterface } from 'readline';

// help util to read use input and return it as a string
export async function prompt(prompt: string): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    })
    return new Promise<string>((res) => {
        return rl.question(prompt, res);
    }).finally(()=>rl.close())
}
