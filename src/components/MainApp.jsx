import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import WelcomeSection from "./WelcomeSection/WelcomeSection";
import ActionCards from "./ActionCards/ActionCards";
import ChatInput from "./ChatInput/ChatInput";
import ChatArea from "./ChatArea/ChatArea";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Settings from "./Settings/Settings";
import OnboardingTour from "./Onboarding/OnboardingTour";
import FeedbackModal from "./ChatArea/FeedbackModal";
import { supabase } from "../lib/supabase";
import { BsRocketTakeoff } from "react-icons/bs";

export default function MainApp() {
  useTheme(); // Theme context is used for side effects
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentContext, setCurrentContext] = useState("");
  const [isInConversation, setIsInConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-show onboarding tour for new users who just completed the onboarding form
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("dabby_onboarding_completed");
    const justOnboarded = location.state?.fromOnboarding;
    
    // Only show the tour if they just finished the onboarding form 
    // OR if it's a first-time user on this device who hasn't seen it yet
    // BUT we check if they are actually a new user by looking at profile.onboarding_completed
    // Actually, if they just onboarded, they definitely should see it.
    if (justOnboarded || (!hasCompletedOnboarding && user?.id && profile?.onboarding_completed === false)) {
      const timer = setTimeout(() => {
        setShowTour(true);
        // Clear the state so it doesn't trigger again on refresh
        if (justOnboarded) {
          window.history.replaceState({}, document.title);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, location.state, profile?.onboarding_completed]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("dabby_onboarding_completed", "true");
  };

  // Fetch companies for the logged-in user
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        // Fetch companies where the user is a member
        const { data: memberData, error: memberError } = await supabase
          .from("company_members")
          .select(`
            company_id,
            company:companies (
              id,
              company_name,
              created_at
            )
          `)
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Error fetching companies:", memberError);
        } else {
          // Map to the expected format
          const formattedCompanies = (memberData || [])
            .filter((m) => m.company)
            .map((m) => ({
              company_id: m.company.id,
              company_name: m.company.company_name,
            }));
          setCompanies(formattedCompanies);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    // Listen for company creation events to refresh data
    const handleCompanyCreated = () => fetchUserData();

    window.addEventListener("companyCreated", handleCompanyCreated);

    return () => {
      window.removeEventListener("companyCreated", handleCompanyCreated);
    };
  }, [user?.id]);

  // Listen for clearChat event from sidebar
  useEffect(() => {
    const handleClearChat = () => {
      // Show feedback modal before clearing if there was a conversation
      if (messages.length > 0) {
        setIsFeedbackModalOpen(true);
      }
      setMessages([]);
      setUploadedFiles([]);
      setIsInConversation(false);
      setWebSearchEnabled(false);
      setCurrentContext("");
      setCurrentSessionId(null);
    };

    const handleLoadChatSession = (event) => {
      const { sessionId, messages: sessionMessages } = event.detail;
      setCurrentSessionId(sessionId);
      setMessages(sessionMessages);
      setIsInConversation(true);
    };

    window.addEventListener("clearChat", handleClearChat);
    window.addEventListener("loadChatSession", handleLoadChatSession);

    return () => {
      window.removeEventListener("clearChat", handleClearChat);
      window.removeEventListener("loadChatSession", handleLoadChatSession);
    };
  }, []);

  // Auto-save chat session and generate summary
  const saveChatSession = async (sessionMessages) => {
    // Don't store chat sessions if user hasn't completed onboarding (e.g. "Try Chat" users)
    if (!user?.id || sessionMessages.length < 2 || profile?.onboarding_completed === false) {
      if (profile?.onboarding_completed === false) {
        console.log("Chat session not saved: Onboarding incomplete");
      }
      return;
    }

    try {
      // Generate title from first user message
      const firstUserMessage = sessionMessages.find((m) => m.role === "user");
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) +
        (firstUserMessage.content.length > 50 ? "..." : "")
        : "Untitled Chat";

      // Create or update session
      let sessionId = currentSessionId;

      if (!sessionId) {
        // Create new session
        const sessionData = {
          user_id: user.id,
          title,
          company_id: companies[0]?.id || null,
          last_message_at: new Date().toISOString(),
        };
        console.log("Inserting new session with user.id:", user.id);
        console.log("Session data:", sessionData);
        const { data, error } = await supabase
          .from("sessions")
          .insert(sessionData)
          .select()
          .single();

        if (error) throw error;
        sessionId = data.id;
        setCurrentSessionId(sessionId);
      } else {
        // Update existing session
        await supabase
          .from("sessions")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      // Save the latest message
      const latestMessage = sessionMessages[sessionMessages.length - 1];
      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: latestMessage.role,
        content: latestMessage.content,
        metadata: {
          timestamp: latestMessage.timestamp,
          sender: latestMessage.sender,
          files: latestMessage.options?.uploadedFiles?.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type
          })) || [],
        },
      });

      console.log("Chat session saved:", sessionId);

      // Trigger sidebar refresh
      window.dispatchEvent(new Event("chatHistoryUpdated"));
    } catch (error) {
      console.error("Error saving chat session:", error);
    }
  };

  const handleSendMessage = async (
    message,
    options = {},
    isAIResponse = false
  ) => {
    // If this is an AI response, add it to the conversation
    if (isAIResponse && options.response) {
      const aiResponse = {
        id: Date.now() + 1,
        content: options.response,
        role: "assistant",
        sender: "Dabby Consultant",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      return;
    }

    // Handle empty message with files
    let displayMessage = message;
    let llmQuery = message;
    const hasFiles = options.uploadedFiles && options.uploadedFiles.length > 0;

    if (!message.trim() && hasFiles) {
      const fileCount = options.uploadedFiles.length;
      const fileNames = options.uploadedFiles.map(f => f.name).join(", ");
      displayMessage = `Attached ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames}`;
      llmQuery = `I have uploaded these files: ${fileNames}. Please acknowledge receipt and ask how you can help. Do not analyze them yet.`;
    } else if (!message.trim() && !hasFiles) {
      // Should not happen due to disabled button, but safe guard
      return;
    }

    // This is a user message, add it to conversation
    const newMessage = {
      id: Date.now(),
      content: displayMessage,
      role: "user",
      options,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsInConversation(true); // Switch to conversation mode

    // If there are uploaded files, show loading message
    let loadingId = null;

    if (hasFiles) {
      const fileNames = options.uploadedFiles.map((f) => f.name).join(", ");
      const loadingMsg = message.trim()
        ? `Analyzing files: ${fileNames}...`
        : `Uploading files: ${fileNames}...`;

      const loading = {
        id: Date.now() + 2,
        content: loadingMsg,
        role: "assistant",
        sender: "Dabby Consultant",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, loading]);
      setIsLoading(true);
      setLoadingMessage(loadingMsg);
      loadingId = loading.id;
    }

    // Always call AI function (ChatInput handles this now)
    try {
      const { callLLMWithFallback } = await import("../services/llmService.js");

      const llmResponse = await callLLMWithFallback({
        query: llmQuery, // Use the processed query
        context: currentContext, // Pass current context
        web_search: options.web || false,
        uploaded_files: options.uploadedFiles || [], // Pass File objects for frontend processing
        history: messages,
      });

      if (llmResponse.error) {
        throw new Error(llmResponse.error);
      }

      // Update current context if new files were processed (uploaded)
      if (
        llmResponse.context &&
        (options.uploadedFiles && options.uploadedFiles.length > 0)
      ) {
        setCurrentContext(llmResponse.context);
      }

      // Remove loading message and add AI response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: Date.now() + 1,
            content: llmResponse.response,
            role: "assistant",
            sender: "Dabby Consultant",
            timestamp: new Date().toISOString(),
          })
      );
      setIsLoading(false);
      setLoadingMessage("");

      // Auto-save chat session after AI responds
      const updatedMessages = messages.concat(newMessage, {
        id: Date.now() + 1,
        content: llmResponse.response,
        role: "assistant",
        sender: "Dabby Consultant",
        timestamp: new Date().toISOString(),
      });
      await saveChatSession(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove loading and add error response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingId)
          .concat({
            id: Date.now() + 1,
            content: "Sorry, I encountered an error. Please try again.",
            role: "assistant",
            sender: "Dabby Consultant",
            timestamp: new Date().toISOString(),
          })
      );
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleQuestionCardClick = (question) => {
    if (chatInputRef.current) {
      chatInputRef.current.setMessage(question);
      // Always auto-send the message when clicking a suggestion card
      setTimeout(() => {
        chatInputRef.current.sendMessage(question);
      }, 100);
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] text-white font-dm-sans relative">
      {/* Database Setup Banner - Removed as it's part of cleaned features */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        sessionId={currentSessionId}
      />

      {/* Mobile/Tablet Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer - Slides in from left */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] max-w-[85vw] z-50 bg-[#0E1117] border-r border-[#1F242C] transform transition-transform duration-300 ease-out overflow-y-auto
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Mobile Sidebar Header with Close */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0E1117]/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-2">
            <img src="/dabby-logo.svg" alt="Dabby" className="h-7 w-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">Dabby</span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Sidebar 
          onNavigate={() => setIsMobileSidebarOpen(false)} 
        />
      </div>

      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <div
        className={`hidden lg:block bg-[#0E1117] border-r border-[#1F242C] transition-all duration-300 flex-shrink-0 ${
          isSidebarCollapsed ? "w-16" : "w-[260px]"
        }`}
      >
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
        />
      </div>

      {/* Desktop Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 bg-[#161B22] hover:bg-[#1C2128] border border-[#21262D] hover:border-teal-500/40 text-[#7D8590] hover:text-teal-400 p-2 rounded-r-lg transition-all duration-300"
        style={{ left: isSidebarCollapsed ? "64px" : "260px" }}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isSidebarCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header
          companies={companies}
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Main Dashboard Content */}
        <div className="flex-1 min-h-0 overflow-auto pb-[120px] sm:pb-[100px] lg:pb-0">
          <Routes>
            <Route
              index
              element={
                isInConversation ? (
                  <ChatArea
                    messages={messages}
                    isLoading={isLoading}
                    chatContainerRef={chatContainerRef}
                    onSendMessage={handleSendMessage}
                    uploadedFiles={uploadedFiles}
                  />
                ) : (
                  <>
                    <WelcomeSection />
                    <ActionCards
                      onQuestionCardClick={handleQuestionCardClick}
                    />
                  </>
                )
              }
            />
            <Route
              path="home"
              element={
                <>
                  <WelcomeSection />
                  <ActionCards
                      onQuestionCardClick={handleQuestionCardClick}
                    />
                </>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        {/* Chat Input - only show when not in conversation AND not on settings page */}
        {!isInConversation && 
         !location.pathname.includes("/settings") && (
          <ChatInput
            ref={chatInputRef}
            onSendMessage={handleSendMessage}
            webSearchEnabled={webSearchEnabled}
            uploadedFiles={uploadedFiles}
          />
        )}

        {/* Floating Help Button - Removed, now in Settings */}
      </div>

      {/* Onboarding Tour - Auto-shows for new users on any device */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
}
