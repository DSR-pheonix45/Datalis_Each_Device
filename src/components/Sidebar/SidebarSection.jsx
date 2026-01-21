import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const SidebarSection = ({ title, isOpen, toggleSection, icon, children }) => {
  const { darkMode } = useTheme();

  return (
    <div className="border-b theme-transition border-border-light dark:border-border-dark">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={toggleSection}
      >
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <span className="text-gray-500 dark:text-gray-400">
          {icon}
        </span>
      </div>
      
      <div className={`sidebar-section-transition ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default SidebarSection;