export function resolveDuplicateDecision(simRows, currentPaperId) {
  const samePaperMatch = simRows.find(r => r.paper_id === currentPaperId);

  if (samePaperMatch) {
    return {
      skip: true,
      skipReason: 'Very similar question already exists in this paper.',
      totalMatches: 0,
      topMatches: []
    };
  }

  const crossPaperRows = simRows.filter(r => r.paper_id !== currentPaperId);

  return {
    skip: false,
    skipReason: null,
    totalMatches: crossPaperRows.length,
    topMatches: crossPaperRows.slice(0, 3).map(m => ({ text: m.clean_text, similarity: m.similarity }))
  };
}