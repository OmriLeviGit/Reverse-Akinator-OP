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
  characterRatings: Record<string, string | null>;
}

// Helper function to convert difficulty strings to numeric values for sorting
const getDifficultyNumericValue = (difficulty: string | null | undefined): number => {
  if (!difficulty || difficulty === "") return 0;

  switch (difficulty) {
    case "very-easy":
      return 1;
    case "easy":
      return 2;
    case "medium":
      return 3;
    case "hard":
      return 4;
    case "really-hard":
      return 5;
    default:
      return 0;
  }
};

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

    // Apply ignore filter
    if (ignoreFilter === "ignored-only") {
      filtered = filtered.filter((char) => char.isIgnored);
    } else if (ignoreFilter === "not-ignored-only") {
      filtered = filtered.filter((char) => !char.isIgnored);
    }

    // Apply content filter
    if (contentFilter === "canon-only") {
      filtered = filtered.filter((char) => char.fillerStatus === "Canon");
    } else if (contentFilter === "fillers-only") {
      // FIXED: "Fillers Only" = everything that's NOT Canon
      filtered = filtered.filter((char) => char.fillerStatus !== "Canon");
    }

    // Apply non-TV content filter - This runs AFTER content filter
    if (!includeNonTVContent) {
      // Remove non-TV content from whatever is already filtered
      filtered = filtered.filter((char) => char.fillerStatus === "Canon" || char.fillerStatus === "Filler");
    }

    // ... rest of your filtering logic stays the same

    // Apply rating filter
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
    } else if (ratingFilter !== "all") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating === ratingFilter;
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

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "alphabetical-az":
          return a.name.localeCompare(b.name);
        case "alphabetical-za":
          return b.name.localeCompare(a.name);
        case "difficulty-easy-hard": {
          const ratingA = a.difficulty || characterRatings[a.name];
          const ratingB = b.difficulty || characterRatings[b.name];

          const numA = getDifficultyNumericValue(ratingA);
          const numB = getDifficultyNumericValue(ratingB);

          if (numA === 0 && numB === 0) return 0;
          if (numA === 0) return 1;
          if (numB === 0) return -1;

          return numA - numB;
        }
        case "difficulty-hard-easy": {
          const ratingA = a.difficulty || characterRatings[a.name];
          const ratingB = b.difficulty || characterRatings[b.name];

          const numA = getDifficultyNumericValue(ratingA);
          const numB = getDifficultyNumericValue(ratingB);

          if (numA === 0 && numB === 0) return 0;
          if (numA === 0) return 1;
          if (numB === 0) return -1;

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
