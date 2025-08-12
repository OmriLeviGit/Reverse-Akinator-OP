import React from "react";
import { Button } from "@/components/ui/button";

const ratingLabels = {
  "very-easy": "Very Easy",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  "really-hard": "Really Hard",
};

interface DifficultyRatingProps {
  currentRating: string; // Changed from number to string
  onRatingChange: (rating: string) => void; // Changed from number to string
}

export const DifficultyRating: React.FC<DifficultyRatingProps> = ({ currentRating, onRatingChange }) => {
  const handleRatingClick = (rating: string) => {
    if (currentRating === rating) {
      onRatingChange(""); // Clear rating with empty string instead of 0
    } else {
      onRatingChange(rating);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Object.entries(ratingLabels).map(([rating, label]) => (
        <Button
          key={rating}
          onClick={() => handleRatingClick(rating)}
          variant={currentRating === rating ? "default" : "outline"}
          size="sm"
          className={
            currentRating === rating
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1"
              : "bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs px-2 py-1"
          }
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
