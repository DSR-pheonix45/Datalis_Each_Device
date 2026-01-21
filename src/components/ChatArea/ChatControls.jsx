import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import {
  BsPaperclip,
  BsChevronDown,
  BsSend,
  BsFolder2,
  BsFileEarmarkText,
} from "react-icons/bs";
import { useActiveWorkbench } from "../../context/ActiveWorkbenchContext";
import { supabase } from "../../lib/supabase";

const ChatControls = ({
  inputMessage,
  setInputMessage,
  datalisList,
  agentItems,
  onMessageSent,
}) => {
  const { darkMode } = useTheme();
  const { activeWorkbench } = useActiveWorkbench();
  const [datalisDropdownOpen, setDatalistDropdownOpen] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [selectedDatalis, setSelectedDatalis] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const selectDatalis = (datalis, folder = null) => {
    setSelectedDatalis(datalis);
    setSelectedFolder(folder);
    setDatalistDropdownOpen(false);
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setAgentDropdownOpen(false);
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) {
      console.log("Cannot send message - no input");
      return;
    }

    // For testing purposes, if no active workbench, use a temporary one
    const currentWorkbench = activeWorkbench || {
      id: "test-workbench",
      name: "Test Workbench",
      type: "personal",
    };

    console.log("ChatControls: Submitting message:", inputMessage);
    console.log("ChatControls: Using workbench:", currentWorkbench);

    setIsLoading(true);
    try {
      console.log("Calling chat_query function...");
      const { data, error } = await supabase.functions.invoke("chat_query", {
        body: {
          query: inputMessage,
          workbench_id: currentWorkbench.id,
        },
      });

      console.log("Chat query response:", { data, error });

      if (error) {
        console.error("Chat query error:", error);
        throw error;
      }

      if (!data || !data.response) {
        console.error("No response from chat query:", data);
        throw new Error("No response from AI");
      }

      // Call the callback to add the message to the UI
      console.log("Calling onMessageSent with:", inputMessage, data.response);
      if (onMessageSent) {
        onMessageSent(inputMessage, data.response);
      }

      setInputMessage("");
      setAttachedFiles([]);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`p-4 border-t theme-transition ${
        darkMode ? "border-border-dark" : "border-border-light"
      }`}
    >
      <div className="flex gap-2 mb-4">
        {/* Select Datalis Dropdown */}
        <div className="relative">
          <button
            className={`flex items-center justify-between px-4 py-2 border rounded-md text-sm font-medium focus:outline-none transition-colors min-w-[200px]
              ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            onClick={() => setDatalistDropdownOpen(!datalisDropdownOpen)}
          >
            <span>
              {selectedFolder
                ? `${selectedDatalis.name} / ${selectedFolder.name}`
                : selectedDatalis
                ? selectedDatalis.name
                : "Select Datalis"}
            </span>
            <BsChevronDown className="ml-2" />
          </button>

          {datalisDropdownOpen && (
            <div
              className={`absolute z-10 mt-1 w-64 rounded-md shadow-lg theme-transition ${
                darkMode
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-200"
              } border`}
            >
              <div className="py-1">
                {datalisList.length > 0 ? (
                  datalisList.map((datalis) => (
                    <div key={datalis.id}>
                      <button
                        onClick={() => selectDatalis(datalis)}
                        className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                          darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <BsFolder2 className="mr-2" />
                        {datalis.name}
                      </button>
                      {datalis.folders &&
                        datalis.folders.map((folder, index) => (
                          <button
                            key={index}
                            onClick={() => selectDatalis(datalis, folder)}
                            className={`flex items-center w-full text-left px-6 py-1 text-sm ${
                              darkMode
                                ? "text-gray-400 hover:bg-gray-700"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <BsFolder2 className="mr-2" />
                            {folder.name}
                          </button>
                        ))}
                    </div>
                  ))
                ) : (
                  <div
                    className={`px-4 py-2 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No Datalis files created
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Select Agent Dropdown */}
        <div className="relative">
          <button
            className={`flex items-center justify-between px-4 py-2 border rounded-md text-sm font-medium focus:outline-none transition-colors min-w-[150px]
              ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
          >
            <span>{selectedAgent ? selectedAgent.name : "Select Agent"}</span>
            <BsChevronDown className="ml-2" />
          </button>

          {agentDropdownOpen && (
            <div
              className={`absolute z-10 mt-1 w-full rounded-md shadow-lg theme-transition ${
                darkMode
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-200"
              } border`}
            >
              <div className="py-1">
                {agentItems.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => selectAgent(agent)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="relative flex h-2 w-2 mr-2">
                        <span
                          className={`absolute inline-flex h-full w-full rounded-full ${
                            agent.status === "online"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        ></span>
                      </span>
                      {agent.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attach Files Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileAttachment}
          multiple
          accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none transition-colors
            ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
        >
          <BsPaperclip className="mr-2" />
          <span>Attach Files</span>
        </button>
      </div>

      {/* Attached Files List */}
      {attachedFiles.length > 0 && (
        <div className="mb-4">
          <div
            className={`p-2 rounded-md ${
              darkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center">
                  <BsFileEarmarkText className="mr-2" />
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className={`text-sm ${
                    darkMode ? "text-red-400" : "text-red-600"
                  } hover:text-red-700`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmitMessage} className="relative">
        {!activeWorkbench && (
          <div
            className={`mb-2 text-sm ${
              darkMode ? "text-yellow-400" : "text-yellow-600"
            }`}
          >
            💡 Tip: Click on a workbench in the sidebar first, or try sending a
            message to test the chat!
          </div>
        )}
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            activeWorkbench
              ? "Type your message here..."
              : "Select a workbench first or just type a message to test..."
          }
          disabled={isLoading}
          className={`w-full p-3 pr-12 border rounded-md resize-none focus:outline-none focus:ring-2 theme-transition
            ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-gray-300 focus:ring-primary-dark"
                : "bg-white border-gray-300 text-gray-700 focus:ring-primary-light"
            }`}
          rows="2"
        ></textarea>

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className={`absolute right-3 bottom-3 p-2 rounded-md transition-colors focus:outline-none
            ${
              darkMode
                ? "bg-gray-700 text-primary-dark hover:bg-gray-600"
                : "bg-gray-100 text-primary-light hover:bg-gray-200"
            } ${
            !inputMessage.trim() || isLoading
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          ) : (
            <BsSend />
          )}
        </button>

        <p
          className={`mt-2 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {activeWorkbench
            ? "Press Enter to send, Shift+Enter for a new line"
            : "Select a workbench or just type a message to test the chat!"}
        </p>
      </form>
    </div>
  );
};

export default ChatControls;
