import React from "react";
import { IgnoreFilterButton } from "./IgnoreFilterButton";
import { ContentFilterButton } from "./ContentFilterButton";
import { RatingFilterButton } from "./DifficultyFilterButton";
import { SearchAndSort } from "./SearchAndSort";
import { Button } from "@/components/ui/button";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../../types/characterManagement";

interface CharacterFiltersProps {
  ignoreFilter: IgnoreFilter;
  contentFilter: ContentFilter;
  ratingFilter: RatingFilter;
  includeNonTVContent: boolean;
  searchTerm: string;
  sortOption: SortOption;
  onIgnoreFilterCycle: () => void;
  onContentFilterCycle: () => void;
  onRatingFilterCycle: () => void;
  onNonTVContentChange: (checked: boolean | "indeterminate") => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
}

export const CharacterFilters: React.FC<CharacterFiltersProps> = ({
  ignoreFilter,
  contentFilter,
  ratingFilter,
  includeNonTVContent,
  searchTerm,
  sortOption,
  onIgnoreFilterCycle,
  onContentFilterCycle,
  onRatingFilterCycle,
  onNonTVContentChange,
  onSearchChange,
  onSortChange,
}) => {
  const isNonTVEnabled = contentFilter === "all" || contentFilter === "fillers-only";

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 ship-shadow border border-white/20">
      {/** Top Row: Triple Toggle Filters with reduced spacing **/}
      <div className="flex flex-wrap justify-center items-center gap-16 mb-4">
        <ContentFilterButton contentFilter={contentFilter} onCycle={onContentFilterCycle} />
        <RatingFilterButton ratingFilter={ratingFilter} onCycle={onRatingFilterCycle} />
        <IgnoreFilterButton ignoreFilter={ignoreFilter} onCycle={onIgnoreFilterCycle} />
      </div>
      <div className="flex justify-start mb-4">
        <div className="flex flex-col items-center space-y-2">
          <Button
            onClick={() => onNonTVContentChange(!includeNonTVContent)}
            disabled={!isNonTVEnabled}
            size="sm"
            className={`w-42 h-8 py-1 text-xs transition-all duration-200 ${
              includeNonTVContent ? "bg-white/30 hover:bg-white/40 border-white/40" : "bg-white/10 hover:bg-white/20 border-white/20"
            } ${!isNonTVEnabled ? "opacity-50 cursor-not-allowed" : ""} border`}
          >
            Include Non-TV Content: {includeNonTVContent ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/** Bottom Row: Search and Sort **/}
      <SearchAndSort searchTerm={searchTerm} sortOption={sortOption} onSearchChange={onSearchChange} onSortChange={onSortChange} />
    </div>
  );
};
