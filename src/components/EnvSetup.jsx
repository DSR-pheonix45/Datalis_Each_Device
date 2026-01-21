import { useState, useEffect } from 'react';
import { AlertCircle, Check, Copy, Save } from 'lucide-react';

export default function EnvSetup() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if environment variables are set
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url) setSupabaseUrl(url);
    if (key) setSupabaseKey(key);
  }, []);
  
  const handleSave = () => {
    try {
      // In development, we can't actually modify .env files at runtime
      // So we'll use localStorage as a workaround
      localStorage.setItem('DATALIS_SUPABASE_URL', supabaseUrl);
      localStorage.setItem('DATALIS_SUPABASE_ANON_KEY', supabaseKey);
      
      setSaved(true);
      setError('');
      
      // Show success message briefly
      setTimeout(() => {
        setSaved(false);
      }, 3000);
      
      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Failed to save settings: ' + err.message);
    }
  };
  
  const copyEnvFile = () => {
    const envContent = `VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseKey}`;
    navigator.clipboard.writeText(envContent);
    alert('Copied to clipboard! Paste this into your .env file in the project root.');
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Supabase Configuration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {saved && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-400">Settings saved! Reloading page...</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Supabase URL
          </label>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://your-project.supabase.co"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Supabase Anon Key
          </label>
          <input
            type="text"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="your-anon-key"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save for this session
          </button>
          
          <button
            onClick={copyEnvFile}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            <Copy className="h-4 w-4" />
            Copy .env file
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-400">
        <p className="mb-2">Instructions:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Get your Supabase URL and anon key from your Supabase project dashboard</li>
          <li>Enter them above and click "Save for this session" for temporary use</li>
          <li>For permanent setup, click "Copy .env file" and create a .env file in your project root</li>
          <li>Restart your development server after creating the .env file</li>
        </ol>
      </div>
    </div>
  );
}