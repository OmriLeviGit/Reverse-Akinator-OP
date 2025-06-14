
import React from 'react';
import { Button } from "@/components/ui/button";

interface GameActionsProps {
  onHint: () => void;
  onMakeGuess: () => void;
  onRevealCharacter: () => void;
}

const GameActions: React.FC<GameActionsProps> = ({
  onHint,
  onMakeGuess,
  onRevealCharacter
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Button
        onClick={onHint}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-3"
      >
        Get Hint
      </Button>
      <Button
        onClick={onMakeGuess}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3"
      >
        Make Guess
      </Button>
      <Button
        onClick={onRevealCharacter}
        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3"
      >
        Reveal Character
      </Button>
    </div>
  );
};

export default GameActions;
