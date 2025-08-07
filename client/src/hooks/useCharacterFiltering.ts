import { useMemo } from "react";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";
import { Character } from "../types/character";
import Fuse from "fuse.js";

interface UseCharacterFilteringProps {
  allCharacters: Character[];
  ignoreFilter: IgnoreFilter;
  contentFilter: ContentFilter;
  ratingFilter: RatingFilter;
  includeNonTVContent: boolean;
  searchTerm: string;
  sortOption: SortOption;
  ignoredCharacters: Set<string>;
  characterRatings: Record<string, string | null>; // ✅ Updated to match new difficulty type
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
  characterRatings,
}: UseCharacterFilteringProps) => {
  return useMemo(() => {
    let filtered = allCharacters;

    // Apply ignore filter - now using character.isIgnored directly
    if (ignoreFilter === "ignored-only") {
      filtered = filtered.filter((char) => char.isIgnored);
    } else if (ignoreFilter === "not-ignored-only") {
      filtered = filtered.filter((char) => !char.isIgnored);
    }

    // Apply content filter - updated to match new fillerStatus values
    if (contentFilter === "canon-only") {
      filtered = filtered.filter((char) => char.fillerStatus === "Canon");
    } else if (contentFilter === "fillers-only") {
      filtered = filtered.filter((char) => 
        char.fillerStatus === "Filler" || char.fillerStatus === "Filler-Non-TV"
      );
    }

    // Apply non-TV content filter - updated to match new fillerStatus value
    if (!includeNonTVContent) {
      filtered = filtered.filter((char) => char.fillerStatus !== "Filler-Non-TV");
    }

    // Apply rating filter - updated to handle string | null difficulty values
    if (ratingFilter === "rated-only") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating !== null && rating !== undefined && rating !== "";
      });
    } else if (ratingFilter === "unrated-only") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating === null || rating === undefined || rating === "";
      });
    }

    // Create Fuse instance
    const fuse = new Fuse(filtered, {
      keys: ["name"],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
    });

    // Apply search
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      filtered = searchResults.map((result) => result.item);
    }

    // Apply sorting - updated to handle string | null difficulty values
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "alphabetical-az":
          return a.name.localeCompare(b.name);
        case "alphabetical-za":
          return b.name.localeCompare(a.name);
        case "difficulty-easy-hard": {
          const ratingA = a.difficulty || characterRatings[a.name];
          const ratingB = b.difficulty || characterRatings[b.name];
          
          // Handle null/undefined values by putting them at the end
          if (!ratingA && !ratingB) return 0;
          if (!ratingA) return 1;
          if (!ratingB) return -1;
          
          // Convert to numbers for comparison if they're strings
          const numA = typeof ratingA === 'string' ? parseFloat(ratingA) : ratingA;
          const numB = typeof ratingB === 'string' ? parseFloat(ratingB) : ratingB;
          
          return numA - numB;
        }
        case "difficulty-hard-easy": {
          const ratingA = a.difficulty || characterRatings[a.name];
          const ratingB = b.difficulty || characterRatings[b.name];
          
          // Handle null/undefined values by putting them at the end
          if (!ratingA && !ratingB) return 0;
          if (!ratingA) return 1;
          if (!ratingB) return -1;
          
          // Convert to numbers for comparison if they're strings
          const numA = typeof ratingA === 'string' ? parseFloat(ratingA) : ratingA;
          const numB = typeof ratingB === 'string' ? parseFloat(ratingB) : ratingB;
          
          return numB - numA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    allCharacters,
    ignoreFilter,
    contentFilter,
    ratingFilter,
    includeNonTVContent,
    searchTerm,
    sortOption,
    ignoredCharacters,
    characterRatings,
  ]);
};