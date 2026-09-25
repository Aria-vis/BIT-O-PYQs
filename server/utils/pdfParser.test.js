import test from 'node:test';
import assert from 'node:assert';
import { hasUsableTextLayer } from './pdfParser.js';

test('PDF Parser - text over the minimum length counts as a real text layer', () => {
  assert.strictEqual(hasUsableTextLayer('A'.repeat(60)), true);
});

test('PDF Parser - short, empty, or null text does not count', () => {
  assert.strictEqual(hasUsableTextLayer(''), false);
  assert.strictEqual(hasUsableTextLayer('short'), false);
  assert.strictEqual(hasUsableTextLayer(null), false);
});