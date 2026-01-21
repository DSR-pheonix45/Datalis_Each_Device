import React from "react";
import { BsChevronDoubleLeft, BsChevronDoubleRight } from "react-icons/bs";
import { useTheme } from "../../context/ThemeContext";

const SidebarToggle = ({ isCollapsed, onToggle }) => {
  const { darkMode } = useTheme();

  return (
    <button
      onClick={onToggle}
      className={`absolute -right-4 top-1/2 transform -translate-y-1/2 z-10
        w-8 h-8 rounded-full shadow-md flex items-center justify-center
        transition-colors
        ${
          darkMode
            ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
            : "bg-white text-gray-600 hover:bg-gray-100"
        }`}
      aria-label="Toggle sidebar"
    >
      {isCollapsed ? (
        <BsChevronDoubleRight size={16} />
      ) : (
        <BsChevronDoubleLeft size={16} />
      )}
    </button>
  );
};

export default SidebarToggle;
