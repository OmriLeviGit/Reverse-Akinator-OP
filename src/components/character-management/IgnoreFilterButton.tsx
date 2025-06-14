
import React from 'react';
import { Button } from "@/components/ui/button";
import { IgnoreFilter } from '../../types/characterManagement';

interface IgnoreFilterButtonProps {
  ignoreFilter: IgnoreFilter;
  onCycle: () => void;
}

const getIgnoreFilterLabel = (filter: IgnoreFilter) => {
  switch (filter) {
    case 'ignored-only': return 'Ignored Only';
    case 'not-ignored-only': return 'Not Ignored Only';
    case 'show-both': return 'Show Both';
  }
};

const getIgnoreFilterStyles = (filter: IgnoreFilter) => {
  switch (filter) {
    case 'ignored-only':
      return 'bg-orange-500/20 hover:bg-orange-500/30 text-white border border-orange-400/40 hover:border-orange-400/60';
    case 'not-ignored-only':
    case 'show-both':
    default:
      return 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40';
  }
};

export const IgnoreFilterButton: React.FC<IgnoreFilterButtonProps> = ({
  ignoreFilter,
  onCycle
}) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="text-white/90 text-base font-bold">Ignore Status</label>
      <Button
        onClick={onCycle}
        className={`w-40 transition-all duration-200 ${getIgnoreFilterStyles(ignoreFilter)}`}
      >
        {getIgnoreFilterLabel(ignoreFilter)}
      </Button>
    </div>
  );
};
