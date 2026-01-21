import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BsBriefcase, BsX, BsSearch, BsCheck2, BsFolder } from "react-icons/bs";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

export default function AttachWorkbenchModal({
  isOpen,
  onClose,
  onAttach,
  currentWorkbench,
}) {
  const { user } = useAuth();
  const [workbenches, setWorkbenches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkbench, setSelectedWorkbench] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchWorkbenches();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      setSelectedWorkbench(currentWorkbench || null);
    }
  }, [currentWorkbench, isOpen]);

  const fetchWorkbenches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workbenches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkbenches(data || []);
    } catch (error) {
      console.error("Error fetching workbenches:", error);
      toast.error("Failed to load workbenches");
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkbenches = workbenches.filter((wb) =>
    wb?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateLastUsed = async (workbenchId) => {
    if (!user?.id || !workbenchId) return;
    
    supabase
      .from("workbenches")
      .update({ last_used_by: user.id })
      .eq("id", workbenchId)
      .then(({ error }) => {
        if (error && error.code === "PGRST204") {
          console.warn("last_used_by column missing in workbenches table.");
        }
      });
  };

  const handleSelectWorkbench = (workbench) => {
    console.log("Selected workbench:", workbench);
    setSelectedWorkbench(workbench);
  };

  const handleAttach = () => {
    if (selectedWorkbench) {
      console.log("Attaching workbench:", selectedWorkbench);
      updateLastUsed(selectedWorkbench.id);
      onAttach(selectedWorkbench);
      toast.success(`Attached "${selectedWorkbench.name}"`);
      onClose();
    }
  };

  const handleDoubleClick = (workbench) => {
    console.log("Double-click attach:", workbench);
    updateLastUsed(workbench.id);
    onAttach(workbench);
    toast.success(`Attached "${workbench.name}"`);
    onClose();
  };

  const handleDetach = () => {
    onAttach(null);
    toast.success("Workbench detached");
    onClose();
  };

  if (!isOpen) return null;

  // Use portal to render at document body level for proper centering
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0E1117] border border-gray-800/60 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <BsBriefcase className="text-violet-400 text-lg" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                Attach Workbench
              </h2>
              <p className="text-gray-500 text-xs">
                Select a workbench to use as context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <BsX className="text-xl" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-800/40">
          <div className="relative">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              placeholder="Search workbenches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        {/* Workbench List */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500/30 border-t-violet-500"></div>
            </div>
          ) : filteredWorkbenches.length === 0 ? (
            <div className="py-8 text-center">
              <BsFolder className="text-3xl text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? "No workbenches found" : "No workbenches yet"}
              </p>
              {!searchQuery && (
                <p className="text-gray-600 text-xs mt-1">
                  Create a workbench from the sidebar
                </p>
              )}
            </div>
          ) : (
            <div className="py-2">
              {filteredWorkbenches.map((workbench) => (
                <button
                  key={workbench.id}
                  type="button"
                  onClick={() => handleSelectWorkbench(workbench)}
                  onDoubleClick={() => handleDoubleClick(workbench)}
                  className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors ${
                    selectedWorkbench?.id === workbench.id
                      ? "bg-violet-500/10 border-l-2 border-violet-500"
                      : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedWorkbench?.id === workbench.id
                        ? "bg-violet-500/20"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <BsFolder
                      className={`text-sm ${
                        selectedWorkbench?.id === workbench.id
                          ? "text-violet-400"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        selectedWorkbench?.id === workbench.id
                          ? "text-violet-300"
                          : "text-gray-300"
                      }`}
                    >
                      {workbench.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {workbench.type || "personal"} •{" "}
                      {new Date(workbench.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedWorkbench?.id === workbench.id && (
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <BsCheck2 className="text-white text-xs" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800/60 flex items-center gap-3">
          {currentWorkbench && (
            <button
              onClick={handleDetach}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Detach
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAttach}
            disabled={!selectedWorkbench}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedWorkbench
                ? "bg-violet-500 hover:bg-violet-400 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            Attach
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
