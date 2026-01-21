import { useState } from "react";
import {
  BsChevronLeft,
  BsChevronRight,
  BsFileEarmark,
  BsDownload,
  BsTrash,
  BsPlus,
  BsFileText,
  BsCollection
} from "react-icons/bs";

export default function FileListSidebar({
  files = [],
  selectedFile,
  onSelectFile = () => { },
  onUploadFile = () => { },
  onDeleteFile = () => { },
  workbenchName = "Files",
  onBack, // Mobile back navigation
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDelete = (e, file) => {
    e.stopPropagation();
    onDeleteFile(file);
  };

  return (
    <div
      className={`flex flex-col bg-[#0E1117] border-r border-white/5 transition-all duration-300
        sm:h-full h-full w-full sm:w-auto
        ${isExpanded ? "sm:w-64" : "sm:w-12"}
        ${!isExpanded ? "hidden sm:flex" : ""}
      `}
    >
      <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between h-14 bg-[#161B22]/50">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="sm:hidden p-2 mr-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <BsChevronLeft className="w-4 h-4" />
          </button>
        )}
        {isExpanded ? (
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-widest truncate">
              {workbenchName}
            </h2>
          </div>
        ) : (
          <div className="mx-auto text-teal-500">
            <BsCollection className="w-4 h-4" />
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden sm:block p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          {isExpanded ? <BsChevronLeft className="w-3 h-3" /> : <BsChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 border-b border-white/5">
          <button
            onClick={onUploadFile}
            className="w-full flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 text-gray-200 text-xs font-semibold rounded-lg transition-all hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-400 group"
          >
            <BsPlus className="w-4 h-4 mr-1 text-teal-500" />
            Upload File
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
        {files.length > 0 ? (
          files.map((file) => (
            <div
              key={file.id}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // Download handler would likely be passed down, but for now specific hook
                      }}
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
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <BsFileText className="text-gray-600" />
            </div>
            {isExpanded && <p className="text-[10px] text-gray-500">No files yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
