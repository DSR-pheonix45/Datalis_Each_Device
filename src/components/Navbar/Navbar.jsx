import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, User, LogOut, Menu, X } from "lucide-react";
// Remove the import and use the public path directly

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const ThemeToggle = () => {
    return (
      <div className="relative inline-block w-14 h-7">
        <input
          type="checkbox"
          id="theme-toggle"
          className="opacity-0 w-0 h-0"
          checked={isDark}
          onChange={toggleTheme}
        />
        <label
          htmlFor="theme-toggle"
          className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${isDark ? "bg-teal-600" : "bg-gray-300"
            }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 bg-white w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${isDark ? "translate-x-7" : "translate-x-0"
              }`}
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-teal-600" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-500" />
            )}
          </span>
        </label>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    // Change from logout() to signOut() to match the function name in AuthContext
    const result = await signOut();
    if (result?.success) {
      navigate("/");
    } else {
      // Handle case where signOut doesn't return a result object
      navigate("/");
    }
  };

  const openDemoPage = () => {
    window.open("https://huggingface.co/spaces/medhansh-k/Dabby", "_blank");
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-[#0B1221]/90 backdrop-blur-md shadow-lg"
          : "bg-transparent"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="relative mr-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-all">
                  <span className="text-white font-bold text-xl sm:text-2xl tracking-tight group-hover:scale-110 transition-transform">
                    D
                  </span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent group-hover:from-teal-300 group-hover:to-cyan-400 transition-all">
                  Dabby
                </span>
                <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium tracking-widest -mt-1">
                  AI CONSULTANT
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Auth Buttons - Dynamic based on auth state */}
            <div className="flex items-center space-x-4 ml-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-4 py-2 text-white hover:text-[#00FFD1] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      {user?.email?.[0].toUpperCase() || <User size={16} />}
                    </div>
                    <span className="hidden lg:inline">
                      {user?.user_metadata?.username ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-[#0B1221] border border-gray-800 rounded-lg shadow-lg overflow-hidden z-20">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-[#00FFD1]"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300"
                        >
                          <div className="flex items-center">
                            <LogOut size={16} className="mr-2" />
                            Sign out
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2 text-[#E6EDF3] hover:text-teal-400 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2 bg-[#161B22] border border-[#21262D] text-[#E6EDF3] rounded-full font-medium hover:bg-[#1C2128] hover:border-teal-500/40 hover:text-teal-400 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-md hover:bg-gray-800/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden bg-[#0B1221] border-t border-gray-800"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 pt-2 pb-4 space-y-1">
            <div className="pt-4 mt-4 border-t border-gray-800">
              {isAuthenticated ? (
                <>
                  <MobileNavLink to="/dashboard" label="Dashboard" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-3 text-base text-red-400 hover:bg-gray-800 hover:text-red-300"
                  >
                    <LogOut size={18} className="mr-3" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link
                    to="/login"
                    className="w-full px-4 py-2 text-center text-[#E6EDF3] hover:text-teal-400 font-medium rounded-md transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full px-4 py-2 text-center bg-[#161B22] border border-[#21262D] text-[#E6EDF3] rounded-md font-medium hover:bg-[#1C2128] hover:border-teal-500/40 hover:text-teal-400 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

// NavLink component with active state
function NavLink({ to, label, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  // If onClick is provided, use it instead of Link
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`text-base font-normal transition-all relative ${isActive ? "text-[#00FFD1]" : "text-white/90 hover:text-[#00FFD1]"
          }`}
      >
        {label}
        {isActive && (
          <motion.div
            layoutId="nav-underline"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00FFD1]"
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          />
        )}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`text-base font-normal transition-all relative ${isActive ? "text-[#00FFD1]" : "text-white/90 hover:text-[#00FFD1]"
        }`}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00FFD1]"
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        />
      )}
    </Link>
  );
}

// Mobile NavLink component
function MobileNavLink({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`block px-4 py-3 text-base ${isActive
          ? "text-[#00FFD1] bg-gray-800/50"
          : "text-white hover:bg-gray-800 hover:text-[#00FFD1]"
        } rounded-md transition-colors`}
    >
      {label}
    </Link>
  );
}
