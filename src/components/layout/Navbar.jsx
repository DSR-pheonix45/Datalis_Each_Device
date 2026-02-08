import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../common/BrandLogo";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '';

  return (
    <>
      {/* Product Launch Banner */}
      <Link to={isLocalhost ? "/signup" : "/maintenance"} className="block bg-[#171717] py-2 px-4 text-center hover:bg-[#262626] transition-colors">
        <div className="inline-flex items-center gap-2 text-sm font-mono font-medium text-white">
          <span className="uppercase tracking-wide">
            Dec. 31 Product Launch
          </span>
          <span className="underline">Sign Up</span>
        </div>
      </Link>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-50 px-6 md:px-10 py-4 h-20 transition-all duration-300 backdrop-blur-md border-b ${theme === "dark"
          ? "bg-black/50 border-white/10"
          : "bg-white/80 border-[#171717]"
          } ${isScrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center h-full">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src={theme === "dark" ? "/Datalis_Logo.png" : "/Datalis_Logo-2.png"}
              alt="Datalis"
              className="h-8 w-auto"
              loading="lazy"
              decoding="async"
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {/* Home Link */}
            <Link
              to="/"
              className={`relative group text-[14.4px] font-mono font-medium px-4 py-2 transition-all duration-200 ${theme === "dark" ? "text-white " : "text-[#292929] "
                }`}
            >
              Home
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#81E6D9] transition-transform duration-200 origin-left ${isActive("/")
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
                  }`}
              />
            </Link>

            {/* Product Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setIsProductOpen(true)}
              onMouseLeave={() => setIsProductOpen(false)}
            >
              <button
                className={`flex items-center gap-1 text-[14.4px] font-mono font-medium px-4 py-2 transition-all duration-200 relative ${theme === "dark" ? "text-white " : "text-[#292929] "
                  }`}
              >
                Product
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isProductOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#81E6D9] transition-transform duration-200 origin-left ${isProductOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </button>

              {/* Simple Dropdown Menu */}
              {isProductOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 pt-3"
                >
                  <div className={`w-64 rounded-xl border shadow-xl p-2 ${theme === "dark"
                    ? "bg-[#0a0a0a] border-white/10"
                    : "bg-white border-gray-200"
                    }`}
                  >
                    <Link
                      to="/product"
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-[#81E6D9]/10" : "bg-[#81E6D9]/15"}`}>
                        <svg className="w-5 h-5 text-[#81E6D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"}`}>Dabby AI</p>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>AI Financial Assistant</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            {/* About Link */}
            <Link
              to="/about"
              className={`relative group text-[14.4px] font-mono font-medium px-4 py-2 transition-all duration-200 ${theme === "dark" ? "text-white " : "text-[#292929] "
                }`}
            >
              About
              {/* Hover underline */}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#81E6D9] transition-transform duration-200 origin-left ${isActive("/about")
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
                  }`}
              ></span>
            </Link>

            {/* Features Link */}
            <Link
              to="/features"
              className={`relative group text-[14.4px] font-mono font-medium px-4 py-2 transition-all duration-200 ${theme === "dark" ? "text-white " : "text-[#292929] "
                }`}
            >
              Features
              {/* Hover underline */}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#81E6D9] transition-transform duration-200 origin-left ${isActive("/features")
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
                  }`}
              ></span>
            </Link>

            {/* Templates Link */}
            <Link
              to="/templates"
              className={`relative group text-[14.4px] font-mono font-medium px-4 py-2 transition-all duration-200 ${theme === "dark" ? "text-white " : "text-[#292929] "
                }`}
            >
              Templates
              {/* Hover underline */}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#81E6D9] transition-transform duration-200 origin-left ${isActive("/templates")
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
                  }`}
              ></span>
            </Link>
          </div>

          {/* CTA Section - Right */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-200 ${theme === "dark" ? "text-white " : "text-[#292929] "
                }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {user ? (
              <Link
                to={isLocalhost ? "/dashboard" : "/maintenance"}
                className={`px-6 py-2 text-base font-mono font-medium text-black bg-[#81E6D9] rounded-full border border-[#81E6D9] hover:bg-transparent transition-all duration-200 ${theme === "dark"
                  ? "hover:text-white hover:border-white"
                  : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                  }`}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to={isLocalhost ? "/signup" : "/maintenance"}
                  className={`px-6 py-2 text-base font-mono font-medium text-black bg-[#81E6D9] rounded-full border border-[#81E6D9] hover:bg-transparent transition-all duration-200 ${theme === "dark"
                    ? "hover:text-white hover:border-white"
                    : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                    }`}
                >
                  Sign Up
                </Link>
                <Link
                  to={isLocalhost ? "/login" : "/maintenance"}
                  className={`text-base font-mono font-normal px-6 py-2 border rounded-full transition-all duration-200 ${theme === "dark"
                    ? "text-white border-white/30 "
                    : "text-[#292929] border-[#292929] "
                    }`}
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${theme === "dark" ? "text-white" : "text-[#292929]"
              }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`md:hidden border-t py-4 absolute top-full left-0 right-0 overflow-hidden ${theme === "dark"
                ? "bg-black/95 border-white/10"
                : "bg-white/95 border-gray-200"
                }`}
            >
            <div className="flex flex-col gap-2 px-4">
              <Link
                to="/product"
                className={`text-[14.4px] font-mono font-medium px-4 py-3 text-left transition-colors duration-200 ${theme === "dark"
                  ? "text-white hover:text-[#81E6D9]"
                  : "text-[#292929] hover:text-[#0D9488]"
                  }`}
              >
                Product - Dabby AI
              </Link>
              <Link
                to="/about"
                className={`text-[14.4px] font-mono font-medium px-4 py-3 text-left transition-colors duration-200 ${theme === "dark"
                  ? "text-white hover:text-[#81E6D9]"
                  : "text-[#292929] hover:text-[#0D9488]"
                  }`}
              >
                About
              </Link>
              <Link
                to="/features"
                className={`text-[14.4px] font-mono font-medium px-4 py-3 text-left transition-colors duration-200 ${theme === "dark"
                  ? "text-white hover:text-[#81E6D9]"
                  : "text-[#292929] hover:text-[#0D9488]"
                  }`}
              >
                Features
              </Link>
              <Link
                to="/templates"
                className={`text-[14.4px] font-mono font-medium px-4 py-3 text-left transition-colors duration-200 ${theme === "dark"
                  ? "text-white hover:text-[#81E6D9]"
                  : "text-[#292929] hover:text-[#0D9488]"
                  }`}
              >
                Templates
              </Link>
              <hr
                className={
                  theme === "dark"
                    ? "border-white/10 my-2"
                    : "border-gray-200 my-2"
                }
              />

              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-4 py-3 text-left transition-colors duration-200 ${theme === "dark" ? "text-white" : "text-[#292929]"
                  }`}
              >
                {theme === "dark" ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    Switch to Dark Mode
                  </>
                )}
              </button>

              {user ? (
                <Link
                  to="/dashboard"
                  className={`px-6 py-3 text-base font-mono font-normal text-black bg-[#81E6D9] border border-[#81E6D9] hover:bg-transparent transition-colors duration-200 text-center rounded-full ${theme === "dark"
                    ? "hover:text-white hover:border-white"
                    : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                    }`}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className={`px-6 py-3 text-base font-mono font-normal text-black bg-[#81E6D9] border border-[#81E6D9] hover:bg-transparent transition-colors duration-200 text-center rounded-full ${theme === "dark"
                      ? "hover:text-white hover:border-white"
                      : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                      }`}
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className={`text-base font-mono font-normal px-4 py-3 transition-colors duration-200 ${theme === "dark"
                      ? "text-white hover:text-[#81E6D9]"
                      : "text-[#292929] hover:text-[#0D9488]"
                      }`}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  </>
);
}
