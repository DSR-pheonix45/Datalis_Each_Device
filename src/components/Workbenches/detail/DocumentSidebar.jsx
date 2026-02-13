import React, { useState, useEffect, useRef } from "react";
import { 
  BsX, 
  BsUpload, 
  BsFileEarmarkPdf, 
  BsFileEarmarkText,
  BsDot,
  BsArrowRepeat,
  BsTrash,
  BsTag,
  BsCheck2All,
  BsHourglassSplit,
  BsChevronRight
} from "react-icons/bs";
import { backendService } from "../../../services/backendService";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";
import Card from "../../shared/Card";
import { toast } from "react-hot-toast";

const DOCUMENT_TYPES = [
  { id: 'bank_statement', label: 'Bank Statement', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'invoice', label: 'Invoice', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'bill', label: 'Bill/Expense', color: 'bg-red-500/10 text-red-400' },
  { id: 'ledger', label: 'Ledger', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'compliance', label: 'Compliance', color: 'bg-orange-500/10 text-orange-400' },
  { id: 'contract', label: 'Contract', color: 'bg-rose-500/10 text-rose-400' },
  { id: 'other', label: 'Other', color: 'bg-gray-500/10 text-gray-400' },
];

const STATUS_CONFIG = {
  uploaded: { label: 'Uploaded', icon: BsUpload, color: 'text-blue-400' },
  UPLOADED: { label: 'Uploaded', icon: BsUpload, color: 'text-blue-400' },
  parsing: { label: 'Parsing', icon: BsHourglassSplit, color: 'text-amber-400', animate: true },
  PARSING: { label: 'Parsing', icon: BsHourglassSplit, color: 'text-amber-400', animate: true },
  parsed: { label: 'Processed', icon: BsCheck2All, color: 'text-emerald-400' },
  processed: { label: 'Processed', icon: BsCheck2All, color: 'text-emerald-400' },
  failed: { label: 'Failed', icon: BsX, color: 'text-rose-400' },
  FAILED: { label: 'Failed', icon: BsX, color: 'text-rose-400' },
};

export default function DocumentSidebar({ isOpen, onClose, workbenchId }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('invoice');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && workbenchId) {
      fetchDocuments();
    }
  }, [isOpen, workbenchId]);

  // Status Polling
  useEffect(() => {
    let interval;
    const needsPolling = documents.some(doc => 
      ['uploaded', 'parsing', 'UPLOADED', 'PARSING'].includes(doc.processing_status)
    );

    if (isOpen && needsPolling) {
      interval = setInterval(() => {
        fetchDocuments(true); // silent fetch
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, documents]);

  const fetchDocuments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const { data, error } = await supabase
        .from("workbench_documents")
        .select("*")
        .eq("workbench_id", workbenchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      if (!silent) toast.error("Failed to load documents");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const docData = await backendService.uploadDocument(
        workbenchId,
        file,
        selectedType
      );

      setDocuments([docData, ...documents]);
      toast.success("Document uploaded and processing started");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenFile = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from("workbench-documents")
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error("Error opening file:", err);
      toast.error("Failed to open document");
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full w-[480px] bg-[#0A0A0A] border-l border-primary/10 z-[50] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-0.5">Documents</h2>
              <p className="text-gray-500 text-xs font-medium">
                {loading ? "Loading..." : `${documents.length} ${documents.length === 1 ? 'file' : 'files'}`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              <div className="relative">
                <button 
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold"
                >
                  <BsTag className="text-sm" />
                  <span>{DOCUMENT_TYPES.find(t => t.id === selectedType)?.label}</span>
                </button>

                {showTypeSelector && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-20 py-2">
                    {DOCUMENT_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSelectedType(type.id);
                          setShowTypeSelector(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-white/5 transition-all ${
                          selectedType === type.id ? "text-primary" : "text-gray-400"
                        }`}
                      >
                        <span>{type.label}</span>
                        {selectedType === type.id && <BsDot className="text-2xl" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleUploadClick}
                disabled={uploading}
                className="flex items-center space-x-2 px-5 py-2 rounded-full bg-primary text-black hover:opacity-90 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <BsArrowRepeat className="animate-spin" />
                ) : (
                  <BsUpload className="text-base stroke-1" />
                )}
                <span>{uploading ? "Uploading..." : "Upload"}</span>
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-all"
              >
                <BsX className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <BsArrowRepeat className="text-3xl text-primary animate-spin" />
                <p className="text-gray-500 text-sm">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <BsFileEarmarkText className="text-3xl text-gray-700" />
                </div>
                <h3 className="text-white font-bold mb-1">No documents yet</h3>
                <p className="text-gray-500 text-sm max-w-[200px]">
                  Upload your first financial document to get started.
                </p>
              </div>
            ) : (
              documents.map((doc) => {
                const status = STATUS_CONFIG[doc.processing_status] || STATUS_CONFIG.uploaded;
                const StatusIcon = status.icon;
                const docType = DOCUMENT_TYPES.find(t => t.id === doc.document_type) || DOCUMENT_TYPES[5];

                return (
                  <Card key={doc.id} className="group relative p-0 border-white/5 hover:border-primary/20 transition-all duration-300">
                    <div className="p-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 rounded-xl ${docType.color.split(' ')[0]} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                          {doc.file_name.endsWith('.pdf') ? (
                            <BsFileEarmarkPdf className={`text-xl ${docType.color.split(' ')[1]}`} />
                          ) : (
                            <BsFileEarmarkText className={`text-xl ${docType.color.split(' ')[1]}`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-white truncate pr-4 group-hover:text-primary transition-colors">
                              {doc.file_name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${docType.color}`}>
                              {docType.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-[11px] text-gray-500 font-medium space-x-2">
                            <span>{formatDate(doc.created_at)}</span>
                            <BsDot className="text-lg" />
                            <span>{formatSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className={`flex items-center space-x-2 ${status.color}`}>
                          <StatusIcon className={`text-sm ${status.animate ? 'animate-spin' : ''}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{status.label}</span>
                        </div>
                        
                        {doc.processing_status === 'parsed' && (
                          <button 
                            onClick={() => handleOpenFile(doc)}
                            className="flex items-center space-x-1 text-primary hover:text-white transition-colors text-[10px] font-bold"
                          >
                            <span>OPEN FILE</span>
                            <BsChevronRight className="text-[8px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
