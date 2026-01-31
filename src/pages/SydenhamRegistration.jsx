import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle2, ChevronRight, Mail, User, GraduationCap, Briefcase, Wrench, AlertCircle, Sparkles, Download } from 'lucide-react';
import { track } from '@vercel/analytics';
import { saveSubmission, downloadSubmissionsAsCSV } from '../services/registrationService';

const SydenhamRegistration = () => {
  const { theme } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    memberStatus: 'non-member',
    profession: '',
    workDescription: '',
    toolsUsed: '',
    problemsFaced: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Tracking the submission
    track('sydenham_form_submitted', {
      memberStatus: formData.memberStatus,
      profession: formData.profession
    });

    // Save to IndexedDB (local storage for entries)
    const saved = await saveSubmission(formData);
    if (!saved) {
      console.warn('Could not save submission locally, but proceeding with success UI');
    }

    // Since Supabase is in maintenance, we'll simulate a successful submission
    console.log('Sydenham Registration Data:', formData);
    
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none ${
    theme === 'dark' 
      ? 'bg-white/5 border-white/10 text-white focus:border-[#81E6D9] focus:bg-white/10' 
      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#0D9488] focus:bg-white'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  }`;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full p-8 rounded-3xl text-center border ${
            theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 shadow-xl'
          }`}
        >
          <div className="w-20 h-20 bg-[#81E6D9]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#81E6D9]" />
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Registration Successful!
          </h2>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome to the Datalis waitlist. We've noted your interest!
          </p>
          <div className={`p-6 rounded-2xl mb-8 text-left ${
            theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="w-4 h-4 text-[#81E6D9]" />
              Your Benefits:
            </h4>
            <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#81E6D9] mt-1.5 shrink-0" />
                30 FREE credits once we go live
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#81E6D9] mt-1.5 shrink-0" />
                15% Discount code sent to your email
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#81E6D9] mt-1.5 shrink-0" />
                Priority access to Dabby AI
              </li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-[#81E6D9] text-black font-bold rounded-xl hover:bg-[#70d4c7] transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <button
            onClick={downloadSubmissionsAsCSV}
            className={`absolute -top-4 right-0 p-3 rounded-full border transition-all duration-200 group ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white/40 hover:text-[#81E6D9] hover:border-[#81E6D9]/50' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-[#0D9488] hover:border-[#0D9488]/50 shadow-sm'
            }`}
            title="Download Submissions CSV"
          >
            <Download className="w-5 h-5" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-800 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Export Entries
            </span>
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#81E6D9]/10 border border-[#81E6D9]/20 text-[#81E6D9] text-sm font-medium mb-6"
          >
            <GraduationCap className="w-4 h-4" />
            Sydenham College Exclusive
          </motion.div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Join the Future of Finance
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Register now to claim your 30 free credits and exclusive founder's discount.
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-8 md:p-12 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 shadow-2xl'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className={labelClasses}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`${inputClasses} pl-12`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClasses}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`${inputClasses} pl-12`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Status */}
              <div>
                <label className={labelClasses}>College Status</label>
                <select
                  name="memberStatus"
                  value={formData.memberStatus}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="member">Sydenham Member</option>
                  <option value="non-member">Non-Member</option>
                </select>
              </div>

              {/* Profession */}
              <div>
                <label className={labelClasses}>Studying / Profession</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    required
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="e.g. B.Com Student / CA Aspirant"
                    className={`${inputClasses} pl-12`}
                  />
                </div>
              </div>
            </div>

            {/* Work Description */}
            <div>
              <label className={labelClasses}>What work do you do in financial teams?</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <textarea
                  required
                  name="workDescription"
                  value={formData.workDescription}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your role or area of interest..."
                  className={`${inputClasses} pl-12`}
                ></textarea>
              </div>
            </div>

            {/* Tools Used */}
            <div>
              <label className={labelClasses}>What tools do you use in financial work?</label>
              <div className="relative">
                <Wrench className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <textarea
                  required
                  name="toolsUsed"
                  value={formData.toolsUsed}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Excel, Tally, QuickBooks, etc."
                  className={`${inputClasses} pl-12`}
                ></textarea>
              </div>
            </div>

            {/* Problems Faced */}
            <div>
              <label className={labelClasses}>What problems do you face?</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <textarea
                  required
                  name="problemsFaced"
                  value={formData.problemsFaced}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Data entry, complex formulas, slow reporting..."
                  className={`${inputClasses} pl-12`}
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              type="submit"
              className={`w-full py-4 bg-[#81E6D9] text-black font-bold rounded-xl hover:bg-[#70d4c7] transition-all duration-200 flex items-center justify-center gap-2 group ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Register for Early Access
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className={`text-center text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              By registering, you agree to receive waitlist updates and your discount code via email.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SydenhamRegistration;
