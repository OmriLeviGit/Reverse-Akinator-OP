
import React from 'react';
import MessageBubble from '../MessageBubble';
import { Message } from '../../hooks/useGameMessages';

interface MessageAreaProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 ship-shadow border border-white/20 h-64 overflow-hidden">
      <div className="h-full overflow-y-auto scrollbar-none">
        <div ref={messagesEndRef} />
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageArea;
