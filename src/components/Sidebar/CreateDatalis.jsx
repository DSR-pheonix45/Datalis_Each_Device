import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';

const CreateDatalis = ({ isOpen, onClose, onSave }) => {
  const { darkMode } = useTheme();
  const [datalisName, setDataalisName] = useState('');
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!datalisName.trim() || files.length === 0) return;
    
    onSave({
      name: datalisName,
      files,
      createdAt: new Date().toISOString()
    });
    
    setDataalisName('');
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Create New Datalis
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Datalis Name
            </label>
            <input
              type="text"
              value={datalisName}
              onChange={(e) => setDataalisName(e.target.value)}
              className={`w-full p-2 border rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Enter Datalis name"
            />
          </div>

          <div className="mb-4">
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Upload Files
            </label>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className={`w-full p-2 border rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Supported formats: CSV, Excel
            </p>
          </div>

          {files.length > 0 && (
            <div className={`mb-4 p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Selected files:</p>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} hover:text-red-700`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md ${
                darkMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateDatalis;