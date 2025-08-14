// src/components/character-management/CharacterFilters.tsx
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
  // New props for results count
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-white mb-6">Filters</h2>

      {/* Results Info - Moved here */}
      <div className="mb-6">
        <p className="text-gray-300 text-sm">
          Showing {filteredCount} of {totalCount} characters
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Search Characters</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type character name..."
        />
      </div>

      {/* Sort Options - Right after search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
        <select
          value={sortOption}
          onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="alphabetical-az" className="bg-white text-gray-800">
            A-Z
          </option>
          <option value="alphabetical-za" className="bg-white text-gray-800">
            Z-A
          </option>
          <option value="difficulty-easy-hard" className="bg-white text-gray-800">
            Difficulty: Easy → Hard
          </option>
          <option value="difficulty-hard-easy" className="bg-white text-gray-800">
            Difficulty: Hard → Easy
          </option>
        </select>
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Status</label>
        <select
          value={ratingFilter}
          onChange={(e) => onRatingFilterChange(e.target.value as RatingFilter)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all" className="bg-white text-gray-800">
            All Difficulties
          </option>
          <option value="rated-only" className="bg-white text-gray-800">
            All Rated
          </option>
          <option value="unrated-only" className="bg-white text-gray-800">
            Unrated
          </option>
          <option value="very-easy" className="bg-white text-gray-800">
            Very Easy
          </option>
          <option value="easy" className="bg-white text-gray-800">
            Easy
          </option>
          <option value="medium" className="bg-white text-gray-800">
            Medium
          </option>
          <option value="hard" className="bg-white text-gray-800">
            Hard
          </option>
          <option value="really-hard" className="bg-white text-gray-800">
            Really Hard
          </option>
        </select>
      </div>

      {/* Ignore Filter - Button Group */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Ignore Status</label>
        <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => onIgnoreFilterChange("all")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "all" ? "bg-white/20 text-white" : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onIgnoreFilterChange("not-ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "not-ignored-only"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
            }`}
          >
            Not Ignored
          </button>
          <button
            onClick={() => onIgnoreFilterChange("ignored-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              ignoreFilter === "ignored-only"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
            }`}
          >
            Ignored
          </button>
        </div>
      </div>

      {/* Content Filter - Button Group */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
        <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => onContentFilterChange("all")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "all" ? "bg-white/20 text-white" : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onContentFilterChange("canon-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "canon-only"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
            }`}
          >
            Canon
          </button>
          <button
            onClick={() => onContentFilterChange("fillers-only")}
            className={`px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              contentFilter === "fillers-only"
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-gray-400 hover:bg-white/10"
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
            className={`w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 ${
              isNonTVContentDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <span className={`text-sm ${isNonTVContentDisabled ? "text-gray-400" : "text-gray-300"}`}>
            Include Non-TV Content
          </span>
        </label>
      </div>
    </div>
  );
};
