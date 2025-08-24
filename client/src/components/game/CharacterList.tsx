import React from "react";
import { Character } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CharacterListItem } from "./CharacterListItem.tsx";

interface CharacterListProps {
  characters: Character[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCharacterSelect: (characterName: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  isLoading,
  searchTerm,
  onSearchChange,
  onCharacterSelect,
}) => {
  return (
    <>
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Select Character</h3>
        <Input
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm"
        />
      </div>
      {/* Scrollable Character List */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Loading characters...</p>
            </div>
          ) : characters.length > 0 ? (
            characters.map((character, index) => (
              <CharacterListItem key={character.id || index} character={character} onSelect={onCharacterSelect} />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No characters found</p>
          )}
        </div>
      </ScrollArea>
    </>
  );
};
