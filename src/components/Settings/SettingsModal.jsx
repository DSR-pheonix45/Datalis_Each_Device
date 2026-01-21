import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  CreditCard,
  Key,
  User,
  X,
  Save,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Bell,
  Globe,
  Lock,
  Users,
  Building2,
  Crown,
  Check,
} from "lucide-react";

export default function SettingsModal({ isOpen, onClose }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState(
    user?.user_metadata?.username || user?.email?.split("@")[0] || ""
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setActiveTab("profile");
    }
  }, [isOpen]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Add your update logic here
      setTimeout(() => {
        setMessage("Profile updated successfully!");
        setLoading(false);
      }, 500);
    } catch (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    try {
      if (apiKey.trim()) {
        localStorage.setItem("openai_api_key", apiKey.trim());
        setMessage("API Key saved successfully!");
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

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "api", label: "API Keys", icon: Key },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "security", label: "Security", icon: Lock },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{username}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#0E1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-500">
                Your email address cannot be changed
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                OpenAI API Key
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Enter your OpenAI API key to enable AI-powered features
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 pr-20 bg-[#0E1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3 h-3" />
                    Your API key is stored locally and never sent to our servers
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">
                        How to get your API key:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                        <li>
                          Go to{" "}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            OpenAI API Keys
                          </a>
                        </li>
                        <li>Create a new API key or copy an existing one</li>
                        <li>Paste it in the field above</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                {apiKey && (
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-teal-400" />
                      <span className="text-sm font-medium text-teal-400">
                        API Key Configured
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  {apiKey && (
                    <button
                      onClick={() => {
                        setApiKey("");
                        localStorage.removeItem("openai_api_key");
                        setMessage("API Key removed");
                        window.dispatchEvent(new Event("apiKeyUpdated"));
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                    >
                      Remove Key
                    </button>
                  )}
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Free Plan</h3>
                    <p className="text-sm text-gray-400">Current plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-400">$0</p>
                  <p className="text-xs text-gray-400">per month</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>30 Message Credits</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Basic AI Features</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Limited File Analysis</span>
                </div>
              </div>
            </div>

            {/* Upgrade Plans */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Upgrade Your Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pro Plan */}
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-teal-500/50 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Pro</h4>
                      <p className="text-sm text-gray-400">For professionals</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-white">
                      $29<span className="text-lg text-gray-400">/mo</span>
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>1000 Message Credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Advanced AI Models</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Unlimited File Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Priority Support</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all">
                    Upgrade to Pro
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-cyan-500/50 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        Enterprise
                      </h4>
                      <p className="text-sm text-gray-400">For teams</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-white">
                      $99<span className="text-lg text-gray-400">/mo</span>
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Unlimited Credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Custom AI Models</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Team Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Dedicated Support</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition-all">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">
                Billing History
              </h4>
              <p className="text-sm text-gray-400">No billing history yet</p>
            </div>
          </div>
        );

      case "organization":
        return (
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold">
                  {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                    "O"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Your Organization
                  </h3>
                  <p className="text-sm text-gray-400">
                    Manage organization settings
                  </p>
                </div>
              </div>

              {/* Organization Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="Enter organization name"
                  className="w-full px-4 py-3 bg-[#0E1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Organization Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Type
                </label>
                <select className="w-full px-4 py-3 bg-[#0E1117] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select type</option>
                  <option value="individual">Individual</option>
                  <option value="startup">Startup</option>
                  <option value="small-business">Small Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Organization Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Size
                </label>
                <select className="w-full px-4 py-3 bg-[#0E1117] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select size</option>
                  <option value="1">Just me</option>
                  <option value="2-10">2-10 people</option>
                  <option value="11-50">11-50 people</option>
                  <option value="51-200">51-200 people</option>
                  <option value="201+">201+ people</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Team Members */}
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <h4 className="text-sm font-medium text-white">
                    Team Members
                  </h4>
                </div>
                <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors">
                  Invite Members
                </button>
              </div>

              {/* Current User */}
              <div className="flex items-center justify-between p-3 bg-[#0E1117] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user?.email || "You"}
                    </p>
                    <p className="text-xs text-gray-400">Owner</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full">
                  Admin
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Upgrade to Pro or Enterprise to add team members
              </p>
            </div>
          </div>
        );

      case "preferences":
        // Removed - replaced with billing and organization tabs
        return null;

      case "security":
        return (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">
                Account Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-gray-300 font-mono text-xs">
                    {user?.id?.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Created:</span>
                  <span className="text-gray-300">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-medium text-white">Password</h4>
                  <p className="text-xs text-gray-400">
                    Change your account password
                  </p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
                Change Password
              </button>
            </div>

            {/* Sign Out */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <LogOut className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="text-sm font-medium text-red-400">Sign Out</h4>
                  <p className="text-xs text-gray-400">
                    Sign out from your account
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#1F2937] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <p className="text-sm text-gray-400">
                Manage your account preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mx-6 mt-4 p-4 rounded-lg border animate-fade-in ${
              message.includes("Error")
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
            }`}
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
          animation: fade-in 0.2s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
