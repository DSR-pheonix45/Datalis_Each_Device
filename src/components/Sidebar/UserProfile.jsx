import { useState } from 'react';
import { LogOut, User, Settings, Key, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function UserProfile() {
  const { darkMode } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get first name or first part of email
  const displayName = user?.user_metadata?.name || 
                      user?.email?.split('@')[0] || 
                      'User';
  
  // Get user initials for avatar
  const initials = displayName.charAt(0).toUpperCase();
  
  // Generate a unique color based on user email
  const generateColor = (email) => {
    if (!email) return { from: 'from-blue-500', to: 'to-blue-600' };
    
    const colors = [
      { from: 'from-blue-500', to: 'to-indigo-600' },
      { from: 'from-emerald-500', to: 'to-teal-600' },
      { from: 'from-violet-500', to: 'to-purple-600' },
      { from: 'from-pink-500', to: 'to-rose-600' },
      { from: 'from-amber-500', to: 'to-orange-600' },
    ];
    
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  const { from, to } = generateColor(user?.email);
  
  const menuItems = [
    {
      id: 'signout',
      label: 'Sign out',
      icon: LogOut,
      onClick: () => signOut(),
      className: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className={`relative px-3 py-3 border-t ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full rounded-lg p-2.5 transition-all duration-200 ${
          darkMode 
            ? 'hover:bg-gray-700 text-gray-200' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r ${from} ${to} flex items-center justify-center text-white font-medium shadow-md`}>
          {initials || <User size={20} />}
        </div>

        {/* User Info */}
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {displayName}
          </p>
          <p className={`text-xs truncate ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {user?.email || 'Not signed in'}
          </p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)} 
          />

          {/* Menu */}
          <div className={`absolute bottom-full left-0 w-full mb-2 rounded-lg shadow-lg border overflow-hidden z-50 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* User info section at top of dropdown */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${from} ${to} flex items-center justify-center text-white font-medium text-lg shadow-md`}>
                  {initials || <User size={24} />}
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayName}
                  </p>
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email || 'Not signed in'}
                  </p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="mt-3 flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 mr-2"></div>
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Online
                </span>
              </div>
            </div>
            
            {menuItems.map(({ id, label, icon: Icon, onClick, className }) => (
              <button
                key={id}
                onClick={() => {
                  setIsOpen(false);
                  onClick();
                }}
                className={`flex items-center w-full px-4 py-3 text-sm ${className} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <Icon size={16} className="mr-3" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
