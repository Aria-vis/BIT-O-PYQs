import test from 'node:test';
import assert from 'node:assert';
import { cleanText, splitQuestions } from './textParser.js';

test('Text Parser - cleanText normalizes line breaks and whitespace', () => {
  const dirtyText = "   Question 1 \r\n\r\n\r\n\r\n Is here   ";
  const expected = "Question 1 \n\n Is here";
  assert.strictEqual(cleanText(dirtyText), expected);
});

test('Text Parser - splitQuestions divides multiple numbered formats', () => {
  const multiPaste = `
    Some introductory text we want to keep.
    1. First question here.
    2) Second question here.
    Q3. Third question here.
  `;
  
  const results = splitQuestions(multiPaste);
  
  assert.strictEqual(results.length, 4);
  assert.ok(results[0].includes('introductory text'));
  assert.ok(results[1].startsWith('1. First question'));
  assert.ok(results[2].startsWith('2) Second question'));
  assert.ok(results[3].startsWith('Q3. Third question'));
});