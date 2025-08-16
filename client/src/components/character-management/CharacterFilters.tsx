import React from "react";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../../types/characterManagement";

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
      <h2 className="text-xl font-semibold text-foreground mb-6">Filters</h2>

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
        <select
          value={sortOption}
          onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="alphabetical-az" className="bg-popover text-popover-foreground">
            A-Z
          </option>
          <option value="alphabetical-za" className="bg-popover text-popover-foreground">
            Z-A
          </option>
          <option value="difficulty-easy-hard" className="bg-popover text-popover-foreground">
            Difficulty: Easy → Hard
          </option>
          <option value="difficulty-hard-easy" className="bg-popover text-popover-foreground">
            Difficulty: Hard → Easy
          </option>
        </select>
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Difficulty Status</label>
        <select
          value={ratingFilter}
          onChange={(e) => onRatingFilterChange(e.target.value as RatingFilter)}
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all" className="bg-popover text-popover-foreground">
            All Difficulties
          </option>
          <option value="rated-only" className="bg-popover text-popover-foreground">
            All Rated
          </option>
          <option value="unrated-only" className="bg-popover text-popover-foreground">
            Unrated
          </option>
          <option value="very-easy" className="bg-popover text-popover-foreground">
            Very Easy
          </option>
          <option value="easy" className="bg-popover text-popover-foreground">
            Easy
          </option>
          <option value="medium" className="bg-popover text-popover-foreground">
            Medium
          </option>
          <option value="hard" className="bg-popover text-popover-foreground">
            Hard
          </option>
          <option value="really-hard" className="bg-popover text-popover-foreground">
            Really Hard
          </option>
        </select>
      </div>

      {/* Ignore Filter - Button Group */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Ignore Status</label>
        <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => onIgnoreFilterChange("all")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onIgnoreFilterChange("not-ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "not-ignored-only"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            Not Ignored
          </button>
          <button
            onClick={() => onIgnoreFilterChange("ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "ignored-only"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onContentFilterChange("canon-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "canon-only"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            Canon
          </button>
          <button
            onClick={() => onContentFilterChange("fillers-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "fillers-only"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
