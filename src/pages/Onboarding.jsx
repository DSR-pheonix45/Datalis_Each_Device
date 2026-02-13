import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, Briefcase, CheckCircle, ArrowRight, Loader } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';

export default function Onboarding() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    role: 'founder',
    contact_number: '',
    job_title: '',
    industry: '',
    company_size: '',
    domain: '',
    company_name: '',
    cin: '',
    pan: '',
    director_name: '',
    zoho_integration: false
  });

  useEffect(() => {
    if (profile && profile.status === 'active') {
      navigate('/dashboard');
    }
    if (user && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        contact_number: user.user_metadata?.phone || '',
      }));
    }
  }, [profile, user, navigate, formData.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: formData.name,
          role: formData.role,
          contact_number: formData.contact_number,
          job_title: formData.job_title,
          industry: formData.industry,
          company_size: formData.company_size,
          company_name: formData.company_name,
          cin: formData.cin,
          pan: formData.pan,
          director_name: formData.director_name,
          domain: formData.domain,
          zoho_integration: formData.zoho_integration,
          status: 'active'
        }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.error('[DEBUG] Onboarding: Error during onboarding:', error);
        throw error;
      }
      
      console.log("[DEBUG] Onboarding: Response:", data);
      if (data) {
        setProfile(data);
        setStep(6); // Success step
        setTimeout(() => {
          navigate('/dashboard', { state: { fromOnboarding: true } });
        }, 2000);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Personal Profile</h1>
              <p className="text-gray-400">Step 1 of 5</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  What's your name?
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  What's your Job Title?
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="e.g. Finance Director"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  What's your role?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['founder', 'ca', 'analyst', 'investor'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                        formData.role === role
                          ? 'bg-teal-500/10 border-teal-500 text-teal-500'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Industry & Scale</h1>
              <p className="text-gray-400">Step 2 of 5</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Industry Type
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="">Select Industry</option>
                  <option value="saas">SaaS</option>
                  <option value="fintech">Fintech</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="services">Services</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Company Size
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201+">201+ employees</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="e.g. example.com"
                />
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Company Details</h1>
              <p className="text-gray-400">Step 3 of 5</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  CIN Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Enter company CIN"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  PAN Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Enter company PAN"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  Director Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.director_name}
                  onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Enter director name"
                />
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Integration Preferences</h1>
              <p className="text-gray-400">Step 4 of 5</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <h3 className="text-white font-medium">Zoho Books Integration</h3>
                  <p className="text-sm text-gray-400">Sync your financial data automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, zoho_integration: !formData.zoho_integration })}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.zoho_integration ? 'bg-teal-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.zoho_integration ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Final Review</h1>
              <p className="text-gray-400">Step 5 of 5</p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-gray-400">Name: <span className="text-white">{formData.name}</span></p>
                <p className="text-gray-400">Role: <span className="text-white">{formData.role}</span></p>
                <p className="text-gray-400">Company: <span className="text-white">{formData.company_name}</span></p>
                <p className="text-gray-400">Industry: <span className="text-white">{formData.industry}</span></p>
              </div>
            </div>
          </>
        );
      case 6:
        return (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-12 h-12 text-teal-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Ready!</h2>
            <p className="text-gray-400 mb-6">Taking you to your dashboard...</p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 animate-loading" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <BrandLogo />
          </div>

          <form onSubmit={handleSubmit}>
            {renderStep()}

            {step <= 5 && (
              <button
                type="submit"
                disabled={loading || 
                  (step === 1 && (!formData.name || !formData.job_title)) || 
                  (step === 2 && (!formData.industry || !formData.company_size)) ||
                  (step === 3 && (!formData.company_name || !formData.cin || !formData.pan || !formData.director_name))
                }
                className="w-full mt-8 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {step === 5 ? 'Complete Setup' : 'Next Step'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
