import React, { useState, useEffect } from "react";
import { BsBuilding, BsPlus, BsCheck, BsX } from "react-icons/bs";
import { getMyPendingInvitations, respondToInvitation } from "../../services/companyService";
import { toast } from "react-hot-toast";

const CompanyListSidebar = ({ companies, selectedCompany, onSelectCompany, onAddCompany, isLoading, error }) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    fetchPendingInvites();
  }, []);

  const fetchPendingInvites = async () => {
    const { success, invitations } = await getMyPendingInvitations();
    if (success) setPendingInvites(invitations);
  };

  const handleResponse = async (invitationId, accept) => {
    try {
      setIsResponding(true);
      const { success, error } = await respondToInvitation(invitationId, accept);
      if (success) {
        toast.success(accept ? "Joined company!" : "Invitation declined");
        setPendingInvites(prev => prev.filter(i => i.id !== invitationId));
        if (accept) {
          // Refresh page or trigger parent to refetch companies
          window.location.reload();
        }
      } else {
        toast.error(error);
      }
    } catch {
      toast.error("Failed to respond to invitation");
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="w-full lg:w-64 flex-shrink-0 bg-[#0a0a0a] lg:border-r border-white/5 p-4 overflow-y-auto h-full pt-16 lg:pt-4">
      <div className="hidden lg:flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Companies</h2>
        <button
          onClick={onAddCompany}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title="Create New Company"
        >
          <BsPlus className="w-5 h-5 text-teal-400" />
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading companies...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && companies.length === 0 && pendingInvites.length === 0 && (
        <p className="text-gray-400 text-sm">No companies found.</p>
      )}

      <nav>
        {/* Pending Invitations Section */}
        {pendingInvites.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Pending Invitations
            </h3>
            <ul className="space-y-2">
              {pendingInvites.map((invite) => (
                <li key={invite.id} className="group relative flex items-center p-3 rounded-lg bg-teal-600/5 border border-teal-600/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-400 truncate">
                      {invite.company?.company_name}
                    </p>
                    <p className="text-[10px] text-gray-500">Wants you to join</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleResponse(invite.id, true)}
                      disabled={isResponding}
                      className="p-1 rounded bg-teal-600 text-white hover:bg-teal-500 transition-colors"
                      title="Accept"
                    >
                      <BsCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResponse(invite.id, false)}
                      disabled={isResponding}
                      className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                      title="Decline"
                    >
                      <BsX className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Existing Companies Section */}
        <ul className="space-y-2">
          {companies.map((company) => (
            <li key={company.id}>
              <button
                onClick={() => onSelectCompany(company)}
                className={`flex items-center w-full p-3 rounded-lg text-left transition-colors
                  ${selectedCompany?.id === company.id
                    ? "bg-teal-600/20 text-teal-400"
                    : "text-gray-300 hover:bg-white/5"}
                `}
              >
                <BsBuilding className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium truncate">{company.company_name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CompanyListSidebar;
