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
  characterRatings,
}: UseCharacterFilteringProps) => {
  return useMemo(() => {
    let filtered = allCharacters;

    // Apply ignore filter
    if (ignoreFilter === "ignored-only") {
      filtered = filtered.filter((char) => ignoredCharacters.has(char.name));
    } else if (ignoreFilter === "not-ignored-only") {
      filtered = filtered.filter((char) => !ignoredCharacters.has(char.name));
    }

    // Apply content filter
    if (contentFilter === "canon-only") {
      filtered = filtered.filter((char) => char.fillerStatus === "canon");
    } else if (contentFilter === "fillers-only") {
      filtered = filtered.filter((char) => char.fillerStatus === "filler" || char.fillerStatus === "filler-non-tv");
    }

    // Apply non-TV content filter
    if (!includeNonTVContent) {
      filtered = filtered.filter((char) => char.fillerStatus !== "filler-non-tv");
    }

    // Apply rating filter
    if (ratingFilter === "rated-only") {
      filtered = filtered.filter((char) => characterRatings[char.name] && characterRatings[char.name] > 0);
    } else if (ratingFilter === "unrated-only") {
      filtered = filtered.filter((char) => !characterRatings[char.name] || characterRatings[char.name] === 0);
    }

    // Create Fuse instance (without useMemo)
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
        case "difficulty-easy-hard":
          const ratingA = characterRatings[a.name];
          const ratingB = characterRatings[b.name];
          return ratingA - ratingB;
        case "difficulty-hard-easy":
          const ratingA2 = characterRatings[a.name];
          const ratingB2 = characterRatings[b.name];
          return ratingB2 - ratingA2;
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
