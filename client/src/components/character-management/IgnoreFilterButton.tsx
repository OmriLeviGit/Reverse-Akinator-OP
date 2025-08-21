import React from "react";
import { Button } from "@/components/ui/button";
import { IgnoreFilter } from "../../types/characterFilters";

interface IgnoreFilterButtonProps {
  ignoreFilter: IgnoreFilter;
  onCycle: () => void;
}

const getIgnoreFilterLabel = (filter: IgnoreFilter) => {
  switch (filter) {
    case "ignored-only":
      return "Ignored Only";
    case "not-ignored-only":
      return "Not Ignored Only";
    case "all":
      return "All";
  }
};

export const IgnoreFilterButton: React.FC<IgnoreFilterButtonProps> = ({ ignoreFilter, onCycle }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="text-foreground text-base font-bold">Ignore Status</label>
      <Button
        onClick={onCycle}
        className="w-40 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-border/80 transition-all duration-200"
      >
        {getIgnoreFilterLabel(ignoreFilter)}
      </Button>
    </div>
  );
};
