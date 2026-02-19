import React, { useState, useRef, useCallback } from "react";
import { 
  BsX, 
  BsUpload, 
  BsFileEarmarkText,
  BsTag,
  BsDot,
  BsArrowRepeat,
  BsCheckCircle,
  BsExclamationCircle
} from "react-icons/bs";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import Card from "../../shared/Card";

const DOCUMENT_TYPES = [
  { id: 'all', label: 'All Documents', color: 'bg-gray-500/10 text-gray-400' },
  { id: 'Bank Statement', label: 'Bank Statement', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'Invoice', label: 'Invoice', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'Bill', label: 'Bill/Expense', color: 'bg-red-500/10 text-red-400' },
  { id: 'Ledger', label: 'Ledger', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'Compliance', label: 'Compliance', color: 'bg-orange-500/10 text-orange-400' },
];

const getDisplayName = (doc) => {
  if (!doc.file_path) return doc.id;
  const parts = doc.file_path.split('/');
  const fileName = parts[parts.length - 1];
  const match = fileName.match(/^\d{13}-(.*)$/);
  return match ? match[1] : fileName;
};

export default function DocumentSidebar({ isOpen, onClose, workbenchId }) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const fileInputRef = useRef(null);
  
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]); // In a real app, fetch this from DB
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const { data, error } = await supabase
        .from('workbench_documents')
        .select('*')
        .eq('workbench_id', workbenchId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  }, [workbenchId]);

  // Fetch documents from workbench_documents
  React.useEffect(() => {
    if (isOpen && workbenchId) {
      fetchDocuments();
    }
  }, [isOpen, workbenchId, fetchDocuments]);

  // Poll for updates every 5 seconds if sidebar is open
  React.useEffect(() => {
    let interval;
    if (isOpen && workbenchId) {
      interval = setInterval(fetchDocuments, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, workbenchId, fetchDocuments]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      // 1. Upload file to Storage
      // Use timestamp-filename format to preserve original name while ensuring uniqueness
      const fileName = `${Date.now()}-${file.name}`;
      // IMPORTANT: Remove workbenchId prefix because RLS policy expects (storage.foldername(name))[1] to be workbench_id
      // So the path should be `${workbenchId}/${fileName}`
      // Let's verify if the bucket structure is strictly `workbenchId/filename`
      const filePath = `${workbenchId}/${fileName}`;

      console.log(`Uploading to bucket 'workbench_documents' at path '${filePath}'`);

      const { error: uploadError } = await supabase.storage
        .from('workbench_documents')
        .upload(filePath, file);

      if (uploadError) {
          console.error("Upload failed details:", uploadError);
          throw uploadError;
      }

      // 2. Create Document Record
      const { data: doc, error: dbError } = await supabase
        .from('workbench_documents')
        .insert({
          workbench_id: workbenchId,
          file_path: filePath,
          document_type: selectedType !== 'all' ? selectedType : 'other',
          processing_status: 'UPLOADED'
          // Note: uploaded_by removed as it doesn't exist in schema
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Trigger Processing
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { document_id: doc.id, user_id: user.id }
      });

      if (processError) {
        console.warn("Processing trigger failed:", processError);
        // Don't fail the upload, just warn
      }

      setDocuments(prev => [doc, ...prev]);
      setUploadStatus('success');
      
      // Reset after delay
      setTimeout(() => setUploadStatus(null), 3000);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredDocuments = documents;

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
                {filteredDocuments.length} files
              </p>
            </div>
            <div className="flex items-center space-x-4">
              
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  uploading 
                    ? "bg-gray-800 text-gray-500 cursor-wait"
                    : "bg-primary text-black hover:bg-primary-hover shadow-[0_0_15px_rgba(129,230,217,0.3)] hover:shadow-[0_0_25px_rgba(129,230,217,0.5)]"
                }`}
              >
                {uploading ? (
                  <>
                    <BsArrowRepeat className="text-sm animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <BsUpload className="text-sm" />
                    <span>Upload</span>
                  </>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.csv" 
              />
              
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-all"
              >
                <BsX className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Status Message */}
          {uploadStatus === 'success' && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center space-x-2 text-emerald-400 text-sm">
              <BsCheckCircle />
              <span>Document uploaded and processing started successfully.</span>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm">
              <BsExclamationCircle />
              <span>Failed to upload document. Please try again.</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <BsArrowRepeat className="text-3xl text-primary animate-spin mb-4" />
                 <p className="text-gray-400 text-sm">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <BsFileEarmarkText className="text-3xl text-gray-700" />
                </div>
                <h3 className="text-white font-bold mb-1">
                  No Documents
                </h3>
                <p className="text-gray-500 text-sm max-w-[200px]">
                  Upload documents to automatically extract data and create records.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc, idx) => {
                  const displayName = getDisplayName(doc);
                  const displayStatus = doc.processing_status || 'UNKNOWN';
                  // Calculate size if available, otherwise just show date
                  const date = new Date(doc.uploaded_at || doc.created_at).toLocaleDateString();

                  return (
                  <Card key={doc.id || idx} className="p-4 hover:border-primary/30 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`p-2 rounded-lg ${
                          displayStatus === 'processed' || displayStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                          displayStatus === 'processing' || displayStatus === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          <BsFileEarmarkText className="text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center w-full">
                            <h4 className="text-sm font-medium text-white truncate max-w-[180px]" title={displayName}>
                              {displayName}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider ${
                              displayStatus === 'COMPLETED' || displayStatus === 'processed' ? 'bg-emerald-500/10 text-emerald-400' :
                              displayStatus === 'PROCESSING' || displayStatus === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {displayStatus}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500 capitalize">{doc.document_type || 'Document'}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
