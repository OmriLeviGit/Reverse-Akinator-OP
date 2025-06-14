
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
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Checkbox
            id="non-tv-fillers"
            checked={includeNonTVFillers}
            onCheckedChange={onIncludeNonTVFillersChange}
            disabled={fillerPercentage === 0}
            className={`justify-self-center self-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-white/50 ${
              fillerPercentage === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <label 
            htmlFor="non-tv-fillers" 
            className={`text-white font-medium cursor-pointer self-center ${
              fillerPercentage === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Include Non-TV Show Fillers
          </label>
          <div className="self-center"></div>
          <p className={`text-sm text-blue-100 self-center ${
            fillerPercentage === 0 ? 'opacity-50' : ''
          }`}>
            Characters from movies, games, and other non-TV content
          </p>
        </div>
      </div>
    </div>
  );
};

export default FillerSettings;
