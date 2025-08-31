import { useMemo } from "react";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterFilters";
import { BasicCharacter } from "../types/character";
import { useCharacterSearch } from "./useCharacterSearch";
import { getDifficultyNumericValue } from "../utils/difficulties";

interface UseCharacterFilteringProps {
  allCharacters: BasicCharacter[];
  ignoreFilter: IgnoreFilter;
  contentFilter: ContentFilter;
  ratingFilter: RatingFilter;
  includeNonTVContent: boolean;
  searchTerm: string;
  sortOption: SortOption;
  ignoredCharacters: Set<string>;
  characterRatings: Record<string, string | null>;
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
  // First apply all filters except search
  const filteredCharacters = useMemo(() => {
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

    // Apply rating filter
    if (ratingFilter === "rated-only") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating !== null && rating !== undefined && rating !== "" && rating !== "unrated";
      });
    } else if (ratingFilter === "unrated-only") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating === null || rating === undefined || rating === "" || rating === "unrated";
      });
    } else if (ratingFilter !== "all") {
      filtered = filtered.filter((char) => {
        const rating = char.difficulty || characterRatings[char.name];
        return rating === ratingFilter;
      });
    }

    return filtered;
  }, [
    allCharacters,
    ignoreFilter,
    contentFilter,
    ratingFilter,
    includeNonTVContent,
    ignoredCharacters,
    characterRatings,
  ]);

  // Apply search using the extracted hook (uses 0.2 threshold by default)
  const searchedCharacters = useCharacterSearch({
    characters: filteredCharacters,
    searchTerm,
  });

  // Finally apply sorting
  const finalCharacters = useMemo(() => {
    const sorted = [...searchedCharacters];

    sorted.sort((a, b) => {
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

    return sorted;
  }, [searchedCharacters, sortOption, characterRatings]);

  return finalCharacters;
};
