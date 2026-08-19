import { pipeline } from '@xenova/transformers';
import crypto from 'crypto';

let extractor = null;

export async function initModel() {
  if (!extractor) {
    console.log('Loading local embedding model (Xenova/all-MiniLM-L6-v2)...');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded successfully!');
  }
  return extractor;
}

export function generateTextHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function generateEmbedding(text) {
  const model = await initModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}