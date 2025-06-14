
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GameInputProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

const GameInput: React.FC<GameInputProps> = ({
  inputMessage,
  onInputChange,
  onSendMessage
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 ship-shadow border border-white/20">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type your message or guess..."
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
        />
        <Button
          onClick={onSendMessage}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default GameInput;
