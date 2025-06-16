import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ArcSelectionProps {
  selectedArc: string;
  onArcChange: (value: string) => void;
}

const ArcSelection: React.FC<ArcSelectionProps> = ({ selectedArc, onArcChange }) => {
  const arcs = [
    { value: "all", label: "All characters" },
    { value: "1057", label: "1057 - Wano Country" },
    { value: "908", label: "908 - Reverie" },
    { value: "902", label: "902 - Whole Cake Island" },
    { value: "824", label: "824 - Zou" },
    { value: "801", label: "801 - Dressrosa" },
    { value: "699", label: "699 - Punk Hazard" },
    { value: "653", label: "653 - Fish-Man Island" },
    { value: "602", label: "602 - Return to Sabaody" },
    { value: "597", label: "597 - Post-War" },
    { value: "580", label: "580 - Marineford" },
    { value: "549", label: "549 - Impel Down" },
    { value: "524", label: "524 - Amazon Lily" },
    { value: "513", label: "513 - Sabaody Archipelago" },
    { value: "489", label: "489 - Thriller Bark" },
    { value: "441", label: "441 - Post-Enies Lobby" },
    { value: "430", label: "430 - Enies Lobby" },
    { value: "321", label: "321 - Water 7" },
    { value: "302", label: "302 - Skypiea" },
    { value: "236", label: "236 - Jaya" },
    { value: "217", label: "217 - Arabasta" },
    { value: "154", label: "154 - Drum Island" },
    { value: "129", label: "129 - Little Garden" },
    { value: "114", label: "114 - Whisky Peak" },
    { value: "105", label: "105 - Arabasta" },
    { value: "100", label: "100 - Loguetown" },
    { value: "95", label: "95 - Arlong Park" },
    { value: "68", label: "68 - Baratie" },
    { value: "41", label: "41 - Syrup Village" },
    { value: "21", label: "21 - Orange Town" },
    { value: "7", label: "7 - East Blue" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-white drop-shadow-lg">Last Arc</h3>
      <Select value={selectedArc} onValueChange={onArcChange}>
        <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-2 border-blue-300 hover:border-blue-400 transition-colors duration-200 text-slate-800 font-medium">
          <SelectValue placeholder="Select arc..." />
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-sm border-2 border-blue-300 max-h-60 z-50">
          {arcs.map((arc) => (
            <SelectItem key={arc.value} value={arc.value} className="text-slate-800 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer">
              {arc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ArcSelection;
