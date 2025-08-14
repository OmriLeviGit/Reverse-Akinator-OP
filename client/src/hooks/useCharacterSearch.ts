// src/hooks/useCharacterSearch.ts
import { useMemo } from "react";
import Fuse from "fuse.js";
import { Character } from "../types/character";

interface UseCharacterSearchProps {
  characters: Character[];
  searchTerm: string;
  searchOptions?: Partial<{
    keys: string[];
    threshold: number;
    minMatchCharLength: number;
    includeScore: boolean;
    distance: number;
    ignoreLocation: boolean;
    findAllMatches: boolean;
    useExtendedSearch: boolean;
  }>;
}

export const useCharacterSearch = ({ characters, searchTerm, searchOptions = {} }: UseCharacterSearchProps) => {
  return useMemo(() => {
    // If no search term, return all characters
    if (!searchTerm.trim()) {
      return characters;
    }

    // Consistent default options for ALL uses
    const defaultOptions = {
      keys: ["name"],
      threshold: 0.2, // More strict matching by default
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
      findAllMatches: true,
    };

    // Merge with any custom options (custom options override defaults)
    const fuseOptions = { ...defaultOptions, ...searchOptions };

    // Create Fuse instance and search
    const fuse = new Fuse(characters, fuseOptions);
    const searchResults = fuse.search(searchTerm);

    return searchResults.map((result) => result.item);
  }, [characters, searchTerm, searchOptions]);
};
