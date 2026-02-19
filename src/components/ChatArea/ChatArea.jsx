import React, { useMemo, useState, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "../ChatInput/ChatInput";
import { rlService } from "../../services/ReinforcementLearningService";

const ChatArea = ({
  messages: propMessages,
  onSendMessage,
  uploadedFiles,
  workbenchContext,
  availableWorkbenches,
  onToggleWorkbenchContext,
  userId
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // [RL] Evaluate Session on Message Update
  useEffect(() => {
    if (propMessages && propMessages.length > 0) {
      rlService.evaluateSession(userId, propMessages);
    }
  }, [propMessages, userId]);

  // Map MainApp messages to ChatArea format (preserve role property)
  const chatMessages = useMemo(() => {
    return propMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      sender: msg.role === "user" ? "You" : msg.sender || "Dabby Consultant",
      avatar: msg.role === "user" ? "U" : "DC",
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      isUser: msg.role === "user",
    }));
  }, [propMessages]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent">
      <ChatHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList 
          messages={chatMessages} 
          searchQuery={searchQuery}
        />
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        uploadedFiles={uploadedFiles}
        placeholder="Ask Dabby Consultant anything..."
        workbenchContext={workbenchContext}
        availableWorkbenches={availableWorkbenches}
        onToggleWorkbenchContext={onToggleWorkbenchContext}
      />
    </div>
  );
};

export default ChatArea;
