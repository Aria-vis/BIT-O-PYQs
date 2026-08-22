import test from 'node:test';
import assert from 'node:assert';
import { splitQuestions } from './textParser.js';

test('Text Parser - correctly splits OCR text with Q-markers', () => {
  const ocrText = "Q1. What is React?\nQui(b) Explain hooks.";
  const results = splitQuestions(ocrText);
  
  assert.strictEqual(results.length, 2);
  assert.ok(results[0].includes('What is React?'));
  assert.ok(results[1].includes('Explain hooks.'));
});

test('Text Parser - correctly splits manually typed text by double line breaks', () => {
  const manualText = "What are Linked Lists?\n\nWhat are Data structures?";
  const results = splitQuestions(manualText);
  
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0], 'What are Linked Lists?');
});

test('Text Parser - ignores single line breaks in manual text', () => {
  const paragraphText = "Explain Linked Lists.\nInclude an example in your answer.";
  const results = splitQuestions(paragraphText);
  
  assert.strictEqual(results.length, 1);
});