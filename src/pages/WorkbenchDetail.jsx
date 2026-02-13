import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  BsChevronLeft, 
  BsSearch, 
  BsFileEarmarkText, 
  BsStars,
  BsCheckCircleFill,
  BsClockHistory,
  BsExclamationTriangleFill,
  BsArrowUpRight,
  BsBuilding
} from "react-icons/bs";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import Card from "../components/shared/Card";
import Button from "../components/shared/Button";

// Sub-components
import OperationsView from "../components/Workbenches/OperationsView";
import InvestorView from "../components/Workbenches/InvestorView";
import LogsView from "../components/Workbenches/LogsView";
import DocumentSidebar from "../components/Workbenches/detail/DocumentSidebar";

export default function WorkbenchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workbench, setWorkbench] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("operations"); // operations, investor, records
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchWorkbench = useCallback(async () => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("[DEBUG] WorkbenchDetail: Fetching workbench", id);
      setLoading(true);
      const { data, error } = await supabase
        .from("workbenches")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[DEBUG] WorkbenchDetail: Error fetching workbench:", error);
        throw error;
      }
      
      console.log("[DEBUG] WorkbenchDetail: Response:", data);
      if (!data) {
        console.warn("[DEBUG] WorkbenchDetail: No workbench found for id", id);
        navigate("/dashboard/workbenches");
        return;
      }
      
      setWorkbench(data);
    } catch (err) {
      console.error("Error fetching workbench:", err);
      navigate("/dashboard/workbenches");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, user, authLoading]);

  useEffect(() => {
    fetchWorkbench();
  }, [id, fetchWorkbench]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!workbench) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Workbench Not Found</h2>
        <Button variant="primary" onClick={() => navigate("/dashboard/workbenches")}>
          Back to Workbenches
        </Button>
      </div>
    );
  }

  const tabs = ["Operations", "Investor View", "Logs & Records"];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigate("/dashboard/workbenches")}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <BsChevronLeft className="text-lg" />
          </button>
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">{workbench.name}</h1>
            </div>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Financial Workbench</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group hidden md:block">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-300 transition-colors" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-300/30 focus:border-primary-300/30 transition-all w-64"
            />
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
          >
            <BsFileEarmarkText className="text-base" />
            <span>Documents</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary shadow-lg shadow-primary/20 text-black hover:opacity-90 transition-all text-sm font-bold">
            <BsStars className="text-base" />
            <span>Generate Report</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-8 border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-semibold transition-all relative ${
                activeTab === tab 
                  ? "text-white" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab === "Operations" && <BsBuilding className="text-base" />}
                {tab === "Investor View" && <BsArrowUpRight className="text-base" />}
                {tab === "Logs & Records" && <BsClockHistory className="text-base" />}
                <span>{tab}</span>
              </div>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "Operations" && <OperationsView workbenchId={id} />}
        {activeTab === "Investor View" && <InvestorView workbenchId={id} />}
        {activeTab === "Logs & Records" && <LogsView workbenchId={id} />}
      </main>

      {/* Right Sidebar - Documents */}
      <DocumentSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        workbenchId={id}
      />
    </div>
  );
}
