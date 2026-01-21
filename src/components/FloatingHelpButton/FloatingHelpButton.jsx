import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BsQuestionLg, BsX } from "react-icons/bs";
import { HiOutlineSparkles, HiOutlineCommandLine } from "react-icons/hi2";
import { IoHelpCircleOutline } from "react-icons/io5";
import KeyboardShortcutsModal from "../KeyboardShortcuts/KeyboardShortcutsModal";
import OnboardingTour from "../Onboarding/OnboardingTour";

export default function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if user is new (hasn't completed onboarding)
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(
      "dabby_onboarding_completed"
    );
    if (!hasCompletedOnboarding) {
      setIsNewUser(true);
      // Auto-show tour for new users after a short delay
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest(".floating-help-wrapper")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Global keyboard shortcut for "?"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isTyping =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA" ||
          activeElement?.isContentEditable;
        if (!isTyping) {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    setIsNewUser(false);
    localStorage.setItem("dabby_onboarding_completed", "true");
  };

  const menuItems = [
    {
      icon: HiOutlineSparkles,
      label: "Product Tour",
      description: "Learn how to use Dabby",
      badge: isNewUser ? "Recommended" : null,
      onClick: () => {
        setShowTour(true);
        setIsOpen(false);
      },
    },
    {
      icon: HiOutlineCommandLine,
      label: "Keyboard Shortcuts",
      description: "Navigate faster with shortcuts",
      shortcut: "?",
      onClick: () => {
        setShowShortcuts(true);
        setIsOpen(false);
      },
    },
  ];

  return createPortal(
    <>
      {/* Floating Help Button */}
      <div className="floating-help-wrapper fixed bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-16 right-0 w-72"
            >
              {/* Professional dark card */}
              <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <IoHelpCircleOutline className="text-teal-400 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">
                        Help Center
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Resources & guides
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  {menuItems.map((item, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 2 }}
                      onClick={item.onClick}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/20 transition-colors">
                        <item.icon className="text-teal-400 text-lg" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-200 group-hover:text-teal-400 transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] font-medium bg-teal-500/15 text-teal-400 px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && (
                            <span className="text-[10px] font-mono bg-black/40 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-3 py-2.5 bg-black/20 border-t border-white/10">
                  <p className="text-[10px] text-gray-500 text-center">
                    Press{" "}
                    <span className="text-gray-400 font-mono bg-white/5 border border-white/10 px-1 rounded">
                      ?
                    </span>{" "}
                    anytime for shortcuts
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
        >
          {/* Subtle glow effect - Removed as requested */}
          {/* <div
            className={`absolute inset-0 rounded-full bg-teal-500/40 blur-lg transition-opacity duration-300 ${
              isHovered || isOpen ? "opacity-60" : "opacity-0"
            }`}
          /> */}

          {/* Button */}
          <div
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isOpen
                ? "bg-white/10 border border-white/20"
                : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
              }`}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <BsX className="text-xl text-[#7D8590]" />
                </motion.div>
              ) : (
                <motion.div
                  key="help"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <BsQuestionLg className="text-lg text-teal-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New user pulse indicator */}
          {isNewUser && !isOpen && (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500 border-2 border-[#0E1117]"></span>
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
    </>,
    document.body
  );
}
