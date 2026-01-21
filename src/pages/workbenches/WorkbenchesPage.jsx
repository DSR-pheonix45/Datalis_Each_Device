// Patched WorkbenchesPage.jsx
// Only corrected flow + naming + path logic. No UI or unrelated logic touched.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { decrementCredits, CREDIT_COSTS } from "../../services/creditsService";
import Sidebar from "../../components/Sidebar/Sidebar";
import CreateWorkbenchModal from "../../components/workbenches/CreateWorkbenchModal";
import WorkbenchListSidebar from "../../components/WorkbenchListSidebar";
import FileListSidebar from "../../components/FileListSidebar";
import WorkbenchFileViewer from "../../components/WorkbenchFileViewer";
import ColumnMappingModal from "../../components/DataMapping/ColumnMappingModal";
import {
  parseCSVLocally,
} from "../../services/dataIngestionService";
import { saveFileLocally } from "../../utils/localFileStorage";
import { toast } from "react-hot-toast";
import {
  BsFileEarmark,
  BsUpload,
  BsDownload,
  BsTrash,
  BsBriefcase,
  BsPlus,
  BsFolder2Open,
  BsArrowRight,
  BsStars,
  BsSearch,
  BsChevronLeft,
} from "react-icons/bs";

const WorkbenchesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workbenches, setWorkbenches] = useState([]);
  const [selectedWorkbench, setSelectedWorkbench] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState({
    workbenches: false,
    files: false,
  });
  // Column mapping state
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [pendingDataset, setPendingDataset] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Mobile navigation state
  const [mobileView, setMobileView] = useState('workbenches'); // 'workbenches' | 'files' | 'viewer'

  // Handle file selection
  const handleSelectFile = (file) => {
    setSelectedFile(file);
    setMobileView('viewer');
  };

  // Fetch workbenches
  const fetchWorkbenches = async () => {
    if (!user) return;

    try {
      setIsLoading((prev) => ({ ...prev, workbenches: true }));

      const { data, error } = await supabase
        .from("workbenches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkbenches(data || []);
    } catch (error) {
      console.error("Error fetching workbenches:", error);
      toast.error("Failed to load workbenches");
    } finally {
      setIsLoading((prev) => ({ ...prev, workbenches: false }));
    }
  };

  // Fetch files belonging to a workbench
  const fetchWorkbenchFiles = async (workbenchId) => {
    if (!workbenchId) return;

    try {
      setIsLoading((prev) => ({ ...prev, files: true }));

      const { data, error } = await supabase
        .from("workbench_files")
        .select("*")
        .eq("workbench_id", workbenchId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFiles(data || []);
      setSelectedFile(null); // Reset selected file when workbench changes
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setIsLoading((prev) => ({ ...prev, files: false }));
    }
  };

  // Handle workbench selection
  const handleSelectWorkbench = async (workbench) => {
    setSelectedWorkbench(workbench);
    setSelectedFile(null);
    setMobileView('files');
    fetchWorkbenchFiles(workbench.id);

    // Update last_used_by
    if (user) {
      await supabase
        .from("workbenches")
        .update({ last_used_by: user.id })
        .eq("id", workbench.id);
    }
  };

  // Mobile back navigation
  const handleMobileBack = () => {
    if (mobileView === 'viewer') {
      setSelectedFile(null);
      setMobileView('files');
    } else if (mobileView === 'files') {
      setSelectedWorkbench(null);
      setMobileView('workbenches');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedWorkbench || !user) return;

    // File size validation and user warning
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const isLargeFile = file.size > 10 * 1024 * 1024; // > 10MB

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `File too large (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB). Maximum size: 100MB`
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress({ rows: 0, total: 0, percent: 0 });

      if (isLargeFile) {
        toast.loading(
          `Processing large file (${(file.size / 1024 / 1024).toFixed(
            1
          )}MB)...`,
          { id: "file-upload" }
        );
      } else {
        toast.loading("Processing file...", { id: "file-upload" });
      }

      // Read file content
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      // Check if this is a CSV file - if so, parse for columns
      const isCSV = file.name.toLowerCase().endsWith(".csv");

      if (isCSV) {
        // Progress callback for large file parsing
        const onProgress = (rowsProcessed, totalEstimate) => {
          const percent =
            totalEstimate > 0
              ? Math.min(99, Math.round((rowsProcessed / totalEstimate) * 100))
              : 0;
          setUploadProgress({
            rows: rowsProcessed,
            total: totalEstimate,
            percent,
          });

          // Update toast for large files
          if (isLargeFile && rowsProcessed % 10000 === 0) {
            toast.loading(
              `Processing: ${rowsProcessed.toLocaleString()} rows (${percent}%)...`,
              { id: "file-upload" }
            );
          }
        };

        // Use full parsing for large files to get accurate KPI data
        const parseResult = await parseCSVLocally(file, {
          previewOnly: !isLargeFile, // Full parse for large files
          onProgress,
        });

        if (parseResult.success) {
          // Store the dataset info and open mapping modal
          setPendingDataset({
            id: null,
            original_filename: file.name,
            columns:
              parseResult.data?.columns?.map((c) => c.originalName) || [],
            parsedData: parseResult.data?.rows || [],
            rowCount: parseResult.data?.rowCount || 0,
            isPartial: parseResult.data?.isPartial || false,
          });
          setDatasetColumns(
            parseResult.data?.columns?.map((c) => c.originalName) || []
          );
          setIsMappingModalOpen(true);

          // Show warning if data was truncated
          if (parseResult.data?.isPartial) {
            toast.warning(
              `Large file: Displaying first ${parseResult.data.parsedRowCount?.toLocaleString()} of ${parseResult.data.rowCount?.toLocaleString()} rows`,
              { duration: 5000 }
            );
          }
        } else {
          throw new Error(parseResult.error || "Failed to parse CSV file");
        }
      }

      // Upload via Edge Function (handles Storage + DB insert)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workbench_id", selectedWorkbench.id);

      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
        "workbench-files-upload",
        {
          body: formData,
        }
      );

      if (uploadError) {
        console.error("Edge function upload error:", uploadError);
        
        // Try to get detailed error from response
        let errorMsg = uploadError.message;
        try {
          if (uploadError.context?.json) {
            const errorData = await uploadError.context.json();
            errorMsg = errorData.error || errorMsg;
            if (errorData.details) {
              console.error("Error details:", errorData.details);
            }
          }
        } catch (e) {
          console.error("Could not parse error response", e);
        }
        
        throw new Error(`Upload failed: ${errorMsg}`);
      }

      if (!uploadResult?.success) {
        throw new Error(uploadResult?.error || "Upload failed");
      }

      const fileRecord = uploadResult.file;

      // Also save file content locally (IndexedDB) for fast preview
      await saveFileLocally(fileRecord.bucket_path, fileContent, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "text/csv",
        workbenchId: selectedWorkbench.id,
      });
      console.log("File saved locally and to cloud:", fileRecord.bucket_path);

      // Refresh file list
      fetchWorkbenchFiles(selectedWorkbench.id);
      toast.success(`Uploaded ${file.name}`, { id: "file-upload" });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset the file input (with null check for dynamically created inputs)
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Handle column mapping save
  const handleSaveMapping = async (mappingData) => {
    try {
      toast.loading("Saving column mapping...", { id: "save-mapping" });

      // Save the mapping to the database
      const { error } = await supabase.from("column_mappings").insert({
        dataset_id: pendingDataset.id,
        user_id: user.id, // Ensure user_id is included
        mapping: mappingData.mapping,
        is_default: true,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Column mapping saved! You can now compute KPIs.", {
        id: "save-mapping",
      });
      setIsMappingModalOpen(false);
      setPendingDataset(null);
      setDatasetColumns([]);
    } catch (error) {
      console.error("Error saving column mapping:", error);
      toast.error("Failed to save mapping: " + error.message, {
        id: "save-mapping",
      });
    }
  };

  // Handle mapping skip
  const handleSkipMapping = () => {
    toast("You can map columns later from the file settings.", { icon: "ℹ️" });
    setIsMappingModalOpen(false);
    setPendingDataset(null);
    setDatasetColumns([]);
  };

  // Handle file download
  const handleDownloadFile = async (file) => {
    if (!file || !file.bucket_path) {
      toast.error("Invalid file or file path");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("workbench-files")
        .download(file.bucket_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file) => {
    if (!file || !file.id || !file.bucket_path) {
      toast.error("Invalid file");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${file.file_name}?`))
      return;

    try {
      // First delete the metadata
      const { error: deleteError } = await supabase
        .from("workbench_files")
        .delete()
        .eq("id", file.id);

      if (deleteError) throw deleteError;

      // Then try to delete from storage (but don't fail if this fails)
      try {
        await supabase.storage
          .from("workbench-files")
          .remove([file.bucket_path]);
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue even if storage deletion fails
      }

      // Update UI
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      toast.success("File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  // Create Workbench with credit deduction
  // handleCreateWorkbench removed as it is handled by CreateWorkbenchModal

  useEffect(() => {
    if (user) {
      fetchWorkbenches();
    }
  }, [user]);

  return (
    <div
      className="flex flex-col lg:flex-row h-full bg-[#0a0a0a] text-gray-100 font-dm-sans overflow-hidden"
      data-tour="workbenches-page"
    >
      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-[#0a0a0a] border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mobileView !== 'workbenches' && (
            <button onClick={handleMobileBack} className="flex items-center gap-1 text-gray-400 text-sm">
              <BsChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <span className="text-sm font-medium text-white">
            {mobileView === 'workbenches' ? 'Workbenches' : 
             mobileView === 'files' ? selectedWorkbench?.name : 
             selectedFile?.file_name}
          </span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400"
        >
          <BsPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Workbench List Sidebar */}
      <div className={`${mobileView === 'workbenches' ? 'block' : 'hidden'} lg:block h-full`}>
        <WorkbenchListSidebar
          workbenches={workbenches}
          selectedWorkbench={selectedWorkbench}
          onSelect={handleSelectWorkbench}
          onCreateNew={() => setIsCreateModalOpen(true)}
          onDelete={(deletedId) => {
            setWorkbenches((prev) => prev.filter((w) => w.id !== deletedId));
            if (selectedWorkbench?.id === deletedId) {
              setSelectedWorkbench(null);
              setFiles([]);
              setSelectedFile(null);
              setMobileView('workbenches');
            }
          }}
          isLoading={isLoading.workbenches}
        />
      </div>

      {/* File List Sidebar (only shown when a workbench is selected) */}
      {selectedWorkbench && (
        <div className={`${mobileView === 'files' ? 'block' : 'hidden'} lg:block h-full`}>
          <FileListSidebar
            files={files}
            selectedFile={selectedFile}
            workbenchName={selectedWorkbench.name}
            onSelectFile={handleSelectFile}
            onUploadFile={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.onchange = handleFileUpload;
              input.click();
            }}
            onDeleteFile={handleDeleteFile}
            onBack={handleMobileBack}
          />
        </div>
      )}

      <main className={`flex-1 overflow-hidden bg-[#0a0a0a] relative ${mobileView === 'viewer' || (!selectedWorkbench && mobileView === 'workbenches') ? 'block' : 'hidden lg:block'}`}>
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        {selectedFile ? (
          <div className="relative z-10 h-full">
            <WorkbenchFileViewer
              file={selectedFile}
              onBack={() => {
                setSelectedFile(null);
                setMobileView('files');
              }}
              onDownload={() => handleDownloadFile(selectedFile)}
              onDelete={() => handleDeleteFile(selectedFile)}
            />
          </div>
        ) : selectedWorkbench ? (
          /* Workbench selected but no file */
          <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 relative z-10">
            <div className="max-w-md text-center">
              {/* Icon */}
              <div className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 rounded-2xl lg:rounded-3xl bg-[#161B22] border border-white/5 flex items-center justify-center shadow-2xl shadow-black/50">
                <BsFolder2Open className="text-2xl lg:text-4xl text-teal-400 opacity-80" />
              </div>

              {/* Title */}
              <h2 className="text-lg lg:text-xl font-bold text-gray-200 mb-2 tracking-tight">
                {selectedWorkbench.name}
              </h2>
              <p className="text-sm text-gray-500 mb-6 lg:mb-8 leading-relaxed max-w-sm mx-auto">
                {files.length === 0
                  ? "This workbench is empty. Upload files to get started."
                  : "Select a file from the sidebar to view its contents."}
              </p>

              {/* Stats */}
              {files.length > 0 && (
                <div className="flex justify-center gap-8 mb-8 pb-8 border-b border-white/5">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-400 mb-1">
                      {files.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">
                      {(
                        files.reduce((acc, f) => acc + (f.file_size || 0), 0) /
                        1024
                      ).toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">KB Used</div>
                  </div>
                </div>
              )}

              {/* Upload CTA */}
              <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-teal-900/20 group">
                <BsUpload className="text-lg" />
                <span>Upload Files</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {/* File types hint */}
              <p className="mt-6 text-[10px] text-gray-600 uppercase tracking-widest font-semibold opacity-50">
                CSV • Excel • PDF • Text
              </p>
            </div>
          </div>
        ) : (
          /* No workbench selected - show welcome/empty state */
          <div className="flex flex-col items-center justify-start lg:justify-center min-h-full overflow-y-auto py-6 px-4 lg:p-8 relative z-10">
            <div className="max-w-lg text-center w-full">
              {/* Hero Icon */}
              <div className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 rounded-2xl lg:rounded-3xl bg-[#161B22] border border-white/5 flex items-center justify-center shadow-2xl shadow-black/50 relative group">
                <BsBriefcase className="text-2xl lg:text-4xl text-teal-500 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#0E1117] border border-white/10 flex items-center justify-center">
                  <BsStars className="text-yellow-400 text-[10px] lg:text-xs" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-lg lg:text-2xl font-bold text-white mb-2 lg:mb-3 tracking-tight">
                {workbenches.length === 0
                  ? "Create Your First Workbench"
                  : "Select a Workbench"}
              </h1>
              <p className="text-gray-400 mb-6 lg:mb-10 leading-relaxed text-xs lg:text-sm max-w-sm mx-auto">
                {workbenches.length === 0
                  ? "Workbenches help you organize financial documents. Create one to start analyzing."
                  : "Choose a workbench from the sidebar to view and manage your files."}
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-6 lg:mb-10 w-full max-w-sm mx-auto">
                <div className="p-3 lg:p-4 rounded-xl bg-[#161B22]/50 border border-white/5 hover:border-teal-500/20 transition-colors">
                  <BsUpload className="text-base lg:text-lg text-teal-400 mx-auto mb-1.5 lg:mb-3" />
                  <div className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Upload</div>
                </div>
                <div className="p-3 lg:p-4 rounded-xl bg-[#161B22]/50 border border-white/5 hover:border-purple-500/20 transition-colors">
                  <BsStars className="text-base lg:text-lg text-purple-400 mx-auto mb-1.5" />
                  <div className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">AI Analysis</div>
                </div>
                <div className="p-3 lg:p-4 rounded-xl bg-[#161B22]/50 border border-white/5 hover:border-cyan-500/20 transition-colors">
                  <BsSearch className="text-base lg:text-lg text-cyan-400 mx-auto mb-1.5 lg:mb-3" />
                  <div className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Search</div>
                </div>
              </div>

              {/* Create workbench CTA */}
              <div className="flex flex-col items-center gap-2 lg:gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 lg:px-8 py-2.5 lg:py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-all group shadow-lg shadow-teal-900/30"
                >
                  <BsPlus className="text-lg text-white" />
                  <span>Create Workbench</span>
                </button>
                <span className="text-[10px] text-gray-600 font-mono">
                  {CREDIT_COSTS.WORKBENCH_CREATE} credits
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Workbench Modal */}
      <CreateWorkbenchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newWorkbench) => {
          if (!newWorkbench) return;
          
          // Only add to list if it's a personal workbench
          if (newWorkbench.type === 'personal') {
            setWorkbenches((prev) => [newWorkbench, ...prev]);
            setSelectedWorkbench(newWorkbench);
          } else {
            toast.success("Company workbench created! You can find it in the Company page.");
          }
          setIsCreateModalOpen(false);
        }}
      />

      {/* Column Mapping Modal */}
      {isMappingModalOpen && pendingDataset && (
        <ColumnMappingModal
          isOpen={isMappingModalOpen}
          onClose={handleSkipMapping}
          columns={datasetColumns}
          datasetId={pendingDataset.id}
          datasetName={pendingDataset.original_filename || "Uploaded File"}
          onSave={handleSaveMapping}
        />
      )}
    </div>
  );
};

export default WorkbenchesPage;
