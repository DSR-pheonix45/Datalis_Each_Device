import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { BsBuilding, BsX, BsBank, BsLink45Deg } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { createCompany } from "../../services/companyService";
import { decrementCredits, CREDIT_COSTS } from "../../services/creditsService";

export default function CompanyModal({ isOpen, onClose, onCompanyCreated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    company_name: "",
    gst_no: "",
    pan_no: "",
    registered_address: "",
    ca_name: "",
    ca_id: "",
  });

  const [connectBank, setConnectBank] = useState(false);
  const [bankData, setBankData] = useState({
    bank_name: "",
    account_number: "",
    ifsc: "",
    upi_id: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a company");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const creditsNeeded = CREDIT_COSTS.create_company;

    try {
      // Deduct credits for company creation
      // Action name should match the one in credit_costs table exactly
      const creditResult = await decrementCredits(
        user.id,
        creditsNeeded,
        "create_company"
      );

      if (!creditResult.success) {
        if (creditResult.error === "insufficient_credits") {
          toast.error(
            `Insufficient credits! Creating a company costs ${creditsNeeded} credits. You have ${creditResult.available || 0}.`,
            { duration: 4000 }
          );
        } else {
          toast.error(
            creditResult.message || "Failed to deduct credits. Please try again."
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Notify UI to update credits display
      window.dispatchEvent(new Event("creditsUpdated"));

      // Save company to database using service
      const companyData = {
        owner_id: user.id,
        company_name: formData.company_name,
        gst_number: formData.gst_no,
        pan_number: formData.pan_no,
        registered_address: formData.registered_address,
        ca_name: formData.ca_name,
        ca_id: formData.ca_id,
        bank_name: connectBank ? bankData.bank_name : null,
        bank_account_number: connectBank ? bankData.account_number : null,
      };

      const { success, company, error } = await createCompany(companyData);

      if (!success) throw new Error(error);

      console.log("Company created:", company);

      // Call parent callback if provided
      if (typeof onCompanyCreated === "function") {
        onCompanyCreated(company);
      }

      // Update UI - trigger sidebar refresh and other listeners
      window.dispatchEvent(new Event("creditsUpdated"));
      window.dispatchEvent(new Event("companyCreated"));

      toast.success("Company registered successfully!");
      onClose?.();

      // reset state
      setFormData({
        company_name: "",
        gst_no: "",
        pan_no: "",
        registered_address: "",
        ca_name: "",
        ca_id: "",
      });
      setBankData({ bank_name: "", account_number: "", ifsc: "", upi_id: "" });
      setConnectBank(false);
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error(typeof error === 'string' ? error : error.message || "Failed to create company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field, value) => {
    setBankData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-dm-sans">
      <div className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FFD1]/20 flex items-center justify-center">
              <BsBuilding className="text-[#00FFD1]" />
            </div>
            <h2 className="text-white text-lg font-semibold">
              Register New Company
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <BsX />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="company-name"
                >
                  Company Name
                </label>
                <input
                  id="company-name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="gst-no"
                >
                  GST Number
                </label>
                <input
                  id="gst-no"
                  value={formData.gst_no}
                  onChange={(e) => handleChange("gst_no", e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                />
              </div>

              <div>
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="pan-no"
                >
                  PAN Number
                </label>
                <input
                  id="pan-no"
                  value={formData.pan_no}
                  onChange={(e) => handleChange("pan_no", e.target.value)}
                  placeholder="AAAAA0000A"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="address"
                >
                  Registered Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.registered_address}
                  onChange={(e) =>
                    handleChange("registered_address", e.target.value)
                  }
                  placeholder="Enter complete registered address"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2] resize-none"
                />
              </div>

              <div>
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="ca-name"
                >
                  CA Name
                </label>
                <input
                  id="ca-name"
                  value={formData.ca_name}
                  onChange={(e) => handleChange("ca_name", e.target.value)}
                  placeholder="Chartered Accountant name"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                />
              </div>

              <div>
                <label
                  className="block text-sm text-white mb-2"
                  htmlFor="ca-id"
                >
                  CA ID
                </label>
                <input
                  id="ca-id"
                  value={formData.ca_id}
                  onChange={(e) => handleChange("ca_id", e.target.value)}
                  placeholder="CA membership number"
                  className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                />
              </div>
            </div>

            {/* Connect Bank Account */}
            <div className="border-t border-[#1F242C] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <BsBank />
                  <span className="font-medium">Connect Bank Account</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectBank((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${connectBank
                      ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                      : "bg-[#161B22] border-[#21262D] text-[#7D8590] hover:text-[#E6EDF3] hover:border-[#30363D]"
                    }`}
                >
                  {connectBank ? "Enabled" : "Enable"}
                </button>
              </div>

              {connectBank && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white mb-2">
                      Bank Name
                    </label>
                    <input
                      value={bankData.bank_name}
                      onChange={(e) =>
                        handleBankChange("bank_name", e.target.value)
                      }
                      placeholder="e.g., HDFC Bank"
                      className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white mb-2">
                      Account Number
                    </label>
                    <input
                      value={bankData.account_number}
                      onChange={(e) =>
                        handleBankChange("account_number", e.target.value)
                      }
                      placeholder="XXXXXXXXXXXX"
                      className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white mb-2">
                      IFSC
                    </label>
                    <input
                      value={bankData.ifsc}
                      onChange={(e) => handleBankChange("ifsc", e.target.value)}
                      placeholder="HDFC0000000"
                      className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white mb-2">
                      UPI ID (optional)
                    </label>
                    <input
                      value={bankData.upi_id}
                      onChange={(e) =>
                        handleBankChange("upi_id", e.target.value)
                      }
                      placeholder="name@bank"
                      className="w-full px-3 py-2 bg-[#0E1117] border border-[#1F242C] rounded-lg text-white placeholder-gray-400 focus:border-[#00C6C2] focus:outline-none focus:ring-1 focus:ring-[#00C6C2]"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2 text-xs text-gray-400">
                    <BsLink45Deg />
                    <span>
                      Later we can replace this with a secure provider (e.g.,
                      Plaid/FinBox). Fields are optional for now.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#1F242C] text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.company_name.trim() || isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#161B22] border border-[#21262D] text-[#E6EDF3] font-medium hover:bg-[#1C2128] hover:border-teal-500/40 hover:text-teal-400 disabled:opacity-50 disabled:hover:border-[#21262D] disabled:hover:text-[#E6EDF3] transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Company"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
