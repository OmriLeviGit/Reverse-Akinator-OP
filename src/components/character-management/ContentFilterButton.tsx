
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContentFilter } from '../../types/characterManagement';

interface ContentFilterButtonProps {
  contentFilter: ContentFilter;
  includeNonTVContent: boolean;
  onCycle: () => void;
  onNonTVContentChange: (checked: boolean | "indeterminate") => void;
}

const getContentFilterLabel = (filter: ContentFilter) => {
  switch (filter) {
    case 'canon-only': return 'Canon Only';
    case 'canon-and-fillers': return 'Canon + Fillers';
    case 'fillers-only': return 'Fillers Only';
  }
};

export const ContentFilterButton: React.FC<ContentFilterButtonProps> = ({
  contentFilter,
  includeNonTVContent,
  onCycle,
  onNonTVContentChange
}) => {
  const showNonTVCheckbox = contentFilter === 'canon-and-fillers' || contentFilter === 'fillers-only';

  return (
    <div className="space-y-3 text-center">
      <label className="text-white/90 text-sm font-bold">Content Type</label>
      <Button
        onClick={onCycle}
        className="w-full max-w-48 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-200"
      >
        {getContentFilterLabel(contentFilter)}
      </Button>
      {showNonTVCheckbox && (
        <div className="flex items-center gap-2 mt-2 justify-center">
          <Checkbox
            id="include-non-tv"
            checked={includeNonTVContent}
            onCheckedChange={onNonTVContentChange}
            className="data-[state=checked]:bg-white/30 data-[state=checked]:border-white/40"
          />
          <label htmlFor="include-non-tv" className="text-white/80 text-sm">
            Include Non-TV Content
          </label>
        </div>
      )}
    </div>
  );
};
