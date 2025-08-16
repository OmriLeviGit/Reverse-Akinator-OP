import React from "react";
import { Button } from "@/components/ui/button";
import { RatingFilter } from "../../types/characterManagement";

interface RatingFilterButtonProps {
  ratingFilter: RatingFilter;
  onCycle: () => void;
}

const getRatingFilterLabel = (filter: RatingFilter) => {
  switch (filter) {
    case "rated-only":
      return "Rated Only";
    case "unrated-only":
      return "Unrated Only";
    case "all":
      return "All";
  }
};

export const RatingFilterButton: React.FC<RatingFilterButtonProps> = ({ ratingFilter, onCycle }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="text-foreground text-base font-bold">Difficulty Status</label>
      <Button
        onClick={onCycle}
        className="w-40 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-border/80 transition-all duration-200"
      >
        {getRatingFilterLabel(ratingFilter)}
      </Button>
    </div>
  );
};
