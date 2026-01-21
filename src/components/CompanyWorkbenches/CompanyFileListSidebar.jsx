import React, { useState, useEffect } from "react";
import { BsChevronLeft, BsChevronRight, BsFileEarmark, BsDownload, BsTrash } from "react-icons/bs";
import { getWorkbenchFiles } from "../../services/companyService";

const CompanyFileListSidebar = ({ workbenchId, selectedFile, onSelectFile, onDeleteFile }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
      const fetchFiles = async () => {
        if (!workbenchId) return;
        setIsLoading(true);
        setError(null);
        const { success, files: fetchedFiles, error: fetchError } = await getWorkbenchFiles(workbenchId);
        if (success) {
          setFiles(fetchedFiles);
          if (fetchedFiles.length > 0 && !selectedFile) {
            onSelectFile(fetchedFiles[0]);
          }
        } else {
          setError(fetchError);
        }
        setIsLoading(false);
      };
      fetchFiles();
    }, [workbenchId, onSelectFile, selectedFile]);

  const handleDelete = (e, file) => {
    e.stopPropagation();
    onDeleteFile(file);
  };

  return (
    <div className={`h-full flex flex-col bg-[#0E1117] border-r border-white/5 transition-all duration-300 ${isExpanded ? "w-72" : "w-16"}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between h-16">
        {isExpanded ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <BsFileEarmark className="w-4 h-4" />
            </div>
            <span className="font-semibold text-white tracking-tight">Files</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mx-auto">
            <BsFileEarmark className="w-4 h-4" />
          </div>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BsChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isExpanded && (
        <div className="py-4 flex justify-center border-b border-white/5">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BsChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <div className="w-5 h-5 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-3"></div>
            {isExpanded && <span className="text-xs">Loading files...</span>}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-xs">
            {error}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <BsFileEarmark className="text-gray-600" />
            </div>
            {isExpanded && <p className="text-[10px] text-gray-500">No files yet</p>}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {files.map((file) => (
              <li key={file.id}>
                <div
                  onClick={() => onSelectFile(file)}
                  className={`p-2.5 cursor-pointer group rounded-md border border-transparent ${selectedFile?.id === file.id
                    ? "bg-teal-500/10 border-teal-500/20"
                    : "hover:bg-[#161B22] hover:border-white/5"
                    } transition-all duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 gap-2.5">
                      <BsFileEarmark
                        className={`w-3.5 h-3.5 flex-shrink-0 ${selectedFile?.id === file.id
                          ? "text-teal-400"
                          : "text-gray-500 group-hover:text-gray-400"
                          }`}
                      />
                      {isExpanded && (
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate mb-0.5 ${selectedFile?.id === file.id
                              ? "text-teal-50"
                              : "text-gray-300"
                              }`}
                          >
                            {file.file_name}
                          </p>
                          <p className="text-[10px] text-gray-600 font-medium">
                            {Math.round(file.file_size / 1024)} KB
                          </p>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-gray-500 hover:text-teal-400 hover:bg-teal-500/10 rounded"
                          title="Download"
                        >
                          <BsDownload className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, file)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Delete"
                        >
                          <BsTrash className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CompanyFileListSidebar;
