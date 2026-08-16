import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export async function preprocessImage(imageBuffer) {
  try {
    const processedBuffer = await sharp(imageBuffer)
      .rotate()
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