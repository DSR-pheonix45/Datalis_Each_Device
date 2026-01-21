import { useEffect, useState, useMemo } from 'react';
import { BsDownload, BsTrash, BsArrowLeft, BsFileCode, BsTable, BsMarkdown, BsFilePdf, BsFileWord, BsEye } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getFileLocally, saveFileLocally } from '../utils/localFileStorage';
import { supabase } from '../lib/supabase';

const FileViewer = ({ file, onBack = () => { }, onDownload = () => { }, onDelete = () => { } }) => {
  const [fileContent, setFileContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!file) return;

    const loadFileContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPdfUrl(null);

        // Check if bucket_path exists
        if (!file.bucket_path) {
          throw new Error('File has no bucket_path');
        }

        const extension = file.file_name.split('.').pop().toLowerCase();

        // Special handling for PDF - we need a Blob URL
        if (extension === 'pdf') {
          const { data, error: downloadError } = await supabase.storage
            .from('workbench-files')
            .download(file.bucket_path);

          if (downloadError) throw downloadError;
          const url = URL.createObjectURL(data);
          setPdfUrl(url);
          setIsLoading(false);
          return;
        }

        // 1. Try to get from local storage (IndexedDB)
        let localFile = await getFileLocally(file.bucket_path);
        let content = localFile?.content;

        // 2. Fallback to Supabase Storage if not found locally
        if (!content) {
          console.log(`[FileViewer] File ${file.bucket_path} not found locally, fetching from Supabase...`);
          
          const { data, error: downloadError } = await supabase.storage
            .from('workbench-files')
            .download(file.bucket_path);

          if (downloadError) {
            throw new Error(`Failed to download from storage: ${downloadError.message}`);
          }

          // For binary files like docx, we need arrayBuffer
          if (['docx', 'doc'].includes(extension)) {
            const buffer = await data.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            content = result.value;
          } else {
            // For text-based files
            content = await data.text();
          }
          
          // Save locally for future use (caching text/html version)
          try {
            await saveFileLocally(file.bucket_path, content);
          } catch (saveErr) {
            console.warn('[FileViewer] Failed to cache file locally:', saveErr);
          }
        }

        if (content) {
          if (['xls', 'xlsx'].includes(extension)) {
            // If content is already HTML (from cache)
            if (content.trim().startsWith('<table')) {
              setFileContent(content);
            } else {
              // Parse Excel from content
              const encoder = new TextEncoder();
              const data = encoder.encode(content);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const html = XLSX.utils.sheet_to_html(firstSheet);
              setFileContent(html);
            }
          } else {
            // For text files and docx (which we converted to html), use content directly
            setFileContent(content);
          }
        } else {
          throw new Error('File content is empty');
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err.message || 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();

    // Cleanup PDF URL
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [file]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading content...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="text-red-400 text-sm font-medium mb-1">Failed to load file</div>
          <div className="text-xs text-gray-500 max-w-xs">{error}</div>
        </div>
      );
    }

    const extension = file?.file_name.split('.').pop().toLowerCase();

    // PDF Preview
    if (extension === 'pdf' && pdfUrl) {
      return (
        <div className="w-full h-full bg-[#0E1117]">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        </div>
      );
    }

    if (!file || !fileContent) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-xs">
          No content available
        </div>
      );
    }

    // Markdown preview
    if (extension === 'md') {
      return (
        <div className="p-8 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
          <ReactMarkdown className="prose prose-invert prose-sm max-w-3xl mx-auto prose-pre:bg-[#161B22] prose-pre:border prose-pre:border-white/5">
            {fileContent}
          </ReactMarkdown>
        </div>
      );
    }

    // JSON preview with syntax highlighting
    if (extension === 'json') {
      try {
        const json = JSON.parse(fileContent);
        return (
          <div className="p-4 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
            <pre className="font-mono text-xs text-gray-300">
              {JSON.stringify(json, null, 2)}
            </pre>
          </div>
        );
      } catch {
        return (
          <div className="p-4 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
            <pre className="font-mono text-xs text-red-300 whitespace-pre-wrap">{fileContent}</pre>
          </div>
        );
      }
    }

    // CSV preview - render as table
    if (extension === 'csv') {
      return <CSVTableView content={fileContent} />;
    }

    // Text file preview
    if (['txt', 'log'].includes(extension)) {
      return (
        <div className="p-6 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
          <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-w-4xl">
            {fileContent}
          </pre>
        </div>
      );
    }

    // Excel preview (already converted to HTML)
    if (['xls', 'xlsx'].includes(extension)) {
      return (
        <div
          className="p-4 overflow-auto h-full bg-[#0E1117] custom-scrollbar excel-preview"
          dangerouslySetInnerHTML={{ __html: fileContent }}
        />
      );
    }

    // Word preview (already converted to HTML via mammoth)
    if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="p-8 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
          <div 
            className="prose prose-invert prose-sm max-w-3xl mx-auto docx-preview"
            dangerouslySetInnerHTML={{ __html: fileContent }}
          />
        </div>
      );
    }

    // Default - show raw content
    return (
      <div className="p-4 overflow-auto h-full bg-[#0E1117] custom-scrollbar">
        <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
          {fileContent}
        </pre>
      </div>
    );
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'xls' || ext === 'xlsx') return <BsTable className="w-4 h-4 text-teal-500" />;
    if (ext === 'md') return <BsMarkdown className="w-4 h-4 text-blue-400" />;
    if (ext === 'json' || ext === 'js') return <BsFileCode className="w-4 h-4 text-yellow-500" />;
    if (ext === 'pdf') return <BsFilePdf className="w-4 h-4 text-red-500" />;
    if (ext === 'doc' || ext === 'docx') return <BsFileWord className="w-4 h-4 text-blue-500" />;
    return <BsFileCode className="w-4 h-4 text-gray-500" />;
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] font-dm-sans">
      {/* Header */}
      <div className="px-4 border-b border-white/5 bg-[#161B22]/50 flex items-center justify-between h-14 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center min-w-0 gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <BsArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-white/5 border border-white/5 hidden md:block">
              {getFileIcon(file?.file_name)}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-200 truncate max-w-md">
                {file?.file_name || 'No file selected'}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono hidden md:block">
                {file?.file_type || 'Unknown type'} • {file?.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onDownload}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all border border-transparent hover:border-white/5 flex items-center gap-2"
            title="Download"
          >
            <BsDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Delete File"
          >
            <BsTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

// CSV Table View Component
const CSVTableView = ({ content }) => {
  if (!content) return null;

  // Parse CSV content
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return <div className="p-10 text-center text-xs text-gray-500">Empty file</div>;

  // Parse headers and rows
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return (
    <div className="overflow-auto h-full w-full bg-[#0E1117] custom-scrollbar">
      <table className="min-w-full divide-y divide-white/5 text-left border-collapse">
        <thead className="bg-[#161B22] sticky top-0 z-10 shadow-sm">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-[11px] font-semibold text-teal-400/90 uppercase tracking-wider border-b border-white/10 whitespace-nowrap bg-[#161B22]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-white/[0.02] transition-colors group">
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap group-hover:text-gray-200 border-r border-transparent last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 bg-[#161B22] text-[10px] text-gray-500 sticky bottom-0 border-t border-white/5 flex justify-between px-4">
        <span>{rows.length} rows</span>
        <span>{headers.length} columns</span>
      </div>
    </div>
  );
};

export default FileViewer;
