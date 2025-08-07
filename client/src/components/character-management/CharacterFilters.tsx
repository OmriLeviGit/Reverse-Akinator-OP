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
          <option value="alphabetical-az" className="bg-white text-gray-800">A-Z</option>
          <option value="alphabetical-za" className="bg-white text-gray-800">Z-A</option>
          <option value="difficulty-easy-hard" className="bg-white text-gray-800">Difficulty: Easy → Hard</option>
          <option value="difficulty-hard-easy" className="bg-white text-gray-800">Difficulty: Hard → Easy</option>
        </select>
      </div>

      {/* Ignore Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Ignore Status</label>
        <select
          value={ignoreFilter}
          onChange={(e) => onIgnoreFilterChange(e.target.value as IgnoreFilter)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all" className="bg-white text-gray-800">All Characters</option>
          <option value="not-ignored-only" className="bg-white text-gray-800">Not Ignored Only</option>
          <option value="ignored-only" className="bg-white text-gray-800">Ignored Only</option>
        </select>
      </div>

      {/* Content Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
        <select
          value={contentFilter}
          onChange={(e) => onContentFilterChange(e.target.value as ContentFilter)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all" className="bg-white text-gray-800">All Content</option>
          <option value="canon-only" className="bg-white text-gray-800">Canon Only</option>
          <option value="fillers-only" className="bg-white text-gray-800">Fillers Only</option>
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
          <option value="all" className="bg-white text-gray-800">All Difficulties</option>
          <option value="rated-only" className="bg-white text-gray-800">Rated Only</option>
          <option value="unrated-only" className="bg-white text-gray-800">Unrated Only</option>
        </select>
      </div>

      {/* Non-TV Content */}
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={includeNonTVContent}
            onChange={(e) => onIncludeNonTVContentChange(e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Include Non-TV Content</span>
        </label>
      </div>
    </div>
  );
};