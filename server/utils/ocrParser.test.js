import test from 'node:test';
import assert from 'node:assert';
import { pickBestAngle } from './ocrParser.js';

test('OCR Parser - pickBestAngle selects the highest-variance candidate', () => {
  const results = [{ angle: -2, variance: 120 }, { angle: 0, variance: 340 }, { angle: 3, variance: 210 }];
  assert.strictEqual(pickBestAngle(results).angle, 0);
});

test('OCR Parser - pickBestAngle handles a single candidate', () => {
  assert.strictEqual(pickBestAngle([{ angle: 1.5, variance: 500 }]).angle, 1.5);
});