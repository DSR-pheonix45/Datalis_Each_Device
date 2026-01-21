import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { BsUpload, BsFileEarmark, BsX, BsFolder, BsBriefcase, BsChevronDown } from 'react-icons/bs';
import { getUserCompanies } from '../../services/companyService';
import { decrementCredits, CREDIT_COSTS, getUserCredits } from '../../services/creditsService';

export default function CreateWorkbenchModal({ isOpen, onClose, onSuccess, companyId: propCompanyId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workbenchType, setWorkbenchType] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(propCompanyId || '');
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !propCompanyId) {
      fetchUserCompanies();
    } else if (propCompanyId) {
      setSelectedCompanyId(propCompanyId);
    }
  }, [isOpen, propCompanyId]);

  const fetchUserCompanies = async () => {
    setIsLoadingCompanies(true);
    const { success, companies, error } = await getUserCompanies();
    if (success) {
      setUserCompanies(companies);
      if (companies.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(companies[0].id);
      }
    } else {
      console.error('Error fetching companies:', error);
    }
    setIsLoadingCompanies(false);
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (workbench) => {
    if (!files.length) return [];

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes?.data?.session?.access_token;
    if (!accessToken) {
      throw new Error("Not authenticated");
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workbench_id", workbench.id);

        const { data: json, error: invokeError } = await supabase.functions.invoke("workbench-files-upload", {
          body: formData,
        });

        if (invokeError) {
          console.error("Edge function upload error:", invokeError);
          throw new Error(invokeError.message || "Upload failed");
        }

        // Handle different upload response formats:
        // 1. { success: true, data: { ...file } }
        // 2. { file: { ... } }
        // 3. { ...file }
        const uploadedFile = json?.data || json?.file || json;
        if (uploadedFile && uploadedFile.id) {
          uploadedFiles.push(uploadedFile);
        }
      } catch (err) {
        console.error("Upload error (create modal):", err);
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
        continue;
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workbench name is required');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Check credits first
      const creditsNeeded = CREDIT_COSTS.create_workbench;
      const creditBalance = await getUserCredits(user.id);
      
      if (!creditBalance.success) {
        throw new Error('Could not verify credit balance');
      }

      if (creditBalance.credits < creditsNeeded) {
        throw new Error(`Insufficient credits. Creating a workbench costs ${creditsNeeded} credits.`);
      }

      let companyIdToUse = workbenchType === 'company' ? (propCompanyId || selectedCompanyId) : null;

      if (workbenchType === 'company' && !companyIdToUse) {
        throw new Error('Please select a company for this workbench.');
      }

      // 1. Create the workbench using Edge Function
      const { data: createData, error: createError } = await supabase.functions.invoke("workbenches-create", {
        body: {
          name: name.trim(),
          description: description.trim() || null,
          type: workbenchType,
          company_id: companyIdToUse
        }
      });

      if (createError) {
        console.error('Workbench creation error details:', createError);
        throw new Error(createError.message || 'Failed to create workbench');
      }

      // Extract workbench data safely
      const workbench = createData?.data || createData?.workbench || createData;

      if (!workbench || !workbench.id) {
        console.error('Invalid workbench response format:', createData);
        throw new Error('Workbench was created but details could not be retrieved.');
      }

      // 2. Deduct credits for workbench creation
      const creditResult = await decrementCredits(
        user.id,
        creditsNeeded,
        "create_workbench"
      );

      if (!creditResult.success) {
        console.warn('Failed to deduct credits, but workbench was created:', creditResult.error);
      } else {
        // Notify UI to update credits display
        window.dispatchEvent(new Event("creditsUpdated"));
      }

      // 3. Upload files if any
      if (files.length > 0) {
        await uploadFiles(workbench);
      }

      toast.success('Workbench created successfully');

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('workbenchCreated'));

      onSuccess(workbench);
      onClose();
    } catch (error) {
      console.error('Error creating workbench:', error);
      toast.error(error.message || 'Failed to create workbench');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#0E1117] rounded-xl shadow-2xl w-full max-w-lg border border-white/10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#161B22]/50">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Create Workbench</h2>
            <p className="text-xs text-gray-400 mt-0.5">Organize your data and analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
            disabled={isLoading}
          >
            <BsX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Workbench Type Selection - Card Style */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkbenchType('personal')}
                className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${workbenchType === 'personal'
                    ? 'bg-teal-500/10 border-teal-500/50 ring-1 ring-teal-500/20'
                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className={`p-2 rounded-md w-fit mb-2 ${workbenchType === 'personal' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-gray-400'}`}>
                  <BsFolder className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium text-white">Personal Mode</div>
                <div className="text-[10px] text-gray-400 mt-1">Private workspace</div>
              </button>

              <button
                type="button"
                onClick={() => setWorkbenchType('company')}
                className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${workbenchType === 'company'
                    ? 'bg-violet-500/10 border-violet-500/50 ring-1 ring-violet-500/20'
                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className={`p-2 rounded-md w-fit mb-2 ${workbenchType === 'company' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-gray-400'}`}>
                  <BsBriefcase className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium text-white">Company Mode</div>
                <div className="text-[10px] text-gray-400 mt-1">Shared workspace</div>
              </button>
            </div>

            {/* Company Selection Dropdown - Only shown for Company Mode */}
            {workbenchType === 'company' && !propCompanyId && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Select Company <span className="text-violet-500">*</span>
                </label>
                <div className="relative group">
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-sans appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoadingCompanies || isLoading}
                    required
                  >
                    {isLoadingCompanies ? (
                      <option value="">Loading your companies...</option>
                    ) : userCompanies.length === 0 ? (
                      <option value="">No companies found</option>
                    ) : (
                      <>
                        <option value="" disabled>Choose a company</option>
                        {userCompanies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.company_name} ({company.role})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-hover:text-white transition-colors">
                    <BsChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {userCompanies.length === 0 && !isLoadingCompanies && (
                  <p className="mt-1.5 text-[10px] text-red-400 flex items-center">
                    You aren't a member of any company yet.
                  </p>
                )}
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Workbench Name <span className="text-teal-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-sans"
                  placeholder="e.g. Q3 Financial Analysis"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-sans resize-none"
                  placeholder="Optional context about this workspace..."
                  disabled={isLoading}
                />
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Initial Files
                </label>
                <div
                  onClick={triggerFileInput}
                  className="group relative flex flex-col items-center justify-center px-6 py-6 border border-dashed border-white/10 rounded-xl bg-[#0a0a0a] hover:bg-[#161B22] hover:border-teal-500/30 cursor-pointer transition-all duration-200"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />

                  {files.length === 0 ? (
                    <>
                      <div className="w-10 h-10 mb-3 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <BsUpload className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-300 font-medium">Click to upload files</p>
                      <p className="text-xs text-gray-500 mt-1">Supports CSV, PDF, Excel</p>
                    </>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-xs font-medium text-teal-400 px-2 py-1 bg-teal-500/10 rounded-full">
                          {files.length} file{files.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                        {Array.from(files).map((file, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 text-xs text-gray-300">
                            <BsFileEarmark className="text-gray-500" />
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiles(files.filter((_, idx) => idx !== i));
                              }}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <BsX className="text-sm" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-xs text-teal-400 hover:underline">Add more files</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-teal-900/20"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
