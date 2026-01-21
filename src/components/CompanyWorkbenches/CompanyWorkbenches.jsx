import React, { useState, useEffect } from "react";
import { BsFolder, BsPlus } from "react-icons/bs";
import { getCompanyWorkbenches } from "../../services/companyService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const CompanyWorkbenches = ({ companyId, onSelectWorkbench }) => {
  const { user } = useAuth();
  const [workbenches, setWorkbenches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkbench, setSelectedWorkbench] = useState(null);

  useEffect(() => {
    const fetchWorkbenches = async () => {
      if (!companyId) return;
      setIsLoading(true);
      setError(null);
      const { success, workbenches: fetchedWorkbenches, error: fetchError } = await getCompanyWorkbenches(companyId);
      if (success) {
        setWorkbenches(fetchedWorkbenches);
        if (fetchedWorkbenches.length > 0 && !selectedWorkbench) {
          setSelectedWorkbench(fetchedWorkbenches[0]);
          onSelectWorkbench(fetchedWorkbenches[0]);
        }
      } else {
        setError(fetchError);
      }
      setIsLoading(false);
    };

    fetchWorkbenches();

    // Listen for workbench creation to refresh the list
    const handleWorkbenchCreated = () => {
      fetchWorkbenches();
    };

    window.addEventListener("workbenchCreated", handleWorkbenchCreated);
    return () => {
      window.removeEventListener("workbenchCreated", handleWorkbenchCreated);
    };
  }, [companyId, onSelectWorkbench, selectedWorkbench]);

  const handleSelect = async (workbench) => {
    setSelectedWorkbench(workbench);
    onSelectWorkbench(workbench);

    // Update last_used_by
    if (user?.id) {
      supabase
        .from("workbenches")
        .update({ last_used_by: user.id })
        .eq("id", workbench.id)
        .then(({ error }) => {
          if (error && error.code === "PGRST204") {
            console.warn("last_used_by column missing in workbenches table.");
          }
        });
    }
  };

  return (
    <div className="w-72 flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Workbenches</h2>
        <button
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title="Create New Workbench"
          // TODO: Add functionality to open a modal for creating a new workbench
        >
          <BsPlus className="w-5 h-5 text-teal-400" />
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading workbenches...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && workbenches.length === 0 && (
        <p className="text-gray-400 text-sm">No workbenches found for this company.</p>
      )}

      <nav>
        <ul className="space-y-2">
          {workbenches.map((workbench) => (
            <li key={workbench.id}>
              <button
                onClick={() => handleSelect(workbench)}
                className={`flex items-center w-full p-3 rounded-lg text-left transition-colors
                  ${selectedWorkbench?.id === workbench.id
                    ? "bg-teal-600/20 text-teal-400"
                    : "text-gray-300 hover:bg-white/5"}
                `}
              >
                <BsFolder className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium truncate">{workbench.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CompanyWorkbenches;
