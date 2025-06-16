import React from "react";
import { Button } from "@/components/ui/button";

interface StartButtonProps {
  onStart: () => void;
  disabled?: boolean;
}

const StartButton: React.FC<StartButtonProps> = ({ onStart, disabled = false }) => {
  return (
    <Button
      onClick={onStart}
      disabled={disabled}
      className={`py-4 px-8 text-xl font-bold transition-all duration-100 transform border-2 border-none ship-shadow rounded-xl ${
        disabled ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-orange-400 hover:bg-orange-500 text-white hover:scale-105"
      }`}
    >
      {disabled ? "⏳ LOADING..." : "⚓ START ADVENTURE ⚓"}
    </Button>
  );
};

export default StartButton;
