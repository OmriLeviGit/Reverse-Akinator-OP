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
      filtered = filtered.filter((char) => ignoredCharacters.has(char.id));
    } else if (ignoreFilter === "not-ignored-only") {
      filtered = filtered.filter((char) => !ignoredCharacters.has(char.id));
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
      filtered = filtered.filter((char) => characterRatings[char.id] && characterRatings[char.id] > 0);
    } else if (ratingFilter === "unrated-only") {
      filtered = filtered.filter((char) => !characterRatings[char.id] || characterRatings[char.id] === 0);
    }

    // Create Fuse instance (put this outside the filtering logic, preferably as a useMemo)
    const fuse = useMemo(() => {
      return new Fuse(filtered, {
        keys: ["name"], // Search by character name
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 1,
      });
    }, [filtered]);

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
          const ratingA = characterRatings[a.id] || 0;
          const ratingB = characterRatings[b.id] || 0;
          return ratingA - ratingB;
        case "difficulty-hard-easy":
          const ratingA2 = characterRatings[a.id] || 0;
          const ratingB2 = characterRatings[b.id] || 0;
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
