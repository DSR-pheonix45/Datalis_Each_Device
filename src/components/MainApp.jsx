import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import WelcomeSection from "./WelcomeSection/WelcomeSection";
import ActionCards from "./ActionCards/ActionCards";
import ChatInput from "./ChatInput/ChatInput";
import ChatArea from "./ChatArea/ChatArea";
import DatabaseSetupBanner from "./DatabaseSetup/DatabaseSetupBanner";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useWorkbench } from "../context/WorkbenchContext";
import VisualDashboard from "./Visuals/VisualDashboard";
import Settings from "./Settings/Settings";
import WorkbenchesPage from "../pages/workbenches/WorkbenchesPage";
import CompanyPage from "../pages/CompanyPage";
import OnboardingTour from "./Onboarding/OnboardingTour";
import { supabase } from "../lib/supabase";
import {
  decrementCredits,
  CREDIT_COSTS,
  getUserCredits,
} from "../services/creditsService";

export default function MainApp() {
  useTheme(); // Theme context is used for side effects
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [activeWorkbench] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [workbenches, setWorkbenches] = useState([]);
  const [userCredits, setUserCredits] = useState(100);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [canvas] = useState([]); // Canvas state for KPI tracking
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [workbenchContext] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentContext, setCurrentContext] = useState("");
  const [isInConversation, setIsInConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showTour, setShowTour] = useState(false);
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-show onboarding tour for new users
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("dabby_onboarding_completed");
    if (!hasCompletedOnboarding && user?.id) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("dabby_onboarding_completed", "true");
  };

  // Load credits from database on mount
  useEffect(() => {
    const loadCredits = async () => {
      if (user?.id) {
        const result = await getUserCredits(user.id);
        if (result.success) {
          localStorage.setItem("message_tokens", result.credits.toString());
          setUserCredits(result.credits);
        }
      }
    };
    loadCredits();
  }, [user?.id]);

  // Fetch companies and workbenches for the logged-in user
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

        // Fetch workbenches created by the user
        const { data: workbenchesData, error: workbenchesError } =
          await supabase
            .from("workbenches")
            .select("id, name, description, company_id, created_at")
            .order("created_at", { ascending: false });

        if (workbenchesError) {
          console.error("Error fetching workbenches:", workbenchesError);
        } else {
          // Map to the expected format
          const formattedWorkbenches = (workbenchesData || []).map((w) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            company_id: w.company_id,
          }));
          setWorkbenches(formattedWorkbenches);
        }

        // Fetch user credits from credits table
        const { data: creditsData, error: creditsError } = await supabase
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();

        if (creditsError && creditsError.code !== "PGRST116") {
          console.error("Error fetching credits:", creditsError);
        } else if (creditsData) {
          setUserCredits(creditsData.balance || 100);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    // Listen for company/workbench creation events to refresh data
    const handleCompanyCreated = () => fetchUserData();
    const handleWorkbenchCreated = () => fetchUserData();

    window.addEventListener("companyCreated", handleCompanyCreated);
    window.addEventListener("workbenchCreated", handleWorkbenchCreated);

    return () => {
      window.removeEventListener("companyCreated", handleCompanyCreated);
      window.removeEventListener("workbenchCreated", handleWorkbenchCreated);
    };
  }, [user?.id]);

  // Listen for clearChat event from sidebar
  useEffect(() => {
    const handleClearChat = () => {
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

  // Listen for creditsUpdated event to refresh credit display
  useEffect(() => {
    const handleCreditsUpdated = async () => {
      if (user?.id) {
        const result = await getUserCredits(user.id);
        if (result.success) {
          localStorage.setItem("message_tokens", result.credits.toString());
          setUserCredits(result.credits);
        }
      }
    };

    window.addEventListener("creditsUpdated", handleCreditsUpdated);

    return () => {
      window.removeEventListener("creditsUpdated", handleCreditsUpdated);
    };
  }, [user?.id]);

  // Auto-save chat session and generate summary
  const saveChatSession = async (sessionMessages) => {
    if (!user?.id || sessionMessages.length < 2) return;

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
          workbench_id: activeWorkbench?.id || null,
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
          hasWorkbench: !!latestMessage.options?.attachedWorkbench,
        },
      });

      console.log("Chat session saved:", sessionId);

      // Trigger sidebar refresh
      window.dispatchEvent(new Event("chatHistoryUpdated"));
    } catch (error) {
      console.error("Error saving chat session:", error);
    }
  };

  // Handle file passed from workbench
  useEffect(() => {
    if (location.state?.uploadedFile) {
      const { uploadedFile, fileName } = location.state;
      setUploadedFiles([uploadedFile]);
      setIsInConversation(true);

      // Auto-trigger analysis
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.triggerSend(`Analyze this file: ${fileName}`);
        }
      }, 500);

      // Clear the location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

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

    // Check message credits before sending
    const storedCredits = parseInt(
      localStorage.getItem("message_tokens") || "0",
      10
    );
    if (storedCredits < CREDIT_COSTS.MESSAGE) {
      toast.error(
        `Insufficient credits. You need ${CREDIT_COSTS.MESSAGE} credit but have ${storedCredits}. Please upgrade your plan.`,
        { duration: 4000 }
      );
      return;
    }

    // Handle empty message with files
    let displayMessage = message;
    let llmQuery = message;
    const hasFiles = options.uploadedFiles && options.uploadedFiles.length > 0;
    const hasWorkbench = options.attachedWorkbench;

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

    // Decrement message credits (database + localStorage)
    try {
      if (user?.id) {
        const result = await decrementCredits(
          user.id,
          CREDIT_COSTS.MESSAGE,
          "chat_message"
        );

        // Update localStorage with the new balance from DB
        if (result.success && result.credits !== undefined) {
          localStorage.setItem("message_tokens", result.credits.toString());
        }
      }
    } catch (error) {
      console.warn("Failed to decrement credits in database:", error);
    }

    // Notify UI to update credits display (reload from DB for accuracy)
    window.dispatchEvent(new Event("creditsUpdated"));

    // If there are uploaded files, show loading message
    let loadingId = null;

    if (hasFiles || hasWorkbench) {
      let loadingMsg = "";
      if (hasFiles && hasWorkbench) {
        const fileNames = options.uploadedFiles.map((f) => f.name).join(", ");
        loadingMsg = message.trim()
          ? `Analyzing workbench "${options.attachedWorkbench.name}" and files: ${fileNames}...`
          : `Processing files: ${fileNames}...`;
      } else if (hasWorkbench) {
        loadingMsg = `Analyzing workbench "${options.attachedWorkbench.name}"...`;
      } else {
        const fileNames = options.uploadedFiles.map((f) => f.name).join(", ");
        loadingMsg = message.trim()
          ? `Analyzing files: ${fileNames}...`
          : `Uploading files: ${fileNames}...`;
      }

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

    // Fetch workbench files if a workbench is attached
    let workbenchFiles = [];
    if (options.attachedWorkbench) {
      // Update last_used_by for the workbench
      if (user?.id) {
        supabase
          .from("workbenches")
          .update({ last_used_by: user.id })
          .eq("id", options.attachedWorkbench.id)
          .then(({ error }) => {
            if (error && error.code === "PGRST204") {
              console.warn("last_used_by column missing in workbenches table. Please run the migration.");
            }
          });
      }

      try {
        console.log(
          "Fetching files for workbench:",
          options.attachedWorkbench.id
        );

        // First, get file metadata from workbench_files table
        const { data: filesData, error: filesError } = await supabase
          .from("workbench_files")
          .select(
            "id,file_name,file_size,file_type,bucket_path,created_at,updated_at"
          )
          .eq("workbench_id", options.attachedWorkbench.id)
          .order("created_at", { ascending: false });

        if (filesError) {
          console.error("Error fetching workbench files metadata:", filesError);
        } else if (filesData && filesData.length > 0) {
          console.log(`Found ${filesData.length} files in workbench`);

          // Download each file's content from storage
          for (const file of filesData) {
            const fileName = file.file_name || file.name;
            const fileSize = file.file_size || file.size;
            const filePath =
              file.bucket_path ||
              `${options.attachedWorkbench.id}/${fileName}`;

            try {
              const { data: fileBlob, error: downloadError } =
                await supabase.storage
                  .from("workbench-files")
                  .download(filePath);

              if (!downloadError && fileBlob) {
                const content = await fileBlob.text();
                workbenchFiles.push({
                  name: fileName,
                  content,
                  size: fileSize || content.length,
                  type: file.file_type || "text/plain",
                });
                console.log(
                  `Loaded file: ${fileName} (${content.length} chars)`
                );
              } else {
                console.warn(
                  `Failed to download file ${fileName}:`,
                  downloadError
                );
              }
            } catch (downloadErr) {
              console.warn(`Error downloading file ${fileName}:`, downloadErr);
            }
          }
          console.log(
            `Successfully loaded ${workbenchFiles.length} files from workbench`
          );
        } else {
          console.log("No files found in workbench");
        }
      } catch (err) {
        console.error("Error loading workbench files:", err);
      }
    }

    // Always call AI function (ChatInput handles this now)
    try {
      const { callLLMWithFallback } = await import("../services/llmService.js");

      const llmResponse = await callLLMWithFallback({
        query: llmQuery, // Use the processed query
        context: currentContext, // Pass current context
        web_search: options.web || false,
        uploaded_files: options.uploadedFiles || [], // Pass File objects for frontend processing
        workbench_files: workbenchFiles, // Pass workbench file contents
        workbench_id:
          options.attachedWorkbench?.id || activeWorkbench?.id || null,
        history: messages,
      });

      if (llmResponse.error) {
        throw new Error(llmResponse.error);
      }

      // Update current context if new files were processed (uploaded or workbench)
      if (
        llmResponse.context &&
        ((options.uploadedFiles && options.uploadedFiles.length > 0) ||
          workbenchFiles.length > 0)
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

  const handleGenerateReport = (reportData) => {
    console.log("Generating report:", reportData);
    // Here you would typically generate the report
    // For now, we'll just log it
  };

  const handleReportBuilderClick = () => {
    // We allow opening the modal for everyone now
    // The modal itself will handle the plan restriction with a marketing message
    setIsReportModalOpen(true);
  };

  const handleVisualDashboardClick = () => {
    // Navigate to visuals dashboard
    navigate("/dashboard/visuals");
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

  const handleQuickAnalysisClick = () => {
    if (chatInputRef.current) {
      // Get active KPIs and workbench context
      const activeKPIs = canvas.filter((slot) => slot.kpiId).length;
      const currentWorkbench = workbenches.find((w) => w.isActive);

      let analysisPrompt = `Please provide a quick analysis of my business with these details:

- Active KPIs being tracked: ${activeKPIs}`;

      if (currentWorkbench) {
        analysisPrompt += `
- Current workbench: ${currentWorkbench.name}
- Company: ${currentWorkbench.company || "N/A"}`;
      }

      analysisPrompt += `

Please analyze:
1. Key performance indicators and trends
2. Business health overview
3. Recommendations for improvement`;

      chatInputRef.current.setMessage(analysisPrompt);

      // Auto-send if inference conditions are met
      if (chatInputRef.current.canRunInference()) {
        setTimeout(() => {
          chatInputRef.current.sendMessage(analysisPrompt);
        }, 100);
      }
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] text-white font-dm-sans relative">
      {/* Database Setup Banner */}
      <DatabaseSetupBanner />

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
        <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <div
        className={`hidden lg:block bg-[#0E1117] border-r border-[#1F242C] transition-all duration-300 flex-shrink-0 ${
          isSidebarCollapsed ? "w-16" : "w-[260px]"
        }`}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />
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
          workbenches={workbenches}
          userCredits={userCredits}
          onGenerateReport={handleGenerateReport}
          isReportModalOpen={isReportModalOpen}
          setIsReportModalOpen={setIsReportModalOpen}
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
                    workbenchContext={workbenchContext}
                    uploadedFiles={uploadedFiles}
                  />
                ) : (
                  <>
                    <WelcomeSection />
                    <ActionCards
                      onReportBuilderClick={handleReportBuilderClick}
                      canvas={canvas}
                      onVisualDashboardClick={handleVisualDashboardClick}
                      onQuestionCardClick={handleQuestionCardClick}
                      onQuickAnalysisClick={handleQuickAnalysisClick}
                      userPlan={profile?.plans?.name || 'Basic'}
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
                      onReportBuilderClick={handleReportBuilderClick}
                      canvas={canvas}
                      onVisualDashboardClick={handleVisualDashboardClick}
                      onQuestionCardClick={handleQuestionCardClick}
                      onQuickAnalysisClick={handleQuickAnalysisClick}
                      userPlan={profile?.plans?.name || 'Basic'}
                    />
                </>
              }
            />
            <Route path="visuals" element={<VisualDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="workbenches" element={<WorkbenchesPage />} />
            <Route path="company" element={<CompanyPage />} />
          </Routes>
        </div>

        {/* Chat Input - only show when not in conversation AND not on visuals/workbenches/company/settings page */}
        {!isInConversation && 
         !location.pathname.includes("/visuals") && 
         !location.pathname.includes("/workbenches") && 
         !location.pathname.includes("/company") && 
         !location.pathname.includes("/settings") && (
          <ChatInput
            ref={chatInputRef}
            onSendMessage={handleSendMessage}
            webSearchEnabled={webSearchEnabled}
            workbenchContext={workbenchContext}
            uploadedFiles={uploadedFiles}
            onWorkbenchClick={() => navigate("/dashboard/workbenches")}
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
