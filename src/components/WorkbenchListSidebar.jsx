import { useState } from "react";
import {
  BsChevronLeft,
  BsChevronRight,
  BsFolder,
  BsSearch,
  BsPlus,
  BsTrash,
  BsThreeDotsVertical,
  BsCollection
} from "react-icons/bs";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

export default function WorkbenchListSidebar({
  workbenches = [],
  selectedWorkbench,
  onSelect = () => { },
  onCreateNew = () => { },
  onDelete = () => { },
  isLoading = false,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeleteWorkbench = async (e, workbench) => {
    e.stopPropagation();

    if (
      !window.confirm(
        `Are you sure you want to delete "${workbench.name}"? This will also delete all files in this workbench.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(workbench.id);

      // First delete all files in the workbench
      const { error: filesError } = await supabase
        .from("workbench_files")
        .delete()
        .eq("workbench_id", workbench.id);

      if (filesError) {
        console.error("Error deleting workbench files:", filesError);
        // Continue anyway
      }

      // Then delete the workbench
      const { error } = await supabase
        .from("workbenches")
        .delete()
        .eq("id", workbench.id);

      if (error) throw error;

      toast.success(`Deleted "${workbench.name}"`);
      onDelete(workbench.id);

      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent("workbenchDeleted"));
    } catch (error) {
      console.error("Error deleting workbench:", error);
      toast.error("Failed to delete workbench");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredWorkbenches = workbenches.filter((wb) =>
    wb?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col bg-[#0E1117] border-r border-white/5 transition-all duration-300 
        sm:h-full
        ${isExpanded ? "sm:w-72 w-full" : "sm:w-16 w-full"}
        ${!isExpanded ? "hidden sm:flex" : ""}
      `}
    >
      {/* Sidebar Header */}
      <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between h-14 sm:h-16">
        {isExpanded ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <BsCollection className="w-4 h-4" />
            </div>
            <span className="font-semibold text-white tracking-tight">Workbenches</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mx-auto">
            <BsCollection className="w-4 h-4" />
          </div>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BsChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isExpanded && (
        <div className="py-4 flex justify-center border-b border-white/5">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BsChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Search Toggle */}
          <div className="relative group">
            <BsSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-9 pr-3 py-2 bg-[#161B22] border border-white/5 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold uppercase tracking-wide rounded-lg transition-all shadow-lg shadow-teal-900/20"
          >
            <BsPlus className="w-4 h-4" />
            New Workbench
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-5 h-5 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            {isExpanded && <span className="text-xs text-gray-500">Loading workspaces...</span>}
          </div>
        ) : filteredWorkbenches.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#161B22] border border-white/5 flex items-center justify-center">
              <BsFolder className="text-xl text-gray-600" />
            </div>
            <p className="text-gray-500 text-xs mb-1">
              {searchQuery ? "No results found" : "No workbenches yet"}
            </p>
            <p className="text-gray-600 text-[10px]">
              {searchQuery ? "Try a different search" : "Create one to get started"}
            </p>
          </div>
        ) : (
          filteredWorkbenches.map((workbench) => (
            <div
              key={workbench.id}
              onClick={() => onSelect(workbench)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${selectedWorkbench?.id === workbench.id
                  ? "bg-teal-500/10 border-teal-500/20 text-white"
                  : "text-gray-400 hover:bg-[#161B22] hover:text-gray-200 hover:border-white/5"
                }`}
            >
              <BsFolder
                className={`w-4 h-4 flex-shrink-0 transition-colors ${selectedWorkbench?.id === workbench.id ? "text-teal-400" : "text-gray-500 group-hover:text-gray-400"
                  }`}
              />

              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate mb-0.5 ${selectedWorkbench?.id === workbench.id ? "text-teal-50" : "text-gray-300"}`}>
                      {workbench.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${workbench.type === 'company'
                          ? 'text-purple-400'
                          : 'text-teal-500' // Using Teal for Personal label as requested
                        }`}>
                        {workbench.type || 'Personal'}
                      </span>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[10px] text-gray-600 truncate">
                        {new Date(workbench.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {deletingId === workbench.id ? (
                    <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteWorkbench(e, workbench)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                      title="Delete workbench"
                    >
                      <BsTrash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
