import { useMemo } from "react";
import { fuzzySearch } from "../utils/fuzzySearch";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";
import { Character } from "../types/character"; // ✅ Add this import

// ❌ Remove this duplicate interface entirely
// interface CharacterData {
//   id: string;
//   name: string;
//   description: string;
//   image: string;
//   chapter: number;
//   fillerStatus: "canon" | "filler";
//   wikiLink: string;
//   currentRating?: number;
//   isIgnored?: boolean;
// }

interface UseCharacterFilteringProps {
  allCharacters: Character[]; // ✅ Use the shared Character interface
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
      filtered = filtered.filter((char) => char.fillerStatus === "filler");
    }

    // ✅ Now we can use is_tv since it's in our Character interface
    if (!includeNonTVContent) {
      filtered = filtered.filter((char) => char.is_tv);
    }

    // Apply rating filter
    if (ratingFilter === "rated-only") {
      filtered = filtered.filter((char) => characterRatings[char.id] && characterRatings[char.id] > 0);
    } else if (ratingFilter === "unrated-only") {
      filtered = filtered.filter((char) => !characterRatings[char.id] || characterRatings[char.id] === 0);
    }

    // Apply search
    if (searchTerm.trim()) {
      const searchResults = fuzzySearch(
        searchTerm,
        filtered.map((char) => char.name)
      );
      filtered = searchResults.map((name) => filtered.find((char) => char.name === name)!).filter(Boolean);
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
