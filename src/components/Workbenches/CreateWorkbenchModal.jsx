import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BsX, BsBuilding, BsInfoCircle, BsGlobe, BsCurrencyDollar, BsCalendarCheck } from "react-icons/bs";
import { useAuth } from "../../hooks/useAuth";
import { backendService } from "../../services/backendService";

export default function CreateWorkbenchModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("India");
  const [currency, setCurrency] = useState("INR");
  const [fyCycle, setFyCycle] = useState("April - March");
  const [booksStartDate, setBooksStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[DEBUG] CreateWorkbenchModal: Submitting form for "${name}"`);
      const workbench = await backendService.createWorkbench(
        name.trim(), 
        booksStartDate,
        `Workbench for ${name.trim()} - ${location}` // Sending a basic description
      );
      
      console.log("[DEBUG] CreateWorkbenchModal: Workbench created successfully:", workbench);
      onSuccess(workbench);
      onClose();
      setName("");
    } catch (err) {
      console.error("[DEBUG] CreateWorkbenchModal: Error creating workbench:", err);
      // Clean up the error message - if it's a FunctionsHttpError, the actual message might be in context
      const errorMessage = err.message || "Failed to create workbench. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-[#0E1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <BsBuilding className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Workbench</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <BsX className="text-2xl" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-2">
                <BsInfoCircle className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Workbench Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp Finance"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                />
              </div>

              {/* These fields are for UI consistency with the mockup, but not yet in schema */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <BsGlobe className="mr-2 opacity-50 inline-block" /> Location
                  </label>
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none cursor-not-allowed opacity-60"
                    disabled
                  >
                    <option value="India">India</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <BsCurrencyDollar className="mr-2 opacity-50 inline-block" /> Currency
                  </label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none cursor-not-allowed opacity-60"
                    disabled
                  >
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <BsCalendarCheck className="mr-2 opacity-50 inline-block" /> Fiscal Year Cycle
                </label>
                <select 
                  value={fyCycle}
                  onChange={(e) => setFyCycle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none cursor-not-allowed opacity-60"
                  disabled
                >
                  <option value="April - March">April - March</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <BsCalendarCheck className="mr-2 opacity-50 inline-block" /> Books Start Date
                </label>
                <input
                  type="date"
                  required
                  value={booksStartDate}
                  onChange={(e) => setBooksStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                />
                <p className="mt-2 text-[10px] text-gray-500">
                  The date from which actual company books start. Ledger entries before this date will be considered historical.
                </p>
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className={`flex-[2] px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                  loading || !name.trim()
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-[#81E6D9] text-black hover:bg-[#4FD1C5] shadow-lg shadow-teal-500/20"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <BsBuilding />
                    <span>Create Workbench</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center space-x-2">
            <BsInfoCircle className="text-teal-400" />
            <p className="text-[11px] text-gray-500">
              New workbenches are created with default India/INR settings as per current system configuration.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
