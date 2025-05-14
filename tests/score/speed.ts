import { Result } from '../run';
import { Test } from '../tests';

export function scoreSpeed(t: Test, result: Result) {
  if (result.duration < 1000) return 2;
  if (result.duration < 5000) return 1;
  return 0;
}
