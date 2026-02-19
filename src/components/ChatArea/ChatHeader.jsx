import React from 'react';
import { BsSearch, BsX } from 'react-icons/bs';

const ChatHeader = ({ searchQuery = "", onSearchChange }) => {
  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Chat
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Early preview agent — it may make mistakes. Double-check critical outputs.
            </p>
          </div>

          <div className="relative w-56 hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search messages..."
              className={`w-full py-1.5 pl-8 pr-8 rounded-lg text-sm bg-white/5 text-white placeholder-gray-500 border focus:outline-none focus:ring-1 transition-all ${
                searchQuery 
                  ? "border-teal-500/50 focus:border-teal-500/50 focus:ring-teal-500/50" 
                  : "border-white/10 focus:ring-[#00FFD1]/50 focus:border-[#00FFD1]/50"
              }`}
            />
            <BsSearch className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? "text-teal-400" : "text-gray-500"}`} size={14} />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange && onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-all"
              >
                <BsX size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;