import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BsCurrencyExchange, BsGlobe2, BsCheckLg, BsX } from "react-icons/bs";

export default function CurrencyModal({ isOpen, onClose, onConfirm, detectedCountry, defaultCurrency }) {
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency || "USD");
  const [isOther, setIsOther] = useState(false);
  const [customCurrency, setCustomCurrency] = useState("");

  useEffect(() => {
    if (defaultCurrency) {
      setSelectedCurrency(defaultCurrency);
      setIsOther(false);
    }
  }, [defaultCurrency]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalCurrency = isOther ? customCurrency.toUpperCase() : selectedCurrency;
    if (finalCurrency) {
      onConfirm(finalCurrency);
    }
  };

  const commonCurrencies = ["USD", "EUR", "GBP", "INR", "AED", "CAD", "AUD", "SGD"];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#0E1117] border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#161B22]/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BsCurrencyExchange className="text-teal-400" />
            Confirm Currency
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BsX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4 flex gap-3">
            <div className="bg-teal-500/20 p-2 rounded-full h-fit">
              <BsGlobe2 className="text-teal-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-200 font-medium">
                We detected you are in <span className="text-teal-400 font-bold">{detectedCountry || "Unknown Location"}</span>.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Are the financials in this file counted in <span className="text-white font-bold">{defaultCurrency || "USD"}</span>?
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Select Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {commonCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setSelectedCurrency(curr);
                    setIsOther(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    !isOther && selectedCurrency === curr
                      ? "bg-teal-500/20 border-teal-500 text-teal-400"
                      : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                  }`}
                >
                  {curr}
                </button>
              ))}
              <button
                onClick={() => setIsOther(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isOther
                    ? "bg-teal-500/20 border-teal-500 text-teal-400"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                Other
              </button>
            </div>

            {isOther && (
              <input
                type="text"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                placeholder="Enter currency code (e.g. JPY)"
                className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors uppercase"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#161B22]/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isOther && !customCurrency}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <BsCheckLg />
            Confirm & Upload
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
