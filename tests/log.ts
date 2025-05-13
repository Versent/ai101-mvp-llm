import { LanguageModel } from "ai";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { SYSTEM_MESSAGE } from "../src/cli/SYSTEM_MESSAGE";
import { Result } from "./run";
import { Review, verifierModel } from "./score/judge";
import { ToolScore } from "./score/tools";

export function logResult(debugLogPath: string, name: string, result: Result, evalScore: Review, toolScore: ToolScore) {
  appendFileSync(debugLogPath, [
    `### Test: ${name}`,
    '#### Result',
    '```json',
    JSON.stringify(result, null, 2),
    '```',
    '#### Score',
    '```json',
    JSON.stringify(evalScore, null, 2),
    '```',
    '#### Tool Score',
    '```json',
    JSON.stringify(toolScore, null, 2),
    '```',
    ''
  ].join('\n'));
}

export function logModel(debugLogPath: string, model: LanguageModel) {
  appendFileSync(debugLogPath, [
    `## Model: ${model.provider} - ${model.modelId}`,
    '',
  ].join('\n'));
}

export function logRanking(debugLogPath: string, sortedScores: string) {
  appendFileSync(debugLogPath, [
    '',
    '# Ranking',
    sortedScores,
  ].join('\n')
  );
}

export function beginLog(): string {

  // decide on path
  const outputDir = path.resolve(__dirname, 'results');
  const debugLogPath = path.join(outputDir, `${new Date().toISOString()}.md`);

  // ensure it exists
  if (!existsSync(outputDir)) mkdirSync(outputDir);

  // write the header
  appendFileSync(debugLogPath, [
    '# Evaluation Log',
    `- Run at: ${new Date().toISOString()}`,
    `- Evaluated by: ${verifierModel.provider} ${verifierModel.modelId}`,
    '',
    '## System Prompt',
    '```md',
    SYSTEM_MESSAGE,
    '```',
    ''
  ].join('\n')
  )

  return debugLogPath;
}

