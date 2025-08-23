import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../../types/characterFilters";
import { DIFFICULTY_OPTIONS, toTitleCase } from "@/utils/difficulties";

interface CharacterFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  ignoreFilter: IgnoreFilter;
  onIgnoreFilterChange: (value: IgnoreFilter) => void;
  contentFilter: ContentFilter;
  onContentFilterChange: (value: ContentFilter) => void;
  ratingFilter: RatingFilter;
  onRatingFilterChange: (value: RatingFilter) => void;
  includeNonTVContent: boolean;
  onIncludeNonTVContentChange: (checked: boolean) => void;
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
  filteredCount: number;
  totalCount: number;
}

export const CharacterFilters: React.FC<CharacterFiltersProps> = ({
  searchTerm,
  onSearchChange,
  ignoreFilter,
  onIgnoreFilterChange,
  contentFilter,
  onContentFilterChange,
  ratingFilter,
  onRatingFilterChange,
  includeNonTVContent,
  onIncludeNonTVContentChange,
  sortOption,
  onSortOptionChange,
  filteredCount,
  totalCount,
}) => {
  // Check if non-TV content should be disabled
  const isNonTVContentDisabled = contentFilter === "canon-only";

  return (
    <div className="bg-card backdrop-blur-lg rounded-2xl p-6 border border-border">
      <h2 className="text-xl font-semibold text-foreground">Filters</h2>

      {/* Results Info */}
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">
          Showing {filteredCount} of {totalCount} characters
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Search Characters</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Type character name..."
        />
      </div>

      {/* Sort Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
        <Select value={sortOption} onValueChange={onSortOptionChange}>
          <SelectTrigger className="bg-input hover:bg-input hover:brightness-125 border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="alphabetical-az">A-Z</SelectItem>
            <SelectItem value="alphabetical-za">Z-A</SelectItem>
            <SelectItem value="difficulty-easy-hard">Difficulty: Easy → Hard</SelectItem>
            <SelectItem value="difficulty-hard-easy">Difficulty: Hard → Easy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Difficulty Status</label>
        <Select value={ratingFilter} onValueChange={onRatingFilterChange}>
          <SelectTrigger className="bg-input hover:bg-input hover:brightness-125 border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="rated-only">All Rated</SelectItem>
            <SelectItem value="unrated-only">Unrated</SelectItem>
            {DIFFICULTY_OPTIONS.filter((diff) => diff !== "unrated").map((difficulty) => (
              <SelectItem key={difficulty} value={difficulty}>
                {toTitleCase(difficulty)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ignore Filter - Button Group */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Ignore Status</label>
        <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => onIgnoreFilterChange("all")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "all"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onIgnoreFilterChange("not-ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "not-ignored-only"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Not Ignored
          </button>
          <button
            onClick={() => onIgnoreFilterChange("ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "ignored-only"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ignored
          </button>
        </div>
      </div>

      {/* Content Filter - Button Group */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Content Type</label>
        <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => onContentFilterChange("all")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "all"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onContentFilterChange("canon-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "canon-only"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Canon
          </button>
          <button
            onClick={() => onContentFilterChange("fillers-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "fillers-only"
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fillers
          </button>
        </div>
      </div>

      {/* Non-TV Content */}
      <div>
        <label
          className={`flex items-center space-x-3 ${
            isNonTVContentDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            checked={includeNonTVContent}
            onChange={(e) => onIncludeNonTVContentChange(e.target.checked)}
            disabled={isNonTVContentDisabled}
            className=""
          />
          <span className={`text-sm ${isNonTVContentDisabled ? "text-muted-foreground" : "text-foreground"}`}>
            Include Non-TV Content (Movies, Games, etc.)
          </span>
        </label>
      </div>
    </div>
  );
};
