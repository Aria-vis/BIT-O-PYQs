import sharp from 'sharp';
import Tesseract from 'tesseract.js';

async function getVarianceAtAngle(buffer, angle) {
  const { data, info } = await sharp(buffer)
    .rotate(angle, { background: '#ffffff' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rowSums = new Float64Array(info.height);
  for (let y = 0; y < info.height; y++) {
    let sum = 0;
    let rowOffset = y * info.width;
    for (let x = 0; x < info.width; x++) {
      sum += data[rowOffset + x];
    }
    rowSums[y] = sum;
  }

  let mean = 0;
  for (let i = 0; i < info.height; i++) mean += rowSums[i];
  mean /= info.height;

  let variance = 0;
  for (let i = 0; i < info.height; i++) variance += Math.pow(rowSums[i] - mean, 2);
  
  return { angle, variance: variance / info.height };
}

async function estimateSkewAngle(buffer) {
  const baseBuffer = await sharp(buffer)
    .resize({ width: 600 })
    .grayscale()
    .toBuffer();

  const coarsePromises = [];
  for (let angle = -15; angle <= 15; angle += 1) {
    coarsePromises.push(getVarianceAtAngle(baseBuffer, angle));
  }
  
  const coarseResults = await Promise.all(coarsePromises);
  const bestCoarse = coarseResults.reduce((max, current) => current.variance > max.variance ? current : max, { variance: -1 });

  const finePromises = [];
  for (let angle = bestCoarse.angle - 1; angle <= bestCoarse.angle + 1; angle += 0.1) {
    const cleanAngle = Math.round(angle * 10) / 10;
    finePromises.push(getVarianceAtAngle(baseBuffer, cleanAngle));
  }
  
  const fineResults = await Promise.all(finePromises);
  const bestFine = fineResults.reduce((max, current) => current.variance > max.variance ? current : max, { variance: -1 });

  return bestFine.angle;
}

export async function preprocessImage(imageBuffer) {
  try {
    const orientedBuffer = await sharp(imageBuffer).rotate().toBuffer();

    const skewAngle = await estimateSkewAngle(orientedBuffer);

    const processedBuffer = await sharp(orientedBuffer)
      .rotate(skewAngle, { background: '#ffffff' })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
      
    return processedBuffer;
  } catch (error) {
    throw new Error('Image preprocessing failed: ' + error.message);
  }
}

export async function runOCR(imageBuffer) {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBuffer,
      'eng', 
    );
    
    return { 
      text: text.trim(), 
      confidence 
    };
  } catch (error) {
    throw new Error('OCR engine failed: ' + error.message);
  }
}