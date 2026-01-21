import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  CreditCard,
  Users,
  Key,
  Building2,
  User,
  X,
  ChevronDown,
  Home,
  Sparkles,
  Command,
} from "lucide-react";
import { ArrowLeft, Save, HelpCircle, UserPlus, Plus } from "lucide-react";
import KeyboardShortcutsModal from "../KeyboardShortcuts/KeyboardShortcutsModal";
import OnboardingTour from "../Onboarding/OnboardingTour";

export default function Settings() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState(
    user?.user_metadata?.username || user?.email?.split("@")[0] || ""
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Mobile accordion state
  const [expandedSections, setExpandedSections] = useState(['account']);
  
  // Help modals state
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Toggle mobile accordion section
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections = [
    {
      id: "account",
      label: "Account",
      description: "Update your account settings and preferences",
      icon: User,
      subtitle: "Personal info and preferences",
    },
    {
      id: "api",
      label: "API Keys",
      description: "Configure your AI service API keys",
      icon: Key,
      subtitle: "OpenAI and other services",
    },
    {
      id: "billing",
      label: "Billing",
      description: "Monitor your subscription and billing details",
      icon: CreditCard,
      subtitle: "Plans and credits",
    },
    {
      id: "organization",
      label: "Organizations",
      description: "Manage your organization settings and members",
      icon: Building2,
      subtitle: "Team and access",
    },
    {
      id: "help",
      label: "Help & Tour",
      description: "Get help, view shortcuts, and take the product tour",
      icon: HelpCircle,
      subtitle: "Guides and shortcuts",
    },
  ];

  const handleUpdateAccount = async () => {
    setLoading(true);
    try {
      // Add your update logic here
      setMessage("Account updated successfully");
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleSaveApiKey = () => {
    try {
      if (apiKey.trim()) {
        localStorage.setItem("openai_api_key", apiKey.trim());
        setMessage("API Key saved successfully");
        // Trigger a page reload to update connection status
        window.dispatchEvent(new Event("apiKeyUpdated"));
      } else {
        localStorage.removeItem("openai_api_key");
        setMessage("API Key removed");
        window.dispatchEvent(new Event("apiKeyUpdated"));
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="max-w-3xl mx-auto space-y-3 lg:space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <h3 className="text-sm lg:text-xl font-semibold text-white flex items-center gap-2">
                  <div className="p-1.5 lg:p-2 bg-[#00C6C2]/10 rounded-lg">
                    <User className="w-4 h-4 lg:w-5 lg:h-5 text-[#00C6C2]" />
                  </div>
                  Profile Information
                </h3>
                <p className="mt-1 lg:mt-2 text-xs lg:text-sm text-[#9BA3AF]">
                  Update your personal details and preferences
                </p>
                <div className="mt-3 lg:mt-6 space-y-3 lg:space-y-6">
                  <div className="grid grid-cols-1 gap-3 lg:gap-6">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-[#E5E7EB] mb-1.5 lg:mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-black/40 border border-white/10 rounded-lg lg:rounded-xl text-sm lg:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FFD1] focus:border-transparent transition-all duration-200 hover:border-white/20"
                        placeholder="Enter your display name"
                      />
                      <p className="mt-1 lg:mt-2 text-[10px] lg:text-xs text-[#6B7280] flex items-center gap-1">
                        <span className="text-[#00C6C2]">ℹ️</span>
                        Name displayed to other users
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-[#E5E7EB] mb-1.5 lg:mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-white/5 border border-white/10 rounded-lg lg:rounded-xl text-sm lg:text-base text-gray-400 cursor-not-allowed"
                      />
                      <p className="mt-1 lg:mt-2 text-[10px] lg:text-xs text-[#6B7280]">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-3 lg:pt-4 border-t border-white/10">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="inline-flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl hover:bg-[#00FFD1]/10 hover:border-[#00FFD1]/50 hover:text-[#00FFD1] focus:outline-none focus:ring-2 focus:ring-[#00FFD1]/40 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 group"
                    >
                      <Save className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#00FFD1]" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="max-w-3xl mx-auto space-y-3 lg:space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <h3 className="text-sm lg:text-xl font-semibold text-white flex items-center gap-2">
                  <div className="p-1.5 lg:p-2 bg-teal-500/10 rounded-lg">
                    <Key className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
                  </div>
                  OpenAI API Key
                </h3>
                <p className="mt-1 lg:mt-2 text-xs lg:text-sm text-[#9BA3AF]">
                  Enter your OpenAI API key to enable AI-powered features
                </p>

                <div className="mt-3 lg:mt-6 space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-[#E5E7EB] mb-1.5 lg:mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 pr-16 lg:pr-20 bg-black/40 border border-white/10 rounded-lg lg:rounded-xl text-sm lg:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:border-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 px-3 lg:px-4 flex items-center text-xs lg:text-sm text-[#9BA3AF] hover:text-white transition-colors"
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="mt-1 lg:mt-2 text-[10px] lg:text-xs text-[#6B7280] flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Stored locally, never sent to our servers
                    </p>
                  </div>

                  {/* API Key Info - Hidden on mobile for compactness */}
                  <div className="hidden lg:block bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-teal-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-teal-400">
                          How to get your API key:
                        </h4>
                        <div className="mt-2 text-sm text-[#9BA3AF]">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>
                              Go to{" "}
                              <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-400 hover:text-teal-300 underline"
                              >
                                OpenAI API Keys
                              </a>
                            </li>
                            <li>
                              Create a new API key or copy an existing one
                            </li>
                            <li>Paste it in the field above</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  {apiKey && (
                    <div className="bg-[#00C6C2]/10 border border-[#00C6C2]/30 rounded-lg lg:rounded-xl p-2.5 lg:p-4 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-[#00C6C2]" />
                        <span className="text-xs lg:text-sm font-medium text-[#00C6C2]">
                          API Key Configured
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 lg:space-x-3 pt-3 lg:pt-4 border-t border-white/10">
                    {apiKey && (
                      <button
                        onClick={() => {
                          setApiKey("");
                          localStorage.removeItem("openai_api_key");
                          setMessage("API Key removed");
                          window.dispatchEvent(new Event("apiKeyUpdated"));
                        }}
                        className="inline-flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl hover:bg-white/10 hover:border-red-500/40 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-[#0E1117] transition-all duration-200 active:scale-95"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKey.trim()}
                      className="inline-flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-[#0E1117] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 group"
                    >
                      <Save className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="max-w-3xl mx-auto space-y-3 lg:space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm lg:text-xl font-semibold text-white flex items-center gap-2">
                      <div className="p-1.5 lg:p-2 bg-[#00C6C2]/10 rounded-lg">
                        <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-[#00C6C2]" />
                      </div>
                      Current Plan
                    </h3>
                    <div className="mt-2 lg:mt-4 flex items-baseline">
                      <p className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-[#00C6C2] to-[#00A8A4] bg-clip-text text-transparent">
                        Free
                      </p>
                      <span className="ml-2 text-xs lg:text-sm text-[#6B7280]">
                        / month
                      </span>
                    </div>
                    <p className="mt-1 lg:mt-2 text-xs lg:text-sm text-[#9BA3AF]">
                      30 message credits per month
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection("premium")}
                    className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-6 py-2 lg:py-3 bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-[#0E1117] transition-all duration-200 active:scale-95 group"
                  >
                    <CreditCard className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400" />
                    Upgrade
                  </button>
                </div>
              </div>
              <div className="bg-[#0E1117]/50 border-t border-[#2A2F36] px-3 lg:px-6 py-2 lg:py-4">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="text-[#6B7280]">Next billing:</span>
                  <span className="text-[#9BA3AF]">N/A (Free Plan)</span>
                </div>
              </div>
            </div>

            {/* Credit Usage Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <h3 className="text-sm lg:text-lg font-semibold text-white mb-3 lg:mb-4">
                  Credit Usage
                </h3>
                <div className="space-y-2 lg:space-y-4">
                  {[
                    ["Messages", "1 credit"],
                    ["Company Creation", "2 credits"],
                    ["Report Generation", "3 credits"],
                    ["KPI Calculation", "2 credits"],
                    ["Workbench Creation", "5 credits"],
                  ].map(([name, cost]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm text-[#9BA3AF]">{name}</span>
                      <span className="text-xs lg:text-sm text-white font-medium">{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upgrade Plans */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4">
              {[
                {
                  name: "Member",
                  price: "₹499",
                  credits: "200/mo",
                  color: "from-blue-500 to-blue-700",
                },
                {
                  name: "Master",
                  price: "₹999",
                  credits: "500/mo",
                  color: "from-purple-500 to-purple-700",
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  credits: "Unlimited",
                  color: "from-amber-500 to-amber-700",
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-white/5 backdrop-blur-sm border ${plan.popular ? "border-teal-500/50" : "border-white/10"
                    } rounded-xl lg:rounded-2xl p-2.5 lg:p-6 hover:border-teal-500/50 transition-all duration-200`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 lg:-top-3 left-1/2 -translate-x-1/2 px-2 lg:px-3 py-0.5 lg:py-1 bg-teal-500 text-black text-[8px] lg:text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}
                  <h4 className="text-xs lg:text-lg font-semibold text-white">
                    {plan.name}
                  </h4>
                  <p
                    className={`text-sm lg:text-2xl font-bold mt-1 lg:mt-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                  >
                    {plan.price}
                  </p>
                  <p className="text-[10px] lg:text-sm text-[#9BA3AF] mt-0.5 lg:mt-1">{plan.credits}</p>
                  <button className="w-full mt-2 lg:mt-4 px-2 lg:px-4 py-1.5 lg:py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] lg:text-sm font-medium rounded-lg lg:rounded-xl transition-all duration-200">
                    Choose
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  Wallet Balance
                </h3>
                <div className="mt-6">
                  <div className="flex items-baseline">
                    <p className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      ₹0.00
                    </p>
                    <span className="ml-2 text-sm text-[#6B7280]">INR</span>
                  </div>
                  <p className="mt-2 text-sm text-[#9BA3AF]">
                    Add funds to your wallet for premium features
                  </p>
                  <div className="mt-6 flex justify-end">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0E1117] transition-all duration-200 active:scale-95">
                      <Plus className="w-4 h-4" />
                      Add Funds
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2F36]">
                <h3 className="text-lg font-semibold text-white">
                  Transaction History
                </h3>
              </div>
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto bg-[#2A2F36] rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[#9BA3AF]">No transactions yet</p>
                <p className="text-sm text-[#6B7280] mt-1">
                  Your transaction history will appear here
                </p>
              </div>
            </div>
          </div>
        );

      case "organization":
        return (
          <div className="max-w-3xl mx-auto space-y-3 lg:space-y-6">
            {/* Organization Details */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-6">
                  <h3 className="text-sm lg:text-xl font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 lg:p-2 bg-blue-500/10 rounded-lg">
                      <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                    </div>
                    Organization Details
                  </h3>
                </div>
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-[#E5E7EB] mb-1.5 lg:mb-2">
                      Organization Name
                    </label>
                    <input
                      value={username}
                      readOnly
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-black/40 border border-white/10 rounded-lg lg:rounded-xl text-sm lg:text-base text-gray-400 cursor-not-allowed"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="flex justify-end pt-3 lg:pt-4 border-t border-[#2A2F36]">
                    <button className="inline-flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-[#0E1117] transition-all duration-200 active:scale-95 group">
                      <Save className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Manage Users Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-6">
                  <h3 className="text-sm lg:text-xl font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 lg:p-2 bg-teal-500/10 rounded-lg">
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
                    </div>
                    Manage Users
                  </h3>
                  <button className="p-1.5 lg:p-2 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#2A2F36] transition-colors">
                    <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>

                {/* Users Table */}
                <div className="bg-black/20 border border-white/10 rounded-lg lg:rounded-xl overflow-hidden">
                  <div className="px-3 lg:px-4 py-2 lg:py-3 border-b border-white/10 bg-white/5">
                    <div className="grid grid-cols-3 gap-2 lg:gap-4">
                      <div className="text-[10px] lg:text-sm font-medium text-[#9BA3AF]">
                        Email
                      </div>
                      <div className="text-[10px] lg:text-sm font-medium text-[#9BA3AF]">
                        Role
                      </div>
                      <div className="text-[10px] lg:text-sm font-medium text-[#9BA3AF]">
                        Action
                      </div>
                    </div>
                  </div>
                  <div className="px-3 lg:px-4 py-2 lg:py-4">
                    <div className="grid grid-cols-3 gap-2 lg:gap-4 items-center">
                      <div className="text-[10px] lg:text-sm text-white truncate">
                        {user?.email || "No email"}
                      </div>
                      <div>
                        <select className="w-full bg-black/40 border border-white/10 rounded-lg px-2 lg:px-3 py-1 lg:py-2 text-[10px] lg:text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option>Owner</option>
                          <option>Admin</option>
                          <option>Member</option>
                        </select>
                      </div>
                      <div>
                        <button className="p-1 lg:p-2 text-[#6B7280] hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                          <UserPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="mt-3 lg:mt-4 inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm text-[#9BA3AF] hover:text-white hover:bg-[#2A2F36] rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  Add User
                </button>
              </div>
            </div>

            {/* Subscription Plan Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl lg:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm lg:text-xl font-semibold text-white">
                      Subscription Plan
                    </h3>
                    <p className="text-[#00C6C2] text-xs lg:text-base font-medium mt-0.5 lg:mt-1">Free</p>
                  </div>
                  <button className="px-3 lg:px-4 py-1.5 lg:py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[10px] lg:text-sm font-medium rounded-lg transition-colors">
                    Delete Org
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "premium":
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Premium Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00C6C2] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Upgrade to Premium
              </h2>
              <p className="mt-2 text-[#9BA3AF]">
                Unlock powerful features and get more credits
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Plan */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-teal-500/50 transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white">Member</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                      ₹499
                    </span>
                    <span className="text-[#6B7280]">/month</span>
                  </div>
                  <p className="mt-2 text-[#00C6C2] font-medium">
                    200 credits/month
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {[
                    "200 message credits",
                    "5 workbenches",
                    "Basic analytics",
                    "Email support",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-[#9BA3AF]"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xs">✓</span>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-6 px-4 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 transition-all duration-200">
                  Get Started
                </button>
              </div>

              {/* Master Plan - Popular */}
              <div className="relative bg-white/10 backdrop-blur-sm border-2 border-teal-500/50 rounded-2xl p-6 scale-105 shadow-xl shadow-teal-500/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-black text-sm font-semibold rounded-full">
                  Most Popular
                </div>
                <div className="text-center pt-2">
                  <h3 className="text-xl font-semibold text-white">Master</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      ₹999
                    </span>
                    <span className="text-[#6B7280]">/month</span>
                  </div>
                  <p className="mt-2 text-[#00C6C2] font-medium">
                    500 credits/month
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {[
                    "500 message credits",
                    "Unlimited workbenches",
                    "Advanced analytics",
                    "Priority support",
                    "Custom reports",
                    "API access",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-300 text-xs">✓</span>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-200">
                  Get Started
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-teal-500/50 transition-all duration-200 hover:scale-105">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white">
                    Enterprise
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                      Custom
                    </span>
                    <span className="text-[#6B7280]">/month</span>
                  </div>
                  <p className="mt-2 text-[#00C6C2] font-medium">
                    Unlimited credits/month
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {[
                    "2000 message credits",
                    "Unlimited everything",
                    "White-label options",
                    "Dedicated support",
                    "Custom integrations",
                    "SLA guarantee",
                    "Team management",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-400"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-400 text-xs">✓</span>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className="w-full mt-6 px-4 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 transition-all duration-200">
                  Contact Sales
                </button>
              </div>
            </div>

            {/* FAQ or Additional Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[#E5E7EB] font-medium">
                    What happens to unused credits?
                  </h4>
                  <p className="text-sm text-[#9BA3AF] mt-1">
                    Credits roll over for up to 3 months. After that, they
                    expire.
                  </p>
                </div>
                <div>
                  <h4 className="text-[#E5E7EB] font-medium">
                    Can I cancel anytime?
                  </h4>
                  <p className="text-sm text-[#9BA3AF] mt-1">
                    Yes, you can cancel your subscription at any time. No
                    questions asked.
                  </p>
                </div>
                <div>
                  <h4 className="text-[#E5E7EB] font-medium">
                    Do you offer refunds?
                  </h4>
                  <p className="text-sm text-[#9BA3AF] mt-1">
                    We offer a 7-day money-back guarantee for all plans.
                  </p>
                </div>
              </div>
            </div>
          </div >
        );

      case "help":
        return (
          <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6">
            {/* Product Tour */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
              <div className="flex items-start gap-3 lg:gap-4">
                <div className="p-2.5 lg:p-3 bg-teal-500/10 rounded-xl">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Product Tour</h3>
                  <p className="text-xs lg:text-sm text-[#9BA3AF] mb-3 lg:mb-4">
                    Take a guided tour to learn about all features.
                  </p>
                  <button
                    onClick={() => setShowTour(true)}
                    className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-xl transition-all text-xs lg:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Tour
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts - Desktop only */}
            <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Command className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                  <p className="text-sm text-[#9BA3AF] mb-4">
                    Press <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-xs font-mono">?</kbd> to view shortcuts.
                  </p>
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-sm"
                  >
                    <Command className="w-4 h-4" />
                    View Shortcuts
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
                Quick Tips
              </h3>
              <div className="space-y-3">
                {[
                  ["1", "Upload your data", "Go to Workbenches and upload CSV files."],
                  ["2", "Ask Dabby anything", "Chat to analyze data and generate insights."],
                  ["3", "Build KPI dashboards", "Use Visual Dashboard for custom KPI views."],
                ].map(([num, title, desc]) => (
                  <div key={num} className="flex items-start gap-3 p-3 bg-black/20 rounded-xl">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-400 font-bold text-xs lg:text-sm">{num}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-xs lg:text-sm">{title}</h4>
                      <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="p-4 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/10 rounded-2xl text-center">
              <h3 className="text-white font-semibold text-sm lg:text-base mb-1 lg:mb-2">Need more help?</h3>
              <p className="text-xs lg:text-sm text-gray-400 mb-3 lg:mb-4">Our support team is here to help.</p>
              <a
                href="mailto:support@dabby.ai"
                className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-xs lg:text-sm font-medium"
              >
                Contact Support →
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0a] font-dm-sans">
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-[#0a0a0a]">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="px-4 lg:px-6 py-3 lg:py-6">
            {/* Mobile Header */}
            <div className="lg:hidden">
              <h2 className="text-lg font-bold text-white">Settings</h2>
            </div>
            
            {/* Desktop header */}
            <h2 className="hidden lg:block text-2xl lg:text-3xl font-bold text-white">
              {sections.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="hidden lg:block mt-2 text-sm text-[#9BA3AF]">
              {sections.find((s) => s.id === activeSection)?.description}
            </p>
          </div>
          
          {/* Desktop tabs */}
          <div className="hidden lg:flex px-6 -mb-px space-x-8 overflow-x-auto scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`group inline-flex items-center pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all
                  ${activeSection === section.id
                    ? "border-[#00C6C2] text-[#00C6C2]"
                    : "border-transparent text-[#9BA3AF] hover:text-white hover:border-[#3A3F46]"
                  }`}
              >
                <section.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${activeSection === section.id
                    ? "text-[#00C6C2]"
                    : "text-[#6B7280] group-hover:text-[#9BA3AF]"
                    }`}
                />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Section buttons with expandable content */}
        <div className="lg:hidden p-3 space-y-2">
          {message && (
            <div className={`mb-3 rounded-lg p-3 border ${message.includes("error") ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-[#00C6C2]/10 text-[#00C6C2] border-[#00C6C2]/30"}`}>
              <p className="text-xs font-medium">{message}</p>
            </div>
          )}
          
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-white/10 overflow-hidden bg-white/5">
              <button
                onClick={() => {
                  if (activeSection === section.id) {
                    // Toggle collapse if already active
                    setExpandedSections(prev => 
                      prev.includes(section.id) ? prev.filter(id => id !== section.id) : [...prev, section.id]
                    );
                  } else {
                    // Set active and expand
                    setActiveSection(section.id);
                    setExpandedSections(prev => [...prev.filter(id => id !== section.id), section.id]);
                  }
                }}
                className="w-full flex items-center justify-between gap-3 p-3 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${activeSection === section.id && expandedSections.includes(section.id) ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-gray-400'}`}>
                    <section.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-medium ${activeSection === section.id && expandedSections.includes(section.id) ? 'text-teal-400' : 'text-gray-200'}`}>
                      {section.label}
                    </div>
                    <div className="text-[10px] text-gray-500">{section.subtitle}</div>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 transition-transform ${activeSection === section.id && expandedSections.includes(section.id) ? 'rotate-180' : ''}`}
                />
              </button>
              
              {activeSection === section.id && expandedSections.includes(section.id) && (
                <div className="border-t border-white/5 p-3 bg-black/20">
                  {renderContent()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Tab content */}
        <div className="hidden lg:block px-6 py-6">
          {message && (
            <div className={`mb-6 rounded-xl p-4 border ${message.includes("error") ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-[#00C6C2]/10 text-[#00C6C2] border-[#00C6C2]/30"}`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {/* Profile Update Confirmation Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-[#1F242C] to-[#161B22] border border-[#2A2F36] rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <div className="p-2 bg-[#00C6C2]/10 rounded-lg">
                    <User className="w-5 h-5 text-[#00C6C2]" />
                  </div>
                  Confirm Changes
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-[#2A2F36] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#9BA3AF] hover:text-white" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-[#9BA3AF] mb-4">
                  Are you sure you want to update your profile information?
                </p>
                <div className="bg-[#0E1117] border border-[#2A2F36] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Display Name:</span>
                    <span className="text-white font-medium">{username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Email:</span>
                    <span className="text-[#9BA3AF]">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 bg-[#2A2F36] hover:bg-[#3A3F46] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateAccount();
                    setShowProfileModal(false);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-[#00C6C2] to-[#00A8A4] text-[#0E1117] font-semibold rounded-xl hover:from-[#00D4D0] hover:to-[#00B5B1] hover:scale-105 hover:shadow-lg hover:shadow-[#00C6C2]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => setShowTour(false)}
      />
    </div>
  );
}
