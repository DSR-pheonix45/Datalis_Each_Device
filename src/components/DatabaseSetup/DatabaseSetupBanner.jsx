/**
 * Database Setup Banner - Notifies users when migrations are needed
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function DatabaseSetupBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkDatabaseSetup = async () => {
      // Check if dismissed in this session
      const sessionDismissed = sessionStorage.getItem('db-setup-banner-dismissed');
      if (sessionDismissed) {
        setDismissed(true);
        return;
      }

      try {
        // Test if credits table exists and is accessible
        const { data, error } = await supabase
          .from('credits')
          .select('balance')
          .limit(1);

        if (error) {
          // 404 or schema errors mean migrations needed
          if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('column')) {
            setShowBanner(true);
          }
        }
      } catch (err) {
        console.warn('Database check error:', err);
        setShowBanner(true);
      }
    };

    checkDatabaseSetup();
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('db-setup-banner-dismissed', 'true');
  };

  const handleOpenGuide = () => {
    const migrationPath = 'backend/supabase/migrations/RUN_THIS_FIRST_complete_setup.sql';
    alert(`📋 Migration Setup Required\n\n` +
      `1. Open Supabase Dashboard (https://supabase.com/dashboard)\n` +
      `2. Go to SQL Editor → New Query\n` +
      `3. Copy content from:\n   ${migrationPath}\n` +
      `4. Paste and run the SQL\n` +
      `5. Refresh this page\n\n` +
      `See README_FIX_ERRORS.md for detailed instructions.`);
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4 backdrop-blur-md shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">⚠️</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-yellow-200 font-semibold text-sm mb-1">
              Database Setup Required
            </h3>
            <p className="text-yellow-100/80 text-xs mb-3">
              Your database needs a one-time migration to enable KPIs and credits tracking. 
              <span className="font-medium"> Currently using local storage fallback.</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleOpenGuide}
                className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-medium rounded hover:bg-yellow-400 transition-colors"
              >
                📋 Show Setup Instructions
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded hover:bg-white/20 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-200/60 hover:text-yellow-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
