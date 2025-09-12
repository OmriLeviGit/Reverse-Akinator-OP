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

    // Check if search term starts with '/' for affiliations search
    const isAffiliationsSearch = searchTerm.startsWith("/");
    const actualSearchTerm = isAffiliationsSearch ? searchTerm.slice(1) : searchTerm;

    // If actual search term is empty (e.g., just "/"), return all characters
    if (!actualSearchTerm.trim()) {
      return characters;
    }

    // Add normalized versions of searchable fields to each character
    const charactersWithNormalized = characters.map((character) => ({
      ...character,
      normalizedName: removeAccents(character.name),
      normalizedAffiliations: character.affiliations ? removeAccents(character.affiliations) : null,
    }));

    // Consistent default options for ALL uses
    const defaultKeys = isAffiliationsSearch
      ? ["name", "normalizedName", "affiliations", "normalizedAffiliations"] // Search BOTH names and affiliations when starting with '/'
      : ["name", "normalizedName"]; // Search names only by default

    const defaultOptions = {
      keys: defaultKeys,
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

    // Normalize the actual search term (without the '/' prefix)
    const normalizedSearchTerm = removeAccents(actualSearchTerm);
    const searchResults = fuse.search(normalizedSearchTerm);

    return searchResults.map((result) => result.item);
  }, [characters, searchTerm, searchOptions]);
};
