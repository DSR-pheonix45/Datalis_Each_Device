import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getCompanies } from "../services/companyService";
import CompanyListSidebar from "../components/CompanyListSidebar/CompanyListSidebar";
import CompanyWorkbenches from "../components/CompanyWorkbenches/CompanyWorkbenches";
import CompanyFileListSidebar from "../components/CompanyWorkbenches/CompanyFileListSidebar";
import WorkbenchFileViewer from "../components/WorkbenchFileViewer";
import CompanyModal from "../components/CompanyModal/CompanyModal";
import InviteMemberModal from "../components/CompanyModal/InviteMemberModal";
import CreateWorkbenchModal from "../components/workbenches/CreateWorkbenchModal";
import { UserPlus, Plus, ChevronLeft, Building2, FolderOpen, FileText, Menu } from "lucide-react";

const CompanyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedWorkbench, setSelectedWorkbench] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateWorkbenchModalOpen, setIsCreateWorkbenchModalOpen] = useState(false);
  
  // Mobile navigation state
  const [mobileView, setMobileView] = useState('companies'); // 'companies' | 'workbenches' | 'files' | 'viewer'

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { success, companies: fetchedCompanies, error: fetchError } = await getCompanies();
    if (success) {
      setCompanies(fetchedCompanies);
      if (fetchedCompanies.length > 0) {
        setSelectedCompany(fetchedCompanies[0]);
      }
    } else {
      setError(fetchError);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Auto-advance mobile view when selections are made
  useEffect(() => {
    if (selectedFile) setMobileView('viewer');
    else if (selectedWorkbench) setMobileView('files');
    else if (selectedCompany) setMobileView('workbenches');
  }, [selectedCompany, selectedWorkbench, selectedFile]);

  // Mobile back navigation
  const handleMobileBack = () => {
    if (mobileView === 'viewer') {
      setSelectedFile(null);
      setMobileView('files');
    } else if (mobileView === 'files') {
      setSelectedWorkbench(null);
      setMobileView('workbenches');
    } else if (mobileView === 'workbenches') {
      setSelectedCompany(null);
      setMobileView('companies');
    }
  };

  // Get mobile header title
  const getMobileTitle = () => {
    if (mobileView === 'viewer' && selectedFile) return selectedFile.file_name;
    if (mobileView === 'files' && selectedWorkbench) return selectedWorkbench.name;
    if (mobileView === 'workbenches' && selectedCompany) return selectedCompany.company_name;
    return 'Companies';
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#0a0a0a] text-gray-100 font-dm-sans overflow-hidden">
      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-[#0a0a0a] border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mobileView !== 'companies' && (
            <button onClick={handleMobileBack} className="flex items-center gap-1 text-gray-400 text-sm">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <span className="text-sm font-medium text-white truncate max-w-[200px]">
            {mobileView === 'companies' ? 'Companies' : getMobileTitle()}
          </span>
        </div>
        <button
          onClick={() => setIsCompanyModalOpen(true)}
          className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop: Company List Sidebar */}
      <div className={`${mobileView === 'companies' ? 'block' : 'hidden'} lg:block`}>
        <CompanyListSidebar
          companies={companies}
          selectedCompany={selectedCompany}
          onSelectCompany={(company) => {
            setSelectedCompany(company);
            setSelectedWorkbench(null);
            setMobileView('workbenches');
          }}
          onAddCompany={() => setIsCompanyModalOpen(true)}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Desktop: Company Workbenches Sidebar */}
      {selectedCompany && (
        <div className={`${mobileView === 'workbenches' ? 'block w-full lg:w-auto' : 'hidden'} lg:block`}>
          <CompanyWorkbenches
            companyId={selectedCompany.id}
            onSelectWorkbench={(workbench) => {
              setSelectedWorkbench(workbench);
              setSelectedFile(null);
              setMobileView('files');
            }}
          />
        </div>
      )}

      {/* Desktop: Company File List Sidebar */}
      {selectedWorkbench && (
        <div className={`${mobileView === 'files' ? 'block w-full lg:w-auto' : 'hidden'} lg:block`}>
          <CompanyFileListSidebar
            workbenchId={selectedWorkbench.id}
            selectedFile={selectedFile}
            onSelectFile={(file) => {
              setSelectedFile(file);
              setMobileView('viewer');
            }}
            onDeleteFile={() => { /* TODO: Implement file deletion */ }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden bg-[#0a0a0a] relative ${mobileView === 'viewer' || (!selectedCompany && mobileView === 'companies') ? 'block' : 'hidden lg:block'}`}>
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        {selectedCompany ? (
          <div className="relative z-10 h-full p-4 lg:p-8 overflow-y-auto">
            <div className="hidden lg:flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCompany.company_name}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Owner: {selectedCompany.owner?.full_name || selectedCompany.owner?.email || selectedCompany.owner_id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateWorkbenchModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 rounded-xl transition-all font-medium text-sm"
                >
                  <Plus size={18} />
                  Create Workbench
                </button>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 rounded-xl transition-all font-medium text-sm"
                >
                  <UserPlus size={18} />
                  Add Member
                </button>
              </div>
            </div>

            {selectedWorkbench ? (
              <div className="flex-1 flex flex-col">
                <h3 className="hidden lg:block text-xl font-bold text-white mb-4">Selected Workbench: {selectedWorkbench.name}</h3>
                {selectedFile ? (
                  <WorkbenchFileViewer
                    file={selectedFile}
                    onBack={() => setSelectedFile(null)}
                    onDownload={() => { /* TODO: Implement file download */ }}
                    onDelete={() => { /* TODO: Implement file deletion */ }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 relative z-10">
                    <h1 className="text-xl lg:text-2xl font-bold text-white mb-3 tracking-tight text-center">
                      No File Selected
                    </h1>
                    <p className="text-gray-400 mb-10 leading-relaxed text-sm max-w-sm mx-auto text-center">
                      Select a file from the sidebar to view its contents.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 relative z-10">
                <FolderOpen className="w-12 h-12 text-gray-600 mb-4" />
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-3 tracking-tight text-center">
                  No Workbench Selected
                </h1>
                <p className="text-gray-400 mb-6 leading-relaxed text-sm max-w-sm mx-auto text-center">
                  Select a workbench from the sidebar to view its contents.
                </p>
                <button
                  onClick={() => setIsCreateWorkbenchModalOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl transition-all font-medium text-sm"
                >
                  <Plus size={18} />
                  Create Workbench
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 relative z-10">
            <Building2 className="w-12 h-12 text-gray-600 mb-4" />
            <h1 className="text-xl lg:text-2xl font-bold text-white mb-3 tracking-tight text-center">
              {isLoading ? "Loading Companies..." : "No Companies Found"}
            </h1>
            {error && <p className="text-red-500 text-sm text-center">Error: {error}</p>}
            {!isLoading && !error && (
              <p className="text-gray-400 mb-6 leading-relaxed text-sm max-w-sm mx-auto text-center">
                You are not a member of any company yet. Create a new one or ask an admin to add you.
              </p>
            )}
            {!isLoading && !error && (
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-black font-semibold rounded-xl transition-all text-sm"
              >
                <Plus size={18} />
                Create New Company
              </button>
            )}
          </div>
        )}
      </main>

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onCompanyCreated={fetchCompanies}
      />

      {selectedCompany && (
        <>
          <InviteMemberModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            companyId={selectedCompany.id}
            companyName={selectedCompany.company_name}
          />
          <CreateWorkbenchModal
            isOpen={isCreateWorkbenchModalOpen}
            onClose={() => setIsCreateWorkbenchModalOpen(false)}
            companyId={selectedCompany.id}
            onSuccess={(newWorkbench) => {
              // Refresh workbenches list in CompanyWorkbenches component
              if (newWorkbench.type === 'company') {
                // It's a company workbench, it will show up on next fetch
                window.dispatchEvent(new Event("workbenchCreated"));
              }
              setIsCreateWorkbenchModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CompanyPage;
