import React, { useState, useEffect, useCallback, useRef } from "react";
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
  BsBuilding,
  BsBox
} from "react-icons/bs";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import Card from "../components/shared/Card";
import Button from "../components/shared/Button";

// Sub-components
import OperationsView from "../components/Workbenches/OperationsView";
import InventoryView from "../components/Workbenches/InventoryView";
import InvestorView from "../components/Workbenches/InvestorView";
import LogsView from "../components/Workbenches/LogsView";
import DocumentSidebar from "../components/Workbenches/detail/DocumentSidebar";
import ReportGenerationModal from "../components/Workbenches/ReportGenerationModal";
import WorkbenchWelcome from "../components/Workbenches/WorkbenchWelcome";
import CreateRecordModal from "../components/Workbenches/CreateRecordModal";
import CompanyModal from "../components/Workbenches/CompanyModal";

export default function WorkbenchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workbench, setWorkbench] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Operations"); // Operations, Investor View, Logs & Records
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [checkingEmpty, setCheckingEmpty] = useState(true);
  const [isCreateRecordModalOpen, setIsCreateRecordModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const hasInitializedTab = useRef(false);

  const fetchWorkbench = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Only set loading true if it's the initial load for this ID
      // Use functional state update to check current workbench without adding it to dependencies
      setWorkbench(currentWorkbench => {
        // This is a hack to check current state without adding dependency
        // We only set loading if we don't have the workbench yet
        const isInitialLoad = !currentWorkbench || currentWorkbench.id !== id;
        if (isInitialLoad) {
          setLoading(true);
        }
        return currentWorkbench;
      });

      console.log("[DEBUG] WorkbenchDetail: Fetching workbench", id);
      
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
  }, [id, navigate, user, authLoading]); // Only depend on user.id

  const checkWorkbenchData = useCallback(async () => {
    if (!user) return;
    try {
      // Don't show loading spinner for background checks
      // setCheckingEmpty(true); 
      
      // Check transactions table instead of workbench_records
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: 'exact', head: true })
        .eq("workbench_id", id);

      if (error) {
        throw error;
      }

      if (!hasInitializedTab.current && count === 0) {
        setActiveTab("Welcome");
        hasInitializedTab.current = true;
      }
      
      // If we found data, make sure we mark initialized
      if (count > 0) {
        hasInitializedTab.current = true;
      }
      
    } catch (err) {
      console.error("Error checking workbench empty state:", err);
    } finally {
      setCheckingEmpty(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchWorkbench();
    checkWorkbenchData();
  }, [id, fetchWorkbench, checkWorkbenchData]);

  const handleWelcomeAction = (action) => {
    if (action === 'upload_document') {
      setIsSidebarOpen(true);
    } else if (action === 'create_transaction') {
      setIsCreateRecordModalOpen(true);
    } else if (action === 'talk_to_ai') {
      window.location.href = "http://localhost:5174/dashboard";
    }
  };

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

  const tabs = ["Operations", "Inventory", "Investor View", "Logs & Records"];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-teal-500/20 bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate("/dashboard/workbenches")}
            className="p-2 text-gray-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all"
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
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-white/5 border border-teal-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/30 transition-all w-64"
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/20 hover:text-teal-200 transition-all text-sm font-medium"
          >
            <BsFileEarmarkText className="text-base" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary shadow-lg shadow-primary/20 text-black hover:opacity-90 transition-all text-sm font-bold"
          >
            <BsStars className="text-base" />
            <span>Generate Report</span>
          </button>

          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all ml-2"
            title="Manage Team"
          >
            <BsBuilding className="text-lg" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-8 border-b border-teal-500/20 bg-[#0a0a0a]">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-semibold transition-all relative ${activeTab === tab
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
                }`}
            >
              <div className="flex items-center space-x-2">
                {tab === "Operations" && <BsBuilding className="text-base" />}
                {tab === "Inventory" && <BsBox className="text-base" />}
                {tab === "Investor View" && <BsArrowUpRight className="text-base" />}
                {tab === "Logs & Records" && <BsClockHistory className="text-base" />}
                <span>{tab}</span>
              </div>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {checkingEmpty ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {activeTab === "Welcome" && (
              <WorkbenchWelcome onAction={handleWelcomeAction} workbenchId={id} />
            )}
            {activeTab === "Operations" && (
              <OperationsView workbenchId={id} />
            )}
            {activeTab === "Inventory" && <InventoryView workbenchId={id} />}
            {activeTab === "Investor View" && <InvestorView workbenchId={id} />}
            {activeTab === "Logs & Records" && <LogsView workbenchId={id} />}
          </>
        )}
      </main>

      {/* Modals */}
      <CreateRecordModal
        isOpen={isCreateRecordModalOpen}
        onClose={() => setIsCreateRecordModalOpen(false)}
        workbenchId={id}
        onSuccess={() => {
          setIsCreateRecordModalOpen(false);
          checkWorkbenchData(); // Re-check to potentially clear empty state
        }}
      />

      {/* Right Sidebar - Documents */}
      <DocumentSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          checkWorkbenchData();
        }}
        workbenchId={id}
      />

      <ReportGenerationModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        workbenchId={id}
        workbenchName={workbench?.name}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        workbenchId={id}
      />
    </div>
  );
}
