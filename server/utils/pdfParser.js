import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { preprocessImage, runOCR } from './ocrParser.js';

export async function extractTextLayer(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    
    if (text.length > 50) {
      return text;
    }
    return null;
  } catch (err) {
    console.warn('PDF text extraction failed or empty, falling back to OCR:', err.message);
    return null;
  }
}

export async function renderPagesToImages(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); 

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    const imageBuffer = canvas.toBuffer('image/png');

    const processedBuffer = await preprocessImage(imageBuffer);
    const { text } = await runOCR(processedBuffer);
    
    fullText += text + '\n\n';
  }

  return fullText.trim();
}