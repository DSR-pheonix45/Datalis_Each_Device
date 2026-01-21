import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "../ChatInput/ChatInput";
import { messages } from "../../data/messageData";
import { agentItems } from "../../data/sidebarData";
import { supabase } from "../../lib/supabase";
import { useWorkbenchContext } from "../../hooks/useWorkbenchContext";

const ChatArea = ({
  messages: propMessages,
  onSendMessage,
  workbenchContext: propWorkbenchContext,
  uploadedFiles,
  datalisList,
}) => {
  const { darkMode } = useTheme();
  const { context: workbenchContext, isLoading: isWorkbenchLoading } = useWorkbenchContext();
  const activeWorkbenchContext = workbenchContext || propWorkbenchContext;

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

  // Add workbench context to messages if available
  const messagesWithContext = useMemo(() => {
    if (!activeWorkbenchContext?.llmContext) return chatMessages;
    
    // Add workbench context as a system message if not already present
    const hasWorkbenchContext = chatMessages.some(
      msg => msg.role === 'system' && msg.content.includes('Workbench:')
    );
    
    if (!hasWorkbenchContext) {
      return [
        {
          id: 'workbench-context',
          role: 'system',
          content: activeWorkbenchContext.llmContext,
          isSystem: true,
          timestamp: new Date().toISOString()
        },
        ...chatMessages
      ];
    }
    
    return chatMessages;
  }, [chatMessages, activeWorkbenchContext]);

  if (isWorkbenchLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent">
      <ChatHeader workbench={activeWorkbenchContext?.workbench} />

      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList messages={messagesWithContext} />
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        workbenchContext={activeWorkbenchContext}
        uploadedFiles={uploadedFiles}
        placeholder="Ask Dabby Consultant anything..."
      />
    </div>
  );
};

export default ChatArea;
