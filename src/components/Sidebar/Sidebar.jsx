import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  BsPlus,
  BsChevronDown,
  BsChevronRight,
  BsPerson,
  BsGear,
  BsChat,
  BsBriefcase,
  BsBuilding,
  BsBarChart,
  BsExclamationCircle,
  BsArrowRepeat,
  BsHouse,
  BsStars,
  BsSearch,
} from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { useWorkbench } from "../../context/WorkbenchContext";

import ChatSearch from "../ChatSearch";
import { supabase } from "../../lib/supabase";
import { syncCredits } from "../../services/creditsService";

const SidebarButton = ({
  icon: IconComponent,
  children,
  subtitle = null,
  isActive = false,
  badge = null,
  onClick,
  isPrimary = false,
  href = null, // Added href prop
  onNavigate, // Callback for mobile close
}) => {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (href) {
      e.preventDefault();
      navigate(href);
      onNavigate?.(); // Close mobile sidebar after navigation
    }
    if (onClick) {
      onClick(e);
      onNavigate?.(); // Close mobile sidebar after action
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-full flex items-center px-4 py-3 text-left transition-all duration-300 min-h-[44px] group ${isPrimary
        ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 text-white shadow-[0_0_15px_rgba(20,184,166,0.1)] hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:border-teal-500/40 hover:scale-[1.02] active:scale-[0.98] rounded-xl"
        : isActive
          ? "bg-teal-500/15 text-teal-400 border-l-2 border-teal-500 rounded-lg"
          : "text-gray-400 hover:bg-white/5 hover:text-white rounded-lg"
        }`}
      style={{ fontSize: "14px", fontWeight: isPrimary ? "600" : "500" }}
    >
      {/* Left hover accent line */}
      {!isPrimary && !isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-r opacity-0 group-hover:h-6 group-hover:opacity-100 transition-all duration-200" />
      )}
      <IconComponent
        className={`text-lg mr-4 flex-shrink-0 ${isPrimary ? "text-teal-400" : ""}`}
      />
      <div className="flex-1 flex flex-col justify-center">
        <span className="leading-tight">{children}</span>
        {subtitle && (
          <span
            className={`text-[10px] font-normal mt-0.5 leading-tight transition-colors ${isPrimary
              ? "text-teal-200/60 group-hover:text-teal-100/80"
              : isActive
                ? "text-teal-400/60"
                : "text-gray-500 group-hover:text-gray-400"
              }`}
          >
            {subtitle}
          </span>
        )}
      </div>
      {badge && (
        <span className="bg-[#21262D] text-[#7D8590] text-xs px-2 py-0.5 rounded-full ml-2">
          {badge}
        </span>
      )}
    </button>
  );
};

const ExpandableSection = ({
  title,
  isExpanded,
  onToggle,
  children,
  badge = null,
}) => (
  <div className="mb-1">
    <button
      onClick={onToggle}
      className="relative w-full flex items-center justify-between px-4 py-2.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all duration-200 group"
      style={{ fontSize: "13px", fontWeight: "500" }}
    >
      {/* Left hover accent line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-[#00FFD1] rounded-r opacity-0 group-hover:h-5 group-hover:opacity-100 transition-all duration-200" />
      <div className="flex items-center gap-3">
        {isExpanded ? (
          <BsChevronDown className="text-xs" />
        ) : (
          <BsChevronRight className="text-xs" />
        )}
        <span className="text-left font-dm-sans">{title}</span>
      </div>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#21262D] text-gray-400 text-[10px] font-medium rounded-full border border-white/5 group-hover:bg-teal-500/10 group-hover:text-teal-400 group-hover:border-teal-500/20 transition-all">
          {badge}
        </span>
      )}
    </button>
    {isExpanded && (
      <div className="ml-7 mt-1 space-y-0.5 pl-3 border-l border-gray-800/50">
        {children}
      </div>
    )}
  </div>
);

export default function Sidebar({
  isCollapsed = false,
  onWorkbenchSelect: propOnWorkbenchSelect,
  selectedWorkbench: propSelectedWorkbench,
  onNavigate, // Callback to close mobile sidebar after navigation
}) {
  const { user } = useAuth();
  const { selectWorkbench, context } = useWorkbench();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to handle navigation and close mobile sidebar
  const handleNavigation = (path) => {
    navigate(path);
    onNavigate?.(); // Close mobile sidebar if callback provided
  };

  const [activeWorkbench, setActiveWorkbench] = useState(
    propSelectedWorkbench || context?.workbench || null
  );

  // Sync activeWorkbench with prop or context changes
  useEffect(() => {
    if (propSelectedWorkbench) {
      setActiveWorkbench(propSelectedWorkbench);
    } else if (context?.workbench) {
      setActiveWorkbench(context.workbench);
    }
  }, [propSelectedWorkbench, context?.workbench]);

  const activateWorkbench = (workbenchId) => {
    const workbench = workbenches.find((w) => w.id === workbenchId);
    if (workbench) {
      setActiveWorkbench(workbench);
      
      // Use WorkbenchContext to select workbench globally
      selectWorkbench(workbench);

      if (propOnWorkbenchSelect) {
        propOnWorkbenchSelect(workbench);
      }
      // Explicitly navigate to dashboard to show chat with this workbench
      if (location.pathname !== "/dashboard") {
        handleNavigation("/dashboard");
      }
      onNavigate?.(); // Close mobile sidebar
    }
  };

  const [expandedSections, setExpandedSections] = useState({
    companyInfo: false,
    workbench: true,
    history: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };


  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [workbenches, setWorkbenches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageTokens, setMessageTokens] = useState(null); // User's message credits - null = loading

  const loadMessageTokens = useCallback(async () => {
    if (!user) {
      // For non-logged-in users, show 0 credits
      setMessageTokens(0);
      return;
    }

    // Always sync with database
    try {
      const result = await syncCredits(user.id);
      if (result.success && result.credits !== null) {
        setMessageTokens(result.credits);
      } else {
        console.error("Failed to load credits:", result.error);
        setMessageTokens(0); // Show 0 on error
      }
    } catch (error) {
      console.error("Error loading message tokens:", error);
      setMessageTokens(0); // Show 0 on error
    }
  }, [user]);

  const fetchWorkbenches = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Try direct query first as it's more reliable across different schema versions
      const { data, error } = await supabase
        .from("workbenches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // If direct query fails (e.g. column doesn't exist), try RPC
        console.warn("Direct workbench query failed, trying RPC:", error.message);
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_workbenches", {
          p_user_id: user.id,
        });

        if (rpcError) throw rpcError;
        setWorkbenches(rpcData || []);
      } else {
        setWorkbenches(data || []);
      }
    } catch (error) {
      console.error("Error fetching workbenches:", error);
      toast.error("Failed to load workbenches");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;

    try {
      // Try direct query first
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Direct company query failed, trying RPC:", error.message);
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_user_companies",
          {
            p_user_id: user.id,
          }
        );

        if (rpcError) throw rpcError;
        setCompanies(rpcData || []);
      } else {
        setCompanies(data || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, [user]);

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          title,
          created_at,
          last_message_at,
          workbench_id,
          company_id
        `
        )
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })
        .limit(10);

      if (error) {
        // Table might not exist yet, that's okay
        console.log("Chat history not available yet:", error.message);
        setChatHistory([]);
        return;
      }

      console.log("Fetched chat history for user:", data);
      setChatHistory(data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setChatHistory([]);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkbenches();
    fetchCompanies();
    fetchChatHistory();
    loadMessageTokens();

    // Keyboard shortcut for search (Ctrl+K)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Listen for credits updated events (from any credit-consuming action)
    const handleCreditsUpdated = () => {
      loadMessageTokens();
    };

    window.addEventListener("creditsUpdated", handleCreditsUpdated);

    // Listen for chat history updates
    const handleChatHistoryUpdate = () => {
      fetchChatHistory();
    };
    window.addEventListener("chatHistoryUpdated", handleChatHistoryUpdate);

    // Listen for company creation
    const handleCompanyCreated = () => {
      fetchCompanies();
    };
    window.addEventListener("companyCreated", handleCompanyCreated);

    // Listen for workbench creation
    const handleWorkbenchCreated = () => {
      fetchWorkbenches();
    };
    window.addEventListener("workbenchCreated", handleWorkbenchCreated);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("creditsUpdated", handleCreditsUpdated);
      window.removeEventListener("chatHistoryUpdated", handleChatHistoryUpdate);
      window.removeEventListener("companyCreated", handleCompanyCreated);
      window.removeEventListener("workbenchCreated", handleWorkbenchCreated);
    };
  }, [user, fetchChatHistory, fetchCompanies, fetchWorkbenches, loadMessageTokens]);

  const loadChatSession = async (sessionId) => {
    try {
      // Fetch all messages for this session
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Dispatch event to MainApp to load these messages
      window.dispatchEvent(
        new CustomEvent("loadChatSession", {
          detail: {
            sessionId,
            messages: data.map((msg) => ({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              sender:
                msg.role === "user"
                  ? "You"
                  : msg.metadata?.sender || "Dabby Consultant",
              timestamp: msg.created_at,
              metadata: msg.metadata,
            })),
          },
        })
      );

      // Navigate to dashboard to show chat
      navigate("/dashboard");
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Failed to load chat session. Please try again.");
    }
  };





  return (
    <div
      className="h-full bg-black border-r border-white/10 text-white flex flex-col pt-4"
      data-tour="sidebar"
    >
      {isCollapsed ? (
        // Collapsed Sidebar - Icon Only View
        <div className="flex flex-col items-center py-4 space-y-4">


          {/* New Chat Icon */}
          <button
            onClick={() => {
              activateWorkbench(null);
              window.dispatchEvent(new CustomEvent("clearChat"));
              if (location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
            }}
            className="p-3 text-teal-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal-500/40 rounded-lg transition-all group relative"
            title="New Chat"
            aria-label="Start new chat"
          >
            <BsChat className="text-xl" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              New Chat
            </span>
          </button>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all group relative"
            title="Search (Ctrl+K)"
            aria-label="Search chats (Ctrl+K)"
          >
            <BsSearch className="text-xl" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Search
            </span>
          </button>

          {/* Company Icon */}
          <button
            onClick={() => navigate("/dashboard/company")}
            className={`p-3 rounded-lg transition-all group relative ${location.pathname === "/dashboard/company"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            title="Company"
            aria-label="Manage companies"
          >
            <BsBuilding className="text-xl" />
            {companies.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs rounded-full flex items-center justify-center">
                {companies.length}
              </span>
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Companies
            </span>
          </button>

          {/* Visuals Icon */}
          <button
            onClick={() => navigate("/dashboard/visuals")}
            className={`p-3 rounded-lg transition-all group relative ${location.pathname.includes("/dashboard/visuals")
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "text-[#7D8590] hover:bg-[#161B22] hover:text-[#E6EDF3]"
              }`}
            title="Visuals"
            aria-label="View visual dashboard"
          >
            <BsBarChart className="text-xl" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Visuals
            </span>
          </button>

          {/* Workbench Navigation */}
          <button
            onClick={() => navigate("/dashboard/workbenches")}
            className={`p-3 rounded-lg transition-all group relative ${location.pathname === "/dashboard/workbenches"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            title="Workbench"
            aria-label="Manage workbenches"
          >
            <BsBriefcase className="text-xl" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Workbench
            </span>
          </button>

          {/* History Icon */}
          <button
            onClick={() => toggleSection("history")}
            className="p-3 text-[#7D8590] hover:bg-[#161B22] hover:text-[#E6EDF3] rounded-lg transition-all group relative"
            title="History"
            aria-label="View chat history"
          >
            <BsChat className="text-xl" />
            {chatHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs rounded-full flex items-center justify-center">
                {chatHistory.length}
              </span>
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              History
            </span>
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Settings Icon */}
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="p-3 text-[#7D8590] hover:bg-[#161B22] hover:text-[#E6EDF3] rounded-lg transition-all group relative"
            title="Settings"
            aria-label="Open settings"
          >
            <BsGear className="text-xl" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Settings
            </span>
          </button>

          {/* Message Credits */}
          <div className="p-3 text-center">
            <div
              className={`text-lg font-bold ${messageTokens <= 5 ? "text-red-400" : "text-teal-400"
                }`}
            >
              {messageTokens}
            </div>
            <div className="text-xs text-[#484F58]">Credits</div>
          </div>
        </div>
      ) : (
        // Expanded Sidebar - Full View
        <div className="flex flex-col h-full px-3 sm:px-5">

          {/* Main Buttons - With increased spacing */}
          <div className="space-y-2 mb-4">
            {/* New Chat - Primary pill button with gradient */}
            <SidebarButton
              icon={BsStars}
              isPrimary={true}
              subtitle="Ctrl + K"
              onNavigate={onNavigate}
              onClick={() => {
                // Clear active workbench
                activateWorkbench(null);
                // Dispatch custom event to clear chat
                window.dispatchEvent(new CustomEvent("clearChat"));
                // Navigate to dashboard
                if (location.pathname !== "/dashboard") {
                  handleNavigation("/dashboard");
                }
              }}
            >
              New Chat
            </SidebarButton>

            {/* Message Credits moved to bottom */}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-800/60 to-transparent my-3" />

            <SidebarButton
              icon={BsBuilding}
              href="/dashboard/company"
              isActive={location.pathname === "/dashboard/company"}
              badge={companies.length}
              onNavigate={onNavigate}
            >
              Companies
            </SidebarButton>

            {/* Visuals Navigation */}
            <SidebarButton
              icon={BsBarChart}
              href="/dashboard/visuals"
              isActive={location.pathname.includes("/dashboard/visuals")}
              onNavigate={onNavigate}
            >
              Visuals
            </SidebarButton>

            {/* Workbench Navigation */}
            <SidebarButton
              icon={BsBriefcase}
              href="/dashboard/workbenches"
              isActive={location.pathname === "/dashboard/workbenches"}
              onNavigate={onNavigate}
            >
              Workbench
            </SidebarButton>
          </div>

          {/* Divider before expandable sections */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800/60 to-transparent mb-3" />

          {/* Expandable Sections - Scrollable area */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <ExpandableSection
              title="Companies"
              isExpanded={expandedSections.companyInfo}
              onToggle={() => toggleSection("companyInfo")}
              badge={companies.length}
            >
              {companies.length > 0 ? (
                <div className="space-y-1">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => {
                        // TODO: View company details or filter by company
                        console.log("Selected company:", company.id);
                      }}
                      className="px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">
                          {company.company_name}
                        </span>
                        <BsBuilding className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {company.gst_no && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          GST: {company.gst_no}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:border-teal-500/30 transition-colors">
                    <BsBuilding className="text-gray-500 text-lg" />
                  </div>
                  <p className="text-gray-400 text-xs mb-2">No companies yet</p>

                </div>
              )}
            </ExpandableSection>

            <ExpandableSection
              title="Workbench"
              isExpanded={expandedSections.workbench}
              onToggle={() => toggleSection("workbench")}
              badge={workbenches.length}
            >
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                  <BsArrowRepeat className="animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : workbenches.length > 0 ? (
                <div className="space-y-1">
                  {workbenches.map((workbench) => (
                    <div
                      key={workbench.id}
                      onClick={() => activateWorkbench(workbench.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${activeWorkbench?.id === workbench.id ||
                        propSelectedWorkbench?.id === workbench.id
                        ? "bg-teal-500/10 text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <BsBriefcase className="text-sm" />
                      <span className="flex-1 text-sm truncate">
                        {workbench.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${workbench.type === "personal"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                          }`}
                      >
                        {workbench.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-1">
                  <p className="mb-2">No workbenches created</p>
                  <button
                    onClick={() => navigate("/workbenches")}
                    className="text-teal-400 hover:text-teal-300 text-xs underline"
                  >
                    Create your first workbench
                  </button>
                </div>
              )}
            </ExpandableSection>

            <ExpandableSection
              title="History"
              isExpanded={expandedSections.history}
              onToggle={() => toggleSection("history")}
              badge={chatHistory.length}
            >
              {chatHistory.length > 0 ? (
                <div className="space-y-1">
                  {chatHistory.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadChatSession(session.id)}
                      className="px-3 py-2 text-gray-300 hover:bg-[#161B22] hover:text-white rounded-md transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">
                          {session.title || "Untitled Chat"}
                        </span>
                        <BsChat className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {new Date(session.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-1">
                  <p className="mb-2">No chat history</p>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("clearChat"));
                      if (location.pathname !== "/dashboard")
                        navigate("/dashboard");
                    }}
                    className="text-teal-400 hover:text-teal-300 text-xs underline"
                  >
                    Start your first chat
                  </button>
                </div>
              )}
            </ExpandableSection>
          </div>

          {/* Message Credits/Tokens Section - Fixed at bottom */}
          <div className="flex-shrink-0 pb-2 mt-auto">
            <div className="px-3">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 font-medium">
                    Message Credits
                  </span>
                  <span
                    className={`text-2xl font-bold ${messageTokens <= 5
                      ? "text-red-500"
                      : messageTokens <= 10
                        ? "text-amber-500"
                        : "text-[#00C6C2]"
                      }`}
                  >
                    {messageTokens}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${messageTokens <= 5
                      ? "bg-red-500"
                      : messageTokens <= 10
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-[#00C6C2] to-[#00A8A3]"
                      }`}
                    style={{ width: `${(messageTokens / 30) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  {messageTokens > 0
                    ? `${messageTokens} message${messageTokens !== 1 ? "s" : ""
                    } remaining`
                    : "No messages left"}
                </p>

                {messageTokens <= 5 && messageTokens > 0 && (
                  <div className="mt-2 text-xs text-amber-500 flex items-center">
                    <BsExclamationCircle className="mr-1" />
                    Running low on credits
                  </div>
                )}

                {messageTokens === 0 && (
                  <button
                    className="w-full mt-2 px-3 py-2 bg-[#00C6C2] text-[#0E1117] rounded-lg text-xs font-medium hover:bg-[#00A8A3] transition-colors"
                    onClick={() => navigate("/settings")}
                  >
                    Get More Credits
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Section - Fixed at bottom */}
          <div className="flex-shrink-0 pt-4 pb-4 border-t border-[#1F242C]">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-[#161B22] rounded-lg p-2 transition-colors"
              onClick={() => navigate("/dashboard/settings")}
            >
              <div className="w-8 h-8 bg-[#00C6C2] rounded-full flex items-center justify-center flex-shrink-0">
                <BsPerson className="text-[#0E1117] text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#FFFFFF] truncate">
                  {user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || "User"}
                </p>
                <p className="text-xs text-[#9BA3AF]">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Chat Search Modal */}
      <ChatSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        chatHistory={chatHistory}
        onSelectChat={(chat) => {
          loadChatSession(chat.id);
          setIsSearchOpen(false);
        }}
      />
    </div>
  );
}
