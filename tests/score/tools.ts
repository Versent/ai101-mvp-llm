import { Result, Test } from '../benchmark.test';

export function scoreToolUsage(t: Test, result: Result): ToolScore {
  const hit: string[] = [];
  const wantCopy = t.toolsUsed.slice();
  const gotCopy = result.toolsUsed.slice();
  let toolScore = 0;
  for (let i = 0; i < wantCopy.length; i++) {
    const tool = wantCopy[i];
    if (gotCopy.includes(tool)) {
      // tool hit, remove it from both lists
      wantCopy.splice(i, 1);
      gotCopy.splice(gotCopy.indexOf(tool), 1);
      hit.push(tool);
    }
  }
  toolScore = toolScore - wantCopy.length - gotCopy.length;
  return {
    satisfied: hit,
    missing: wantCopy,
    extra: gotCopy,
  };
}export interface ToolScore {
  satisfied: string[];
  missing: string[];
  extra: string[];
}

