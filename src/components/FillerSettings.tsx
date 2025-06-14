
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface FillerSettingsProps {
  fillerPercentage: number;
  onFillerPercentageChange: (value: number[]) => void;
  includeNonTVFillers: boolean;
  onIncludeNonTVFillersChange: (checked: boolean) => void;
}

const FillerSettings: React.FC<FillerSettingsProps> = ({
  fillerPercentage,
  onFillerPercentageChange,
  includeNonTVFillers,
  onIncludeNonTVFillersChange
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white drop-shadow-lg">
          Filler percentage: {fillerPercentage}%
        </h3>
        <div className="px-2">
          <Slider
            value={[fillerPercentage]}
            onValueChange={onFillerPercentageChange}
            max={100}
            min={0}
            step={1}
            className="w-full [&_.slider-track]:bg-white [&_.slider-range]:bg-green-400 [&_.slider-thumb]:border-green-400"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="non-tv-fillers"
            checked={includeNonTVFillers}
            onCheckedChange={onIncludeNonTVFillersChange}
            disabled={fillerPercentage === 0}
            className={`data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-white/50 ${
              fillerPercentage === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <div className="flex-1">
            <label 
              htmlFor="non-tv-fillers" 
              className={`text-white font-medium cursor-pointer block ${
                fillerPercentage === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Include Non-TV Show Fillers
            </label>
            <p className={`text-sm text-blue-100 mt-1 ${
              fillerPercentage === 0 ? 'opacity-50' : ''
            }`}>
              Include characters from movies, games, and other non-TV content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillerSettings;
