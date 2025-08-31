// src/hooks/useCharacterSearch.ts
import { useMemo } from "react";
import Fuse from "fuse.js";
import { BasicCharacter } from "../types/character";

interface UseCharacterSearchProps {
  characters: BasicCharacter[];
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

// Utility function to remove accents/diacritics
const removeAccents = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const useCharacterSearch = ({ characters, searchTerm, searchOptions = {} }: UseCharacterSearchProps) => {
  return useMemo(() => {
    // If no search term, return all characters
    if (!searchTerm.trim()) {
      return characters;
    }

    // Add normalized versions of searchable fields to each character
    const charactersWithNormalized = characters.map((character) => ({
      ...character,
      normalizedName: removeAccents(character.name),
    }));

    // Consistent default options for ALL uses
    const defaultOptions = {
      keys: ["name", "normalizedName"], // Search both original and normalized names
      threshold: 0.2, // More strict matching by default
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
      findAllMatches: true,
    };

    // Merge with any custom options (custom options override defaults)
    const fuseOptions = { ...defaultOptions, ...searchOptions };

    // Create Fuse instance and search
    const fuse = new Fuse(charactersWithNormalized, fuseOptions);

    // Normalize the search term as well
    const normalizedSearchTerm = removeAccents(searchTerm);
    const searchResults = fuse.search(normalizedSearchTerm);

    return searchResults.map((result) => result.item);
  }, [characters, searchTerm, searchOptions]);
};
