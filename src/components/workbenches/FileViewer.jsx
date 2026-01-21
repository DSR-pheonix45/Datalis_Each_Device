import { useState, useEffect } from 'react';
import { BsDownload, BsTrash, BsArrowLeft } from 'react-icons/bs';
import { supabase } from '../../lib/supabase';

export default function FileViewer({ file, onBack, onDownload, onDelete }) {
  const [fileUrl, setFileUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getFileUrl = async () => {
      if (!file) return;
      
      try {
        setIsLoading(true);
        const { data, error: urlError } = await supabase.storage
          .from('workbench-files')
          .getPublicUrl(file.storage_path);

        if (urlError) throw urlError;
        
        setFileUrl(data.publicUrl);
        setError(null);
      } catch (err) {
        console.error('Error getting file URL:', err);
        setError('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    getFileUrl();
  }, [file]);

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const renderFileContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
          <p>{error}</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Back to files
          </button>
        </div>
      );
    }

    const extension = getFileExtension(file.file_name);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
    const isPdf = extension === 'pdf';
    const isText = ['txt', 'csv', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css'].includes(extension);

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img 
            src={fileUrl} 
            alt={file.file_name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="h-full">
          <iframe 
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0"
            title={file.file_name}
          />
        </div>
      );
    }

    if (isText) {
      return (
        <div className="h-full overflow-auto p-4 bg-gray-900 text-gray-100 font-mono text-sm">
          <pre className="whitespace-pre-wrap">
            {file.content || 'File content could not be displayed'}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
        <p className="text-lg mb-4">Preview not available for this file type</p>
        <p className="text-sm mb-6">Download the file to view its contents</p>
        <button
          onClick={() => onDownload(file)}
          className="flex items-center px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-500 text-white"
        >
          <BsDownload className="mr-2" />
          Download {file.file_name}
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-1 mr-2 text-gray-300 hover:text-white"
            title="Back to files"
          >
            <BsArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-medium truncate max-w-xs">
            {file?.file_name || 'No file selected'}
          </h3>
        </div>
        
        {file && (
          <div className="flex space-x-2">
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="Download"
            >
              <BsDownload className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(file)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
              title="Delete"
            >
              <BsTrash className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        {file ? renderFileContent() : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a file to view
          </div>
        )}
      </div>
    </div>
  );
}
