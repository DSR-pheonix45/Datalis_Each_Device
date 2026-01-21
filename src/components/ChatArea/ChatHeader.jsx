import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BsSearch, BsBriefcase, BsX } from 'react-icons/bs';
import { useWorkbenchContext } from '../../hooks/useWorkbenchContext';

const ChatHeader = ({ workbench }) => {
  const { darkMode } = useTheme();
  const { detachWorkbench } = useWorkbenchContext();

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
              placeholder="Search messages..."
              className="w-full py-1.5 pl-8 pr-3 rounded-lg text-sm bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#00FFD1]/50 focus:border-[#00FFD1]/50 transition-all"
            />
            <BsSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          </div>
        </div>

        {workbench && (
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 -mb-1">
            <div className="flex items-center space-x-2">
              <BsBriefcase className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-100">{workbench.name}</p>
                <p className="text-xs text-blue-300">
                  {workbench.description || 'No description'}
                </p>
              </div>
            </div>
            <button
              onClick={detachWorkbench}
              className="p-1 rounded-full hover:bg-blue-500/20 text-blue-300 hover:text-white transition-colors"
              title="Detach workbench"
            >
              <BsX size={18} />
            </button>
          </div>
        )}

        <div className="relative w-full md:hidden">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full py-1.5 pl-8 pr-3 rounded-lg text-sm bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#00FFD1]/50 focus:border-[#00FFD1]/50 transition-all"
          />
          <BsSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;