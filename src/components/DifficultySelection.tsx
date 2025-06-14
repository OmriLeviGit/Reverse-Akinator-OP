
import React from 'react';
import { Button } from "@/components/ui/button";

interface DifficultySelectionProps {
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
}

const DifficultySelection: React.FC<DifficultySelectionProps> = ({
  selectedDifficulty,
  onDifficultyChange
}) => {
  const difficulties = [
    { id: 'easy', label: 'Easy', description: 'Characters rated 1-2' },
    { id: 'medium', label: 'Medium', description: 'Characters rated 2-4' },
    { id: 'hard', label: 'Hard', description: 'Characters rated 3-5' },
    { id: 'not-rated', label: 'Not Yet Rated', description: 'Unrated characters only' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Difficulty Level</h3>
        <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {difficulties.map((difficulty) => (
          <Button
            key={difficulty.id}
            onClick={() => onDifficultyChange(difficulty.id)}
            variant={selectedDifficulty === difficulty.id ? "default" : "outline"}
            className={`p-4 h-auto flex flex-col items-center text-center transition-all duration-200 ease-in-out ${
              selectedDifficulty === difficulty.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg'
                : 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/40'
            }`}
          >
            <span className="font-semibold">{difficulty.label}</span>
            <span className="text-xs opacity-80 mt-1">{difficulty.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelection;
