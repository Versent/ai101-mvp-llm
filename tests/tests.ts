export interface Test {
  input: string
  assess: string
  toolsUsed: string[]
}

export const TESTS: Record<string, Test> = {
  'Trivial Fact': {
    input: 'What is the capital of France?',
    assess: 'This trivial fact does not need tools, the output should include The capital of France is Paris.',
    toolsUsed: [],
  },
  'Private Fact - from system prompt': {
    input: 'Who do you work for?',
    assess: 'This is a simple question about our company can be answered from the system prompt. The output should include Versent and some history.',
    toolsUsed: [],
  },
  'Tool Usage - numeric': {
    input: 'give a random number between a million and five billion',
    assess: 'the assistant uses the random tool to return a random number between 1,000,000 and 5,000,000,000',
    toolsUsed: ['random'],
  },
  'Tool Usage - search': {
    input: 'what do you know about agile?',
    assess: 'search tool yeilds a result about the agile manifesto',
    toolsUsed: ['search'],
  },
};
