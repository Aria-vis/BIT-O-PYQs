import test from 'node:test';
import assert from 'node:assert';
import { resolveDuplicateDecision } from './duplicateDetection.js';

test('Duplicate Detection - skips when the top match is in the same paper', () => {
  const rows = [{ paper_id: 1, clean_text: 'Explain hooks.', similarity: 0.95 }];
  const result = resolveDuplicateDecision(rows, 1);
  assert.strictEqual(result.skip, true);
  assert.strictEqual(result.totalMatches, 0);
});

test('Duplicate Detection - catches a same-paper match even when it is NOT the top-ranked result', () => {
  const rows = [
    { paper_id: 2, clean_text: 'What is React?', similarity: 0.93 }, 
    { paper_id: 1, clean_text: 'What is React?', similarity: 0.88 }  
  ];
  assert.strictEqual(resolveDuplicateDecision(rows, 1).skip, true);
});

test('Duplicate Detection - keeps and summarizes cross-paper matches, capped at top 3', () => {
  const rows = [
    { paper_id: 2, clean_text: 'Explain hooks.', similarity: 0.95 },
    { paper_id: 3, clean_text: 'Explain hooks in React.', similarity: 0.90 },
    { paper_id: 4, clean_text: 'What are React hooks?', similarity: 0.87 },
    { paper_id: 5, clean_text: 'Describe hooks.', similarity: 0.86 }
  ];
  const result = resolveDuplicateDecision(rows, 1);
  assert.strictEqual(result.skip, false);
  assert.strictEqual(result.totalMatches, 4);
  assert.strictEqual(result.topMatches.length, 3);
  assert.strictEqual(result.topMatches[0].similarity, 0.95);
});

test('Duplicate Detection - no matches returns a clean keep', () => {
  const result = resolveDuplicateDecision([], 1);
  assert.strictEqual(result.skip, false);
  assert.deepStrictEqual(result.topMatches, []);
});