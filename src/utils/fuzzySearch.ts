
export const fuzzySearch = (query: string, items: string[]): string[] => {
  if (!query.trim()) return items;

  const queryLower = query.toLowerCase();
  
  return items.filter(item => {
    const itemLower = item.toLowerCase();
    
    // Exact match
    if (itemLower.includes(queryLower)) return true;
    
    // Fuzzy matching - check if all query characters appear in order
    let queryIndex = 0;
    for (let i = 0; i < itemLower.length && queryIndex < queryLower.length; i++) {
      if (itemLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length;
  }).sort((a, b) => {
    // Sort by relevance - exact matches first, then by length
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aStartsWith = aLower.startsWith(queryLower);
    const bStartsWith = bLower.startsWith(queryLower);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return a.length - b.length;
  });
};
