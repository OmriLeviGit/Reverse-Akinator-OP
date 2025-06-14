
import { useMemo } from 'react';
import { fuzzySearch } from '../utils/fuzzySearch';
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from '../types/characterManagement';

interface Character {
  name: string;
  image: string;
  wikiUrl: string;
  firstAppeared: {
    type: string;
  };
}

interface UseCharacterFilteringProps {
  allCharacters: Character[];
  ignoreFilter: IgnoreFilter;
  contentFilter: ContentFilter;
  ratingFilter: RatingFilter;
  includeNonTVContent: boolean;
  searchTerm: string;
  sortOption: SortOption;
  ignoredCharacters: Set<string>;
  characterRatings: Record<string, number>;
}

export const useCharacterFiltering = ({
  allCharacters,
  ignoreFilter,
  contentFilter,
  ratingFilter,
  includeNonTVContent,
  searchTerm,
  sortOption,
  ignoredCharacters,
  characterRatings
}: UseCharacterFilteringProps) => {
  return useMemo(() => {
    let filtered = allCharacters;

    // Apply ignore filter
    if (ignoreFilter === 'ignored-only') {
      filtered = filtered.filter(char => ignoredCharacters.has(char.name));
    } else if (ignoreFilter === 'not-ignored-only') {
      filtered = filtered.filter(char => !ignoredCharacters.has(char.name));
    }

    // Apply content filter
    if (contentFilter === 'canon-only') {
      filtered = filtered.filter(char => char.firstAppeared.type === 'canon');
    } else if (contentFilter === 'fillers-only') {
      filtered = filtered.filter(char => char.firstAppeared.type === 'filler');
    }
    // For canon-and-fillers, show all

    // Apply rating filter
    if (ratingFilter === 'rated-only') {
      filtered = filtered.filter(char => characterRatings[char.name] && characterRatings[char.name] > 0);
    } else if (ratingFilter === 'unrated-only') {
      filtered = filtered.filter(char => !characterRatings[char.name] || characterRatings[char.name] === 0);
    }

    // Apply search
    if (searchTerm.trim()) {
      const searchResults = fuzzySearch(searchTerm, filtered.map(char => char.name));
      filtered = searchResults.map(name => filtered.find(char => char.name === name)!).filter(Boolean);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical-az':
          return a.name.localeCompare(b.name);
        case 'alphabetical-za':
          return b.name.localeCompare(a.name);
        case 'difficulty-easy-hard':
          const ratingA = characterRatings[a.name] || 0;
          const ratingB = characterRatings[b.name] || 0;
          return ratingA - ratingB;
        case 'difficulty-hard-easy':
          const ratingA2 = characterRatings[a.name] || 0;
          const ratingB2 = characterRatings[b.name] || 0;
          return ratingB2 - ratingA2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCharacters, ignoreFilter, contentFilter, ratingFilter, includeNonTVContent, searchTerm, sortOption, ignoredCharacters, characterRatings]);
};
