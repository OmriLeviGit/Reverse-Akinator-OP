
import React from 'react';
import { IgnoreFilterButton } from './IgnoreFilterButton';
import { ContentFilterButton } from './ContentFilterButton';
import { RatingFilterButton } from './RatingFilterButton';
import { SearchAndSort } from './SearchAndSort';
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from '../../types/characterManagement';

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
  onSortChange
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 ship-shadow border border-white/20">
      {/* Top Row: Triple Toggle Filters with reduced spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-4">
        <IgnoreFilterButton
          ignoreFilter={ignoreFilter}
          onCycle={onIgnoreFilterCycle}
        />

        <ContentFilterButton
          contentFilter={contentFilter}
          includeNonTVContent={includeNonTVContent}
          onCycle={onContentFilterCycle}
          onNonTVContentChange={onNonTVContentChange}
        />

        <RatingFilterButton
          ratingFilter={ratingFilter}
          onCycle={onRatingFilterCycle}
        />
      </div>

      {/* Bottom Row: Search and Sort */}
      <SearchAndSort
        searchTerm={searchTerm}
        sortOption={sortOption}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
      />
    </div>
  );
};
