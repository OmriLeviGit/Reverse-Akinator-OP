import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const getRatingFilterDisplay = (filter: RatingFilter): string => {
    switch (filter) {
      case "all":
        return "All Difficulties";
      case "rated-only":
        return "All Rated";
      case "unrated-only":
        return "Unrated";
      default:
        return toTitleCase(filter);
    }
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-input hover:bg-secondary text-foreground hover:text-foreground border-border"
            >
              {sortOption === "alphabetical-az" && "A-Z"}
              {sortOption === "alphabetical-za" && "Z-A"}
              {sortOption === "difficulty-easy-hard" && "Difficulty: Easy → Hard"}
              {sortOption === "difficulty-hard-easy" && "Difficulty: Hard → Easy"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
            <DropdownMenuItem
              onClick={() => onSortOptionChange("alphabetical-az")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              A-Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortOptionChange("alphabetical-za")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              Z-A
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortOptionChange("difficulty-easy-hard")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              Difficulty: Easy → Hard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortOptionChange("difficulty-hard-easy")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              Difficulty: Hard → Easy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Difficulty Status</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-input hover:bg-secondary text-foreground hover:text-foreground border-border"
            >
              {getRatingFilterDisplay(ratingFilter)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
            <DropdownMenuItem
              onClick={() => onRatingFilterChange("all")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              All Difficulties
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRatingFilterChange("rated-only")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              All Rated
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRatingFilterChange("unrated-only")}
              className="cursor-pointer hover:bg-secondary text-popover-foreground"
            >
              Unrated
            </DropdownMenuItem>
            {DIFFICULTY_OPTIONS.filter((diff) => diff !== "unrated").map((difficulty) => (
              <DropdownMenuItem
                key={difficulty}
                onClick={() => onRatingFilterChange(difficulty as RatingFilter)}
                className="cursor-pointer hover:bg-secondary text-popover-foreground"
              >
                {toTitleCase(difficulty)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
