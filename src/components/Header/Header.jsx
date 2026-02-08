import React, { useState } from "react";
import {
  BsThreeDots,
  BsGear,
  BsBoxArrowRight,
  BsBuilding,
} from "react-icons/bs";
import { HiChevronDown } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header({
  companies = [],
  onMobileMenuClick,
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use real companies from props if available, otherwise fallback to empty array
  const organizations = companies.length > 0 
    ? companies.map(c => ({ id: c.company_id, name: c.company_name }))
    : [];
  
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Sync selectedOrg with organizations when they load
  React.useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0]);
    }
  }, [organizations, selectedOrg]);

  return (
    <>
      <div
        className="bg-black/40 backdrop-blur-md px-3 sm:px-4 lg:px-6 border-b border-white/5 sticky top-0 z-30"
        style={{
          height: "56px",
        }}
      >
        <div className="flex items-center justify-between h-full">
          {/* Left Section - Mobile Menu + Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Hamburger Menu - Only visible below lg */}
            <button
              onClick={onMobileMenuClick}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <a 
              href="/" 
              className="flex items-center space-x-2 group"
            >
              <img 
                src="/dabby-logo.svg"
                alt="Dabby Logo"
                className="h-7 w-7 sm:h-8 sm:w-8"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                Dabby
              </span>
            </a>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Unified Action Toolbar - Responsive */}
            <div className="hidden sm:flex items-center p-1 bg-white/5 border border-white/10 rounded-lg">
              {/* Organization Dropdown */}
              <div className="relative border-r border-white/10 pr-1 hidden lg:block">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/5 rounded-md text-white transition-all font-dm-sans"
                >
                  <BsBuilding className="text-teal-400 text-xs" />
                  <span className="text-sm font-medium">
                    {selectedOrg ? selectedOrg.name : "Select Org"}
                  </span>
                  <HiChevronDown className="text-gray-500" />
                </button>

                {isOrgDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a0a] rounded-lg shadow-xl border border-white/10 z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Select Organisation
                    </div>
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          setSelectedOrg(org);
                          setIsOrgDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                          selectedOrg?.id === org.id
                            ? "bg-teal-500/10 text-teal-400"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-medium">{org.name}</span>
                        {selectedOrg?.id === org.id && (
                          <div className="w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={() => {
                          navigate("/dashboard/settings");
                          setIsOrgDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      >
                        <BsGear className="text-xs" />
                        <span className="text-xs">Manage Organisations</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Dropdown - Hidden on mobile */}
              <div className="relative border-r border-white/10 pr-1 hidden md:block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/5 rounded-md text-white transition-all font-dm-sans"
                >
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                  <span className="text-sm font-medium">Dabby Consultant</span>
                  <HiChevronDown className="text-gray-500" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-2 w-48 bg-[#0a0a0a] rounded-lg shadow-xl border border-white/10 z-50 p-1">
                    <div className="flex items-center space-x-2 px-3 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                      <span className="text-white text-sm">
                        Dabby Consultant
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Overflow Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BsThreeDots className="text-lg" />
              </button>

              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-lg shadow-lg border border-white/10 z-50">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        navigate("/dashboard/settings");
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-[#9BA3AF] hover:bg-[#161B22] hover:text-white rounded-md transition-colors"
                    >
                      <BsGear className="text-sm" />
                      <span className="text-sm">Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-[#9BA3AF] hover:bg-[#161B22] hover:text-white rounded-md transition-colors"
                    >
                      <BsBoxArrowRight className="text-sm" />
                      <span className="text-sm">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
