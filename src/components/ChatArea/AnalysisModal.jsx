
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AnalysisModal = ({ isOpen, onClose, analysisData }) => {
  if (!isOpen || !analysisData) return null;

  const { source, citations } = analysisData;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-sans">
        {/* Backdrop */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0D1117] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="p-6 text-center flex flex-col h-full overflow-hidden">
            {/* Header */}
            <h2 className="text-xl font-semibold text-white tracking-wide shrink-0">
              Reasoning & Sources
            </h2>
            
            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed mt-4 shrink-0">
              The AI used the following context chunks to derive its conclusion.
            </p>

            {/* Content Area - Scrollable */}
            <div className="mt-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-4">
                {/* Source Header */}
                <div className="bg-[#161B22] border border-white/5 rounded-lg p-3 flex items-center justify-center gap-2">
                    <span className="text-gray-500 text-xs font-mono">SOURCE:</span>
                    <span className="text-teal-400 text-xs font-mono break-all uppercase">
                        {source?.file || "GENERAL_KNOWLEDGE"}
                    </span>
                </div>

                {/* Citations or Default Message */}
                {citations && citations.length > 0 ? (
                    <div className="w-full text-left space-y-2">
                         <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Verified Evidence</span>
                             <div className="h-px flex-1 bg-white/5"></div>
                         </div>
                         <div className="space-y-2">
                            {citations.map((citation, idx) => (
                                <div key={idx} className="bg-[#161B22]/50 border border-teal-500/20 rounded-lg p-3 relative group hover:bg-[#161B22] transition-colors">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500/40 rounded-l-lg"></div>
                                    <p className="text-xs text-gray-300 font-mono pl-2 leading-relaxed italic">
                                        "{citation}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border border-dashed border-white/10 rounded-lg">
                        <span className="text-gray-500 text-[10px] italic">
                            (Representative Sample Used - No specific citation returned)
                        </span>
                    </div>
                )}
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors shrink-0"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default AnalysisModal;
