// src/components/game/ChatArea.tsx - Updated to accept props instead of using hooks
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";
import { Message } from "../../hooks/useGameChat";

interface ChatAreaProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isProcessingChat: boolean;
  isProcessingGuess: boolean;
  handleSendMessage: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  inputMessage,
  setInputMessage,
  isProcessingChat,
  isProcessingGuess,
  handleSendMessage,
  textareaRef,
  messagesEndRef,
}) => {
  return (
    <Card className="flex-1 flex flex-col border-border/40 shadow-sm overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                  message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            </div>
          ))}
          {(isProcessingChat || isProcessingGuess) && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-3 sm:px-4 py-2">
                <div className="flex items-center justify-center space-x-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                    style={{ animationDelay: "0s", animationDuration: "1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s", animationDuration: "1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s", animationDuration: "1s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-border/40 flex-shrink-0">
        <div className="flex space-x-2 items-center">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                }
              }, 0);
            }}
            placeholder="Ask a question about the character..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none overflow-y-auto text-sm sm:text-base"
            style={{ fontSize: "16px" }}
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessingChat || !inputMessage.trim()}
            size="sm"
            className="w-[35px] h-[35px] p-0 flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
