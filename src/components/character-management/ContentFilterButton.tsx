
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
    <div className="space-y-2">
      <label className="text-white/90 text-sm font-medium">Content Type</label>
      <Button
        onClick={onCycle}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
      >
        {getContentFilterLabel(contentFilter)}
      </Button>
      {showNonTVCheckbox && (
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="include-non-tv"
            checked={includeNonTVContent}
            onCheckedChange={onNonTVContentChange}
            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
          />
          <label htmlFor="include-non-tv" className="text-white/80 text-sm">
            Include Non-TV Content
          </label>
        </div>
      )}
    </div>
  );
};
