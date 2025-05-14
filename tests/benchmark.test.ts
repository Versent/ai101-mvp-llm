import { test, TestContext } from 'node:test';
import * as log from './log';
import { MODELS_TO_EVALUATE } from './models';
import { Result, run } from './run';
import { evaluate } from './score/judge';
import { scoreSpeed } from './score/speed';
import { scoreToolUsage } from './score/tools';
import { TESTS } from './tests';

// keep a log
const debugLogPath = log.beginLog();

// store results
const results: { [s: string]: { [s: string]: Result; }; } = {}

// begin
test('Benchmark', async (benchmarkCtx: TestContext) => {

  // write final scores
  const scores: Map<string, number> = new Map()
  benchmarkCtx.after(async () => {

    const sortedScores = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([model, score]) => `- ${score} points - ${model}`)
      .join('\n')

    log.logRanking(debugLogPath, sortedScores);
  })

  // evaluate each model
  for (const model of MODELS_TO_EVALUATE) {

    await benchmarkCtx.test(model.modelId, async (modelCtx: TestContext) => {

      // log the model
      log.logModel(debugLogPath, model);

      // run each test
      results[model.modelId] = {}
      scores[model.modelId] = 0
      for (const [name, t] of Object.entries(TESTS)) {

        // begin the test
        await modelCtx.test(name, async (testCtx: TestContext) => {

          const context = `${modelCtx.name} > ${testCtx.name}`

          // run the test
          const result = await run(model, t)
          results[model.modelId][name] = result

          // evaluate the result
          const evalScore = await evaluate(t, result)
          const toolScore = scoreToolUsage(t, result)
          const speedScore = scoreSpeed(t, result)

          // assert the response time
          await testCtx.test(`should not be slow`, async () => {
            scores[model.modelId] += speedScore
            testCtx.assert.ok(speedScore > 0, `${context} > response time: ${result.duration} ms`)
          })

          // assert the evaluation
          await testCtx.test('should be high quality and concise', async () => {
            scores[model.modelId] += evalScore.points
            testCtx.assert.ok(evalScore.points >= 4, `${context} > ${evalScore.points} points (${evalScore.reason})`)
          })

          // assert the tool usage
          await testCtx.test('should use the tools', async () => {
            scores[model.modelId] -= toolScore.missing.length
            testCtx.assert.ok(toolScore.missing.length == 0, `${context} > missing tools: ${toolScore.missing.join(', ')}`)
          })
          await testCtx.test('should not use too many tools', async () => {
            scores[model.modelId] -= toolScore.extra.length
            testCtx.assert.ok(toolScore.extra.length == 0, `${context} > extra tools: ${toolScore.extra.join(', ')}`)
          })

          // log the result
          log.logResult(debugLogPath, name, result, evalScore, toolScore);

        })
      }
    })

  }

})
