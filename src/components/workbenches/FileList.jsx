import { BsFileEarmark, BsDownload, BsTrash } from 'react-icons/bs';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function FileList({ workbenchId, selectedFile, onSelectFile, onDeleteFile, onDownloadFile }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (file, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${file.file_name}?`)) {
      try {
        setIsDeleting(true);
        const { error } = await supabase
          .from('workbench_files')
          .delete()
          .eq('id', file.id);

        if (error) throw error;
        
        onDeleteFile(file);
        toast.success('File deleted');
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownload = async (file, e) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase.storage
        .from('workbench-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Files</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {workbenchId ? (
          <div className="divide-y divide-gray-700">
            {selectedFile ? (
              <div 
                key={selectedFile.id} 
                className={`p-3 cursor-pointer hover:bg-gray-800 ${
                  selectedFile.id === selectedFile?.id ? 'bg-gray-800' : ''
                }`}
                onClick={() => onSelectFile(selectedFile)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <BsFileEarmark className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{selectedFile.file_name}</p>
                      <p className="text-xs text-gray-400">
                        {Math.round(selectedFile.file_size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => handleDownload(selectedFile, e)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Download"
                    >
                      <BsDownload />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(selectedFile, e)}
                      className="p-1 text-red-400 hover:text-red-300"
                      disabled={isDeleting}
                      title="Delete"
                    >
                      <BsTrash />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400">
                No file selected
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            Select a workbench
          </div>
        )}
      </div>
    </div>
  );
}
