import React from "react";
import { Button } from "@/components/ui/button";
import { ContentFilter } from "../../types/characterFilters";

interface ContentFilterButtonProps {
  contentFilter: ContentFilter;
  onCycle: () => void;
}

const getContentFilterLabel = (filter: ContentFilter) => {
  switch (filter) {
    case "all":
      return "All";
    case "canon-only":
      return "Canon Only";
    case "fillers-only":
      return "Fillers Only";
  }
};

export const ContentFilterButton: React.FC<ContentFilterButtonProps> = ({ contentFilter, onCycle }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="text-foreground text-base font-bold">Canon/Filler</label>
      <Button
        onClick={onCycle}
        className="w-40 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-border/80 transition-all duration-200"
      >
        {getContentFilterLabel(contentFilter)}
      </Button>
    </div>
  );
};
