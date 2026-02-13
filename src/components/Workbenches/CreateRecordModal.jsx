import React, { useState } from "react";
import { 
  BsX, 
  BsReceipt, 
  BsShieldCheck, 
  BsPieChart, 
  BsCheck2,
  BsArrowUpRight,
  BsArrowDownLeft,
  BsCalendar4Event,
  BsCreditCard,
  BsBuilding,
  BsPersonPlus,
  BsBriefcase,
  BsHash,
  BsChatLeftText,
  BsFileEarmarkText,
  BsJournalText
} from "react-icons/bs";
import { backendService } from "../../services/backendService";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

const RECORD_TYPES = [
  { id: 'transaction', label: 'Transaction', icon: BsReceipt, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  { id: 'compliance', label: 'Compliance', icon: BsShieldCheck, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  { id: 'budget', label: 'Budget', icon: BsPieChart, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { id: 'party', label: 'Party', icon: BsPersonPlus, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
];

export default function CreateRecordModal({ isOpen, onClose, workbenchId, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [workbenchAccounts, setWorkbenchAccounts] = useState([]);
  const [partyAccounts, setPartyAccounts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    record_type: 'transaction',
    summary: '',
    metadata: {
      // Common
      amount: '',
      notes: '',
      
      // Transaction specific
      direction: 'debit',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_type: 'bank',
      party_id: '',
      party_account_id: '',
      workbench_account_id: '',
      external_reference: '',
      source_document_id: '',
      invoice_document_id: '',
      purpose: '',
      
      // Compliance specific
      name: '',
      form: '',
      deadline: '',
      status: 'pending',
      filed_date: new Date().toISOString().split('T')[0],
      
      // Budget specific
      budget_name: '',
      department: '',

      // Party specific
      party_name: '',
      party_type: 'customer',
      gstin: '',
      pan: ''
    }
  });

  useEffect(() => {
    if (isOpen && workbenchId) {
      fetchParties();
      fetchWorkbenchAccounts();
      fetchDocuments();
    }
  }, [isOpen, workbenchId]);

  useEffect(() => {
    if (formData.metadata.party_id) {
      fetchPartyAccounts(formData.metadata.party_id);
    } else {
      setPartyAccounts([]);
    }
  }, [formData.metadata.party_id]);

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from("workbench_parties")
        .select("id, name, party_type")
        .eq("workbench_id", workbenchId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchWorkbenchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("workbench_accounts")
        .select("id, account_name, account_type, account_identifier")
        .eq("workbench_id", workbenchId)
        .eq("is_active", true)
        .order("account_name");

      if (error) throw error;
      setWorkbenchAccounts(data || []);
    } catch (err) {
      console.error("Error fetching workbench accounts:", err);
    }
  };

  const fetchPartyAccounts = async (partyId) => {
    try {
      const { data, error } = await supabase
        .from("party_accounts")
        .select("id, account_name, account_type, account_identifier")
        .eq("party_id", partyId)
        .order("account_name");

      if (error) throw error;
      setPartyAccounts(data || []);
    } catch (err) {
      console.error("Error fetching party accounts:", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("workbench_documents")
        .select("id, file_path, document_type")
        .eq("workbench_id", workbenchId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.summary) {
      toast.error("Please provide a summary");
      return;
    }

    try {
      setLoading(true);

      // Call the backend service which invokes the Edge Function
      await backendService.createRecord(
        workbenchId,
        formData.record_type,
        formData.summary,
        formData.metadata
      );

      toast.success(`${formData.record_type.charAt(0).toUpperCase() + formData.record_type.slice(1)} created successfully`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error creating record:", err);
      toast.error(err.message || "Failed to create record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">New Record</h2>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Add a new entry to the workbench ledger</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"
          >
            <BsX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-8 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 transition-colors">
            {/* Record Type Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Record Type</label>
            <div className="grid grid-cols-4 gap-4">
              {RECORD_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = formData.record_type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, record_type: type.id })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? `${type.bgColor} border-white/20 ${type.color} ring-1 ring-white/10` 
                        : "bg-white/2 border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-400"
                    }`}
                  >
                    <Icon className={`text-xl mb-2.5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Summary</label>
            <textarea
              required
              rows={3}
              placeholder={
                formData.record_type === 'transaction' ? "e.g. Monthly rent payment for office space" :
                formData.record_type === 'compliance' ? "e.g. Annual GST return filing for FY25-26" :
                formData.record_type === 'party' ? "e.g. Add new vendor for cloud services" :
                "e.g. FY26 Marketing budget allocation for H1"
              }
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Type-Specific Fields */}
          <div className="space-y-6">
            {formData.record_type === 'transaction' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Direction</label>
                    <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, metadata: { ...formData.metadata, direction: 'debit' } })}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all duration-300 ${
                          formData.metadata.direction === 'debit' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5' : 'text-gray-500 hover:text-gray-400'
                        }`}
                      >
                        <BsArrowUpRight className="text-xs" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Debit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, metadata: { ...formData.metadata, direction: 'credit' } })}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all duration-300 ${
                          formData.metadata.direction === 'credit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'text-gray-500 hover:text-gray-400'
                        }`}
                      >
                        <BsArrowDownLeft className="text-xs" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Credit</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Amount</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium group-focus-within:text-primary transition-colors">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={formData.metadata.amount}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, amount: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Date</label>
                    <div className="relative group">
                      <BsCalendar4Event className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <input
                        type="date"
                        required
                        value={formData.metadata.transaction_date}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, transaction_date: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all [color-scheme:dark] font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Payment Type</label>
                    <div className="relative group">
                      <BsCreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.metadata.payment_type}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, payment_type: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="bank" className="bg-[#0A0A0A]">Bank Transfer</option>
                        <option value="upi" className="bg-[#0A0A0A]">UPI</option>
                        <option value="gateway" className="bg-[#0A0A0A]">Payment Gateway</option>
                        <option value="wallet" className="bg-[#0A0A0A]">Wallet</option>
                        <option value="cash" className="bg-[#0A0A0A]">Cash</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Counterparty (Customer/Vendor)</label>
                  <div className="relative group">
                    <BsBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                    <select
                      required
                      value={formData.metadata.party_id}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, party_id: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                    >
                      <option value="" className="bg-[#0A0A0A]">Select a party...</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#0A0A0A]">
                          {p.name} ({p.party_type})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {formData.metadata.party_id && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Party Account</label>
                    <div className="relative group">
                      <BsCreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.metadata.party_account_id}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, party_account_id: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="" className="bg-[#0A0A0A]">Select party account (Optional)...</option>
                        {partyAccounts.map(a => (
                          <option key={a.id} value={a.id} className="bg-[#0A0A0A]">
                            {a.account_name} ({a.account_type} - {a.account_identifier})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Workbench Account</label>
                  <div className="relative group">
                    <BsBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                    <select
                      value={formData.metadata.workbench_account_id}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, workbench_account_id: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                    >
                      <option value="" className="bg-[#0A0A0A]">Select workbench account (Optional)...</option>
                      {workbenchAccounts.map(a => (
                        <option key={a.id} value={a.id} className="bg-[#0A0A0A]">
                          {a.account_name} ({a.account_type} - {a.account_identifier})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">External Reference</label>
                    <div className="relative group">
                      <BsHash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        required={formData.metadata.payment_type !== 'cash'}
                        placeholder="Txn ID / Ref No"
                        value={formData.metadata.external_reference}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, external_reference: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Purpose</label>
                    <div className="relative group">
                      <BsChatLeftText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Purpose of txn"
                        value={formData.metadata.purpose}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, purpose: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Source Document</label>
                    <div className="relative group">
                      <BsFileEarmarkText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.metadata.source_document_id}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, source_document_id: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="" className="bg-[#0A0A0A]">Select document (Optional)...</option>
                        {documents.map(d => (
                          <option key={d.id} value={d.id} className="bg-[#0A0A0A]">
                            {d.file_path.split('/').pop()} ({d.document_type})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Invoice Document</label>
                    <div className="relative group">
                      <BsJournalText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        required={formData.metadata.payment_type === 'cash'}
                        value={formData.metadata.invoice_document_id}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, invoice_document_id: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="" className="bg-[#0A0A0A]">Select invoice (Required for Cash)...</option>
                        {documents.filter(d => d.document_type === 'invoice').map(d => (
                          <option key={d.id} value={d.id} className="bg-[#0A0A0A]">
                            {d.file_path.split('/').pop()}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.record_type === 'party' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Party Name</label>
                  <div className="relative group">
                    <BsBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amazon Web Services"
                      value={formData.metadata.party_name}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, party_name: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Party Type</label>
                    <div className="relative group">
                      <BsBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.metadata.party_type}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, party_type: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="customer" className="bg-[#0A0A0A]">Customer</option>
                        <option value="vendor" className="bg-[#0A0A0A]">Vendor</option>
                        <option value="both" className="bg-[#0A0A0A]">Both</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.metadata.gstin}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, gstin: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">PAN (Optional)</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.metadata.pan}
                    onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, pan: e.target.value } })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {formData.record_type === 'compliance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Compliance Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GST Monthly Filing"
                      value={formData.metadata.name}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, name: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Form / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. GSTR-3B"
                      value={formData.metadata.form}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, form: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Deadline</label>
                    <div className="relative group">
                      <BsCalendar4Event className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <input
                        type="date"
                        required
                        value={formData.metadata.deadline}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, deadline: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all [color-scheme:dark] font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Status</label>
                    <div className="relative group">
                      <BsShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.metadata.status}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, status: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none font-medium"
                      >
                        <option value="pending" className="bg-[#0A0A0A]">Pending</option>
                        <option value="filed" className="bg-[#0A0A0A]">Filed</option>
                        <option value="overdue" className="bg-[#0A0A0A]">Overdue</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {formData.metadata.status === 'filed' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] ml-1">Filed Date</label>
                    <div className="relative group">
                      <BsCalendar4Event className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="date"
                        required
                        value={formData.metadata.filed_date}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, filed_date: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-emerald-500/20 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all [color-scheme:dark] font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {formData.record_type === 'budget' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Budget Name / Goal</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marketing Q1 FY26"
                      value={formData.metadata.budget_name}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, budget_name: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Marketing, Tech"
                      value={formData.metadata.department}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, department: e.target.value } })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Allocated Amount</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium group-focus-within:text-primary transition-colors">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={formData.metadata.amount}
                        onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, amount: e.target.value } })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Common Notes Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Any additional details..."
                value={formData.metadata.notes}
                onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, notes: e.target.value } })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
          <div className="p-8 border-t border-white/5 flex items-center justify-end space-x-6 shrink-0 bg-[#0A0A0A]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-3 px-10 py-3.5 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <BsCheck2 className="text-xl" />
              )}
              <span>{loading ? "Processing..." : "Create Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
