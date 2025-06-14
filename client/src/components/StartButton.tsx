import React from "react";
import { Button } from "@/components/ui/button";

interface StartButtonProps {
  onStart: () => void;
}

const StartButton: React.FC<StartButtonProps> = ({ onStart }) => {
  return (
    <Button
      onClick={onStart}
      className="py-4 px-8 text-xl font-bold bg-orange-400 hover:bg-orange-500 text-white border-2 border-none transition-all duration-100 transform hover:scale-105 ship-shadow rounded-xl"
    >
      ⚓ START ADVENTURE ⚓
    </Button>
  );
};

export default StartButton;
