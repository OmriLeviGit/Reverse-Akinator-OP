import React from "react";
import { Button } from "@/components/ui/button";

interface StartButtonProps {
  onStart: () => void;
}

const StartButton: React.FC<StartButtonProps> = ({ onStart }) => {
  return (
    <Button
      onClick={onStart}
      className="w-full max-w-md mx-auto py-4 px-8 text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-yellow-600 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 ship-shadow rounded-xl"
    >
      ⚓ START ADVENTURE ⚓
    </Button>
  );
};

export default StartButton;
