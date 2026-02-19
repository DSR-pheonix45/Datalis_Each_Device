import React, { useState, useEffect, useCallback } from "react";
import { 
  BsX, 
  BsCheckCircleFill, 
  BsBank, 
  BsCashCoin, 
  BsCreditCard, 
  BsQrCode, 
  BsWallet2,
  BsBuilding,
  BsCalendarEvent,
  BsFileText
} from "react-icons/bs";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

const PAYMENT_TYPES = [
  { id: 'bank', label: 'Bank Transfer', icon: BsBank },
  { id: 'upi', label: 'UPI', icon: BsQrCode },
  { id: 'card', label: 'Card', icon: BsCreditCard },
  { id: 'cash', label: 'Cash', icon: BsCashCoin },
  { id: 'wallet', label: 'Wallet', icon: BsWallet2 },
];

export default function ConfirmRecordModal({ isOpen, onClose, record, workbenchId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const [formData, setFormData] = useState({
    payment_type: 'bank',
    account_id: '',
    party_id: '',
    direction: 'debit', // debit = money out, credit = money in
    amount: 0,
    transaction_date: '',
    external_reference: '',
    purpose: ''
  });

  useEffect(() => {
    if (isOpen && workbenchId) {
      fetchDependencies();
    }
  }, [isOpen, workbenchId, fetchDependencies]);

  useEffect(() => {
    if (record) {
      setFormData({
        payment_type: record.metadata?.payment_type || 'bank',
        account_id: record.metadata?.account_id || '',
        party_id: record.party_id || '',
        direction: record.metadata?.direction || (record.record_type === 'income' ? 'credit' : 'debit'),
        amount: record.net_amount || record.gross_amount || 0,
        transaction_date: record.issue_date || new Date().toISOString().split('T')[0],
        external_reference: record.metadata?.external_reference || '',
        purpose: record.summary || ''
      });
    }
  }, [record]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [partiesRes, accountsRes] = await Promise.all([
        supabase.from('workbench_parties').select('id, name').eq('workbench_id', workbenchId),
        supabase.from('workbench_accounts').select('id, name, account_type').eq('workbench_id', workbenchId)
      ]);

      if (partiesRes.error) throw partiesRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setParties(partiesRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error("Error fetching dependencies:", err);
      toast.error("Failed to load form data");
    }
  }, [workbenchId]); const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (formData.payment_type !== 'cash' && !formData.external_reference) {
      toast.error("External Reference (Bank Ref/UPI ID) is required for non-cash transactions");
      return;
    }

    try {
      setLoading(true);

      // 1. Update the record with confirmed details
      const { error: updateError } = await supabase
        .from('workbench_records')
        .update({
          party_id: formData.party_id || null,
          net_amount: formData.amount,
          gross_amount: formData.amount, // Assuming no tax split for now
          issue_date: formData.transaction_date,
          summary: formData.purpose,
          metadata: {
            ...record.metadata,
            payment_type: formData.payment_type,
            account_id: formData.account_id,
            direction: formData.direction,
            external_reference: formData.external_reference
          }
        })
        .eq('id', record.id);

      if (updateError) throw updateError;

      // 2. Call confirm-record edge function
      const { error: funcError } = await supabase.functions.invoke('confirm-record', {
        body: { record_id: record.id }
      });

      if (funcError) throw funcError;

      toast.success("Transaction Confirmed & Posted to Ledger");
      onSuccess?.();
      onClose();

    } catch (err) {
      console.error("Confirmation failed:", err);
      toast.error(err.message || "Failed to confirm record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BsCheckCircleFill className="text-emerald-500" />
                Confirm Transaction
              </h3>
              <p className="text-gray-500 text-sm mt-1">Review and complete details before posting to ledger.</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all">
              <BsX className="text-2xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          
          {/* Amount & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Direction</label>
              <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'debit' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.direction === 'debit' ? 'bg-rose-500/20 text-rose-500' : 'text-gray-500'
                  }`}
                >
                  Money Out
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'credit' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.direction === 'credit' ? 'bg-emerald-500/20 text-emerald-500' : 'text-gray-500'
                  }`}
                >
                  Money In
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount (INR)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Method</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_type: type.id })}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    formData.payment_type === type.id 
                      ? 'bg-primary/10 border-primary/50 text-primary' 
                      : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5'
                  }`}
                >
                  <type.icon className="text-xl mb-1" />
                  <span className="text-[10px] font-bold">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account</label>
              <div className="relative">
                <BsWallet2 className="absolute left-3 top-3 text-gray-500" />
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="" className="bg-[#0d0d0d]">Select Account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-[#0d0d0d]">{acc.name} ({acc.account_type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Party (Optional)</label>
              <div className="relative">
                <BsBuilding className="absolute left-3 top-3 text-gray-500" />
                <select
                  value={formData.party_id}
                  onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="" className="bg-[#0d0d0d]">Select Party...</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0d0d0d]">{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reference No.</label>
              <input
                type="text"
                placeholder={formData.payment_type === 'cash' ? "Optional for Cash" : "Required"}
                value={formData.external_reference}
                onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</label>
              <div className="relative">
                <BsCalendarEvent className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Purpose / Summary</label>
            <div className="relative">
              <BsFileText className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

        </form>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
