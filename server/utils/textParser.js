export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')       
    .replace(/\n{3,}/g, '\n\n')   
    .trim();                      
}

export function splitQuestions(text) {
  if (!text) return [];
  const markerRegex = /(?=\n\s*Q[a-z]*\.?\s*\d*\s*\(?[a-z]?\)?)/i;

  let rawSplits;
  if (markerRegex.test(text)) {
    rawSplits = text.split(markerRegex);
  } else {
    rawSplits = text.split(/\n\s*\n/);
  }

  return rawSplits
    .map(q => q.trim())
    .filter(q => q.length > 10); 
}