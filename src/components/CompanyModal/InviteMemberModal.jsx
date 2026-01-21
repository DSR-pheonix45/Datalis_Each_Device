import React, { useState } from 'react';
import { X, Mail, Shield, Loader2, Send, Copy, Check } from 'lucide-react';
import { inviteMember } from '../../services/companyService';
import { toast } from 'react-hot-toast';

export default function InviteMemberModal({ isOpen, onClose, companyId, companyName }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      const { success, error, invitation, isExistingUser: userExists } = await inviteMember(companyId, email, role);

      if (success) {
        setIsExistingUser(userExists);
        if (userExists) {
          toast.success(`${email} will see an invite in their dashboard!`);
          setInvitationLink('EXISTING_USER'); // Sentinel value
        } else {
          toast.success(`Invitation generated for ${email}`);
          const joinLink = `${window.location.origin}/join-company?token=${invitation.token}`;
          setInvitationLink(joinLink);
        }
      } else {
        toast.error(error || "Failed to generate invitation");
      }
    } catch (err) {
      console.error("Invite error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setInvitationLink('');
    setIsExistingUser(false);
    setEmail('');
    setRole('member');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white">Invite Member</h2>
            <p className="text-sm text-gray-400 mt-1">Add a new member to {companyName}</p>
          </div>
          <button 
            onClick={resetAndClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!invitationLink ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail size={16} className="text-teal-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Shield size={16} className="text-teal-500" />
                  Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['admin', 'member', 'viewer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                        role === r 
                          ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Generate Link
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl text-center">
                <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={24} />
                </div>
                <h3 className="text-white font-bold">
                  {isExistingUser ? 'Invite Sent!' : 'Invitation Ready!'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {isExistingUser 
                    ? `${email} is already a user. They can accept this invite directly from their dashboard.`
                    : `Copy the link below and send it to ${email} to join Dabby.`}
                </p>
              </div>

              {!isExistingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Shareable Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={invitationLink}
                      className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-400 transition-all shrink-0"
                      title="Copy Link"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={resetAndClose}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
