import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getInvitationByToken, acceptInvitation } from '../services/companyService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Building2, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';

export default function JoinCompany() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError("Invalid invitation link");
      setIsLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setIsLoading(true);
      const { success, invitation: inviteData, error: inviteError } = await getInvitationByToken(token);
      
      if (success) {
        setInvitation(inviteData);
      } else {
        setError(inviteError || "Invitation not found or expired");
      }
    } catch (err) {
      setError("Failed to load invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error("Please log in to join the company");
      navigate(`/login?redirect=/join-company?token=${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      const { success, error: acceptError } = await acceptInvitation(token);
      
      if (success) {
        toast.success(`Welcome to ${invitation.company.company_name}!`);
        navigate('/companies');
      } else {
        toast.error(acceptError || "Failed to join company");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0E1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto" />
          <p className="text-gray-400">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1117] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <BrandLogo />
      </div>

      <div className="w-full max-w-md bg-[#161B22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {error ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invalid Invitation</h2>
              <p className="text-gray-400 mt-2">{error}</p>
            </div>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="p-8 text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/20">
                <Building2 size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Join {invitation.company.company_name}</h2>
                <p className="text-gray-400 mt-2">
                  You've been invited by <span className="text-white font-medium">{invitation.invited_by_profile?.full_name || invitation.invited_by_profile?.email}</span> to join as a <span className="text-teal-400 font-medium capitalize">{invitation.role}</span>.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              {user ? (
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserCheck size={20} />
                      Accept Invitation
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 italic">Please sign in to accept this invitation</p>
                  <Link
                    to={`/login?redirect=/join-company?token=${token}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                  >
                    Login to Join
                  </Link>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                By joining, you'll have access to the company's workbenches and data based on your role.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
