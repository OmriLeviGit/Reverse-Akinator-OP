
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
    <div className="flex flex-col items-center space-y-2">
      <label className="text-white/90 text-base font-bold">Difficulty Status</label>
      <Button
        onClick={onCycle}
        className="w-40 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-200"
      >
        {getRatingFilterLabel(ratingFilter)}
      </Button>
    </div>
  );
};
