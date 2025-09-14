// src/components/game/CharacterSidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CharacterList } from "./CharacterList";
import { useCharacterSearch } from "../../hooks/useCharacterSearch";
import { useGameSession } from "../../hooks/useGameSession";
import { BasicCharacter } from "../../types";

interface CharacterSidebarProps {
  gameCharacters: BasicCharacter[];
  onCharacterSelect: (characterName: string) => void;
}

export const CharacterSidebar = ({ gameCharacters, onCharacterSelect }: CharacterSidebarProps) => {
  const navigate = useNavigate();
  const { revealCharacter } = useGameSession();
  const [characterSearchTerm, setCharacterSearchTerm] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const filteredCharacters = useCharacterSearch({
    characters: gameCharacters,
    searchTerm: characterSearchTerm,
  });

  const handleRevealCharacter = async () => {
    try {
      const result = await revealCharacter();

      if (!result) {
        return; // Session invalid, handled by useGameSession
      }

      console.log("✅ Character revealed:", result);
      navigate("/reveal", {
        state: result,
      });
    } catch (error) {
      console.error("❌ Failed to reveal character:", error);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Character List */}
      <Card className="h-[75%] flex flex-col border-border/40 shadow-sm min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <CharacterList
            characters={filteredCharacters}
            isLoading={false}
            searchTerm={characterSearchTerm}
            onSearchChange={setCharacterSearchTerm}
            onCharacterSelect={onCharacterSelect}
            totalCharacters={gameCharacters.length}
          />
        </div>

        <div className="p-3 sm:p-4 border-t border-border/40 flex-shrink-0 space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                Reveal Character
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Reveal Character?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reveal the mystery character? This will end the current game.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevealCharacter} className="w-full sm:w-auto">
                  Yes, Reveal Character
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Notes Section */}
      <Card className="h-[25%] p-0 border-border/40 shadow-lg bg-card/50 backdrop-blur-sm flex-shrink-0 overflow-hidden">
        <Textarea
          placeholder="Write down your thoughts, clues, or strategy..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-full resize-none border-0 bg-background/60 backdrop-blur-sm focus:bg-background/80 hover:bg-background/80 transition-all duration-300 placeholder:text-muted-foreground/60 rounded-lg"
          spellCheck={false}
        />
      </Card>
    </div>
  );
};
