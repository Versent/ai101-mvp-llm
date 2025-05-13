import { test, TestContext } from 'node:test';
import * as log from './log';
import { MODELS_TO_EVALUATE } from './models';
import { Result, run } from './run';
import { evaluate } from './score/judge';
import { scoreToolUsage } from './score/tools';
import { TESTS } from './tests';

// keep a log
const debugLogPath = log.beginLog();

// store results
const results: { [s: string]: { [s: string]: Result; }; } = {}

// begin
test('Benchmark', async (tb: TestContext) => {

  // write final scores
  const scores: Map<string, number> = new Map()
  tb.after(async () => {

    const sortedScores = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([model, score]) => `- ${score} points - ${model}`)
      .join('\n')

    log.logRanking(debugLogPath, sortedScores);
  })

  // evaluate each model
  for (const model of MODELS_TO_EVALUATE) {

    await test(model.modelId, async (tc1: TestContext) => {

      results[model.modelId] = {}
      scores[model.modelId] = 0

      // run each test
      for (const [name, t] of Object.entries(TESTS)) {

        // log the model
        log.logModel(debugLogPath, model);

        // begin the test
        await tc1.test(name, async (tc2: TestContext) => {

          const context = `${tc1.name} > ${tc2.name}`

          // run the test
          const result = await run(model, t)
          results[model.modelId][name] = result

          // evaluate the result
          const evalScore = await evaluate(t, result)
          const toolScore = scoreToolUsage(t, result);

          // assert the response time
          await tc2.test(`should not be slow`, async () => {
            tc2.assert.ok(result.duration < 5000, `${context} > response time: ${result.duration}ms`)
          })

          // assert the evaluation
          await tc2.test('should be high quality and concise', async () => {
            scores[model.modelId] += evalScore.points
            tc2.assert.ok(evalScore.points >= 4, `${context} > ${evalScore.points} points (${evalScore.reason})`)
          })

          // assert the tool usage
          await tc2.test('should use the tools', async () => {
            scores[model.modelId] -= toolScore.missing.length
            tc2.assert.ok(toolScore.missing.length == 0, `${context} > missing tools: ${toolScore.missing.join(', ')}`)
          })
          await tc2.test('should not use too many tools', async () => {
            scores[model.modelId] -= toolScore.extra.length
            tc2.assert.ok(toolScore.extra.length == 0, `${context} > extra tools: ${toolScore.extra.join(', ')}`)
          })

          // log the result
          log.logResult(debugLogPath, name, result, evalScore, toolScore);

        })
      }
    })

  }

})
