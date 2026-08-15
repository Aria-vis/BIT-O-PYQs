// 10.2 Text cleanup function
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')       
    .replace(/\n{3,}/g, '\n\n')   
    .trim();                      
}

export function splitQuestions(text) {
  const cleanedText = cleanText(text);
  const splitRegex = /(?=(?:^|\n)\s*(?:Q\.?\s*\d+|\d+)[.)]\s)/gi;
  const rawSplits = cleanedText.split(splitRegex);
  
  return rawSplits.map(q => cleanText(q)).filter(q => q.length > 0);
}