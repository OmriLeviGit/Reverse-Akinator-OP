
import React from 'react';
import { Button } from "@/components/ui/button";
import { RatingFilter } from '../../types/characterManagement';

interface RatingFilterButtonProps {
  ratingFilter: RatingFilter;
  onCycle: () => void;
}

const getRatingFilterLabel = (filter: RatingFilter) => {
  switch (filter) {
    case 'rated-only': return 'Rated Only';
    case 'unrated-only': return 'Unrated Only';
    case 'show-both': return 'Show Both';
  }
};

export const RatingFilterButton: React.FC<RatingFilterButtonProps> = ({
  ratingFilter,
  onCycle
}) => {
  return (
    <div className="space-y-2">
      <label className="text-white/90 text-sm font-medium">Rating Status</label>
      <Button
        onClick={onCycle}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
      >
        {getRatingFilterLabel(ratingFilter)}
      </Button>
    </div>
  );
};
