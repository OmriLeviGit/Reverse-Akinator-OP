import React, { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Arc {
  name: string;
  chapter: number;
  episode: number;
}

interface ArcSelectionProps {
  selectedArc: string;
  setSelectedArc: (arc: string) => void;
  availableArcs: any[];
  sessionDataLoaded?: boolean; // Add this prop
}
const ArcSelection: React.FC<ArcSelectionProps> = ({ selectedArc, setSelectedArc, availableArcs }) => {
  // Transform the availableArcs data to match your Arc interface
  const arcs: Arc[] = (availableArcs || [])
    .map(
      (arc): Arc => ({
        name: arc.name || arc,
        episode: arc.episode || 0,
        chapter: arc.chapter || 0,
      })
    )
    .reverse();

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-white drop-shadow-lg">Last Arc</h3>
      <Select value={selectedArc} onValueChange={setSelectedArc}>
        <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-2 border-blue-300 hover:border-blue-400 transition-colors duration-200 text-slate-800 font-medium">
          <SelectValue placeholder="Select arc..." />
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-sm border-2 border-blue-300 max-h-60 z-50">
          {/** "All" option with same grid but empty cells **/}
          <SelectItem value="All" className="text-slate-800 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer">
            <div className="grid grid-cols-[390px_80px_70px] w-full font-mono text-sm">
              <span className="text-left truncate mr-2 font-bold">All Arcs</span>
              <span className="justify-self-start"></span>
              <span className="justify-self-start"></span>
            </div>
          </SelectItem>
          {/** Regular arc options **/}
          {arcs.map((arc) => (
            <SelectItem key={arc.name} value={arc.name} className="text-slate-800 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer">
              <div className="grid grid-cols-[390px_80px_70px] w-full font-mono text-sm">
                <span className="text-left truncate mr-2">{arc.name}</span>
                <span className="justify-self-start">{arc.episode > 0 ? `Ep.${arc.episode}` : ""}</span>
                <span className="justify-self-start">{arc.chapter > 0 ? `Ch.${arc.chapter}` : ""}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ArcSelection;
