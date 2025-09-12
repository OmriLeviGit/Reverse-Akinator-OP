import React from "react";
import { BasicCharacter } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { CharacterListItem } from "./CharacterListItem.tsx";

interface CharacterListProps {
  characters: BasicCharacter[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCharacterSelect: (characterName: string) => void;
  totalCharacters: number;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  isLoading,
  searchTerm,
  onSearchChange,
  onCharacterSelect,
  totalCharacters,
}) => {
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Search Header */}
        <div className="p-3 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Select Character</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tip: Use '/' prefix to search character affiliations (e.g., /straw hats)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              {characters.length} of {totalCharacters} viable characters
            </p>
          </div>
          <Input
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-sm"
          />
        </div>
        {/* Scrollable Character List */}
        <ScrollArea className="flex-1 p-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Loading characters...</p>
            </div>
          ) : characters.length > 0 ? (
            <div className="grid grid-cols-5 gap-1 justify-items-center">
              {characters.map((character, index) => (
                <CharacterListItem key={character.id || index} character={character} onSelect={onCharacterSelect} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No characters found</p>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
