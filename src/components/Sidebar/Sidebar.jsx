import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BsPerson,
  BsGear,
  BsChat,
  BsStars,
  BsChevronDown,
  BsChevronRight,
} from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

import ChatSearch from "../ChatSearch";
import { supabase } from "../../lib/supabase";

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
  onNavigate, // Callback to close mobile sidebar after navigation
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to handle navigation and close mobile sidebar
  const handleNavigation = (path) => {
    navigate(path);
    onNavigate?.(); // Close mobile sidebar if callback provided
  };

  const [expandedSections, setExpandedSections] = useState({
    history: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };


  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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
          last_message_at
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
    fetchChatHistory();

    // Keyboard shortcut for search (Ctrl+K)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Listen for chat history updates
    const handleChatHistoryUpdate = () => {
      fetchChatHistory();
    };
    window.addEventListener("chatHistoryUpdated", handleChatHistoryUpdate);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("chatHistoryUpdated", handleChatHistoryUpdate);
    };
  }, [user, fetchChatHistory]);

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
          </div>

          {/* Divider before expandable sections */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800/60 to-transparent mb-3" />

          {/* Expandable Sections - Scrollable area */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
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
