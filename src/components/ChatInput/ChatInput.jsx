import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  BsPaperclip,
  BsSend,
  BsGlobe2,
  BsX,
  BsFileEarmark,
  BsBriefcase,
  BsFileEarmarkText,
  BsImage,
  BsCheck2Circle,
  BsFileEarmarkPdf,
  BsToggleOn,
  BsToggleOff,
} from "react-icons/bs";
import FileSuggestions from "./FileSuggestions";
import VoiceInput from "../VoiceInput/VoiceInput";
import { backendService } from "../../services/backendService";
import ocrService from "../../services/ocrService";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";

const PLACEHOLDERS = [
  "Ask about profit margins...",
  "Compare Q3 and Q4 revenue...",
  "Identify risks in the balance sheet...",
  "Upload a CSV to begin analysis...",
  "Draft a financial summary...",
];

const ChatInput = forwardRef(function ChatInput(
  {
    onSendMessage,
    disabled = false,
    placeholder = "Message Dabby Consultant...",
    initialMessage = "",
    webSearchEnabled = false,
    uploadedFiles = [],
    workbenchContext = null,
    availableWorkbenches = [],
    onToggleWorkbenchContext = null,
  },
  ref
) {
  const [message, setMessage] = useState(initialMessage);
  const [isFocused, setIsFocused] = useState(false);
  const [showWorkbenchSelector, setShowWorkbenchSelector] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [workbenchDocuments, setWorkbenchDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [includeDocumentsInContext, setIncludeDocumentsInContext] = useState(true);
  const [webEnabled, setWebEnabled] = useState(webSearchEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Rotating Placeholder Logic
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDERS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPlaceholder(PLACEHOLDERS[placeholderIndex]);
  }, [placeholderIndex]);

  // Sync with parent's uploadedFiles
  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      setAttachedFiles(uploadedFiles);
    }
  }, [uploadedFiles]);

  // Fetch workbench documents when workbench context changes
  useEffect(() => {
    const fetchWorkbenchDocuments = async () => {
      if (!workbenchContext?.id) {
        setWorkbenchDocuments([]);
        setSelectedDocuments([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("workbench_documents")
          .select("*")
          .eq("workbench_id", workbenchContext.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setWorkbenchDocuments(data || []);
      } catch (error) {
        console.error("Error fetching workbench documents:", error);
      }
    };

    fetchWorkbenchDocuments();
  }, [workbenchContext]);

  // Listen for suggestion clicks from Chat Messages
  useEffect(() => {
    const handleSuggestionClick = (e) => {
      const suggestion = e.detail;
      setMessage(suggestion);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('suggestionClicked', handleSuggestionClick);
    return () => window.removeEventListener('suggestionClicked', handleSuggestionClick);
  }, []);

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => {
      const newFiles = [...prev, ...files];
      setShowSuggestions(true);
      return newFiles;
    });
  };

  const handleDocumentUpload = async (e) => {
    if (!workbenchContext || !workbenchContext.active) {
      toast.error("Please select a workbench first");
      return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);
    const uploadedDocs = [];

    try {
      for (const file of files) {
        // Check if it's an image for OCR
        const isImage = file.type.startsWith('image/');
        let ocrData = null;

        if (isImage) {
          try {
            toast.loading(`Processing ${file.name} with OCR...`, { id: `ocr-${file.name}` });

            // Preprocess and extract text
            const preprocessed = await ocrService.preprocessImage(file);
            const ocrResult = await ocrService.extractText(preprocessed);
            const classification = ocrService.classifyDocumentType(ocrResult.text);

            ocrData = {
              extractedText: ocrResult.text,
              ocrConfidence: ocrResult.confidence,
              classificationConfidence: classification.confidence,
              alternateTypes: classification.alternates
            };

            toast.success(`Detected: ${classification.type} (${Math.round(classification.confidence * 100)}%)`, {
              id: `ocr-${file.name}`,
              icon: <BsCheck2Circle className="text-emerald-400" />
            });
          } catch (ocrError) {
            console.error('OCR failed:', ocrError);
            toast.dismiss(`ocr-${file.name}`);
            // Continue without OCR data
          }
        }

        // Upload to workbench
        toast.loading(`Uploading ${file.name}...`, { id: `upload-${file.name}` });
        const docType = ocrData ? ocrService.classifyDocumentType(ocrData.extractedText).type : 'other';

        const docData = await backendService.uploadDocument(
          workbenchContext.id,
          file,
          docType,
          ocrData
        );

        uploadedDocs.push({ ...docData, file });
        toast.success(`${file.name} uploaded successfully`, { id: `upload-${file.name}` });
      }

      setDocumentFiles((prev) => [...prev, ...uploadedDocs]);
      setShowDocumentUpload(false);
      toast.success(`${files.length} document(s) uploaded to ${workbenchContext.name}`);

    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setIsTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => setIsTyping(false), 500);
    setTypingTimeout(timeout);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [message]);

  // Handle initial message changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Sync web search state
  useEffect(() => {
    setWebEnabled(webSearchEnabled);
  }, [webSearchEnabled]);

  const sendMessage = async (customMessage = null) => {
    const messageToSend = customMessage !== null ? customMessage : message;
    if ((messageToSend.trim() || attachedFiles.length > 0 || workbenchContext?.active) && !disabled && !isLoading) {
      setIsLoading(true);

      try {
        if (onSendMessage) {
          onSendMessage(
            messageToSend,
            {
              web: webEnabled,
              uploadedFiles: attachedFiles,
              workbenchId: workbenchContext?.active ? workbenchContext.id : null,
              selectedDocuments: includeDocumentsInContext ? [...selectedDocuments, ...documentFiles] : [],
              response: null,
              hasContext:
                webEnabled ||
                attachedFiles.length > 0 ||
                workbenchContext?.active ||
                (includeDocumentsInContext && (selectedDocuments.length > 0 || documentFiles.length > 0)),
            },
            false
          );
        }

        setMessage("");
        setAttachedFiles([]);
        setShowSuggestions(false);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setIsTyping(false);
      } catch (error) {
        console.error("ChatInput: Error sending message:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canRunInference = () => {
    return webEnabled || attachedFiles.length > 0 || workbenchContext?.active;
  };

  useImperativeHandle(ref, () => ({
    sendMessage,
    triggerSend: sendMessage,
    canRunInference,
    setMessage,
    getMessage: () => message,
    getWebEnabled: () => webEnabled,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div
      className="bg-black/40 backdrop-blur-md px-2 sm:px-3 py-2 sm:py-3 border-t border-white/5 fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto safe-area-bottom"
      data-tour="chat-input"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Suggestion Files */}
        {showSuggestions && attachedFiles.length > 0 && (
          <div className="mb-2 animate-slide-up">
            <FileSuggestions
              files={attachedFiles}
              onSuggestionClick={handleSuggestionClick}
              compact={true}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group/form">
          {/* Main Input Container */}
          <div
            className={`
                relative flex items-center gap-1 sm:gap-2 bg-[#0D1117] rounded-xl sm:rounded-2xl border transition-all duration-300
                ${isFocused || isTyping || message.length > 0
                ? "border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)] bg-[#0D1117]"
                : "border-white/10 hover:border-white/20 bg-white/5"
              }
            `}
          >
            {/* Left Actions Pool (Data Input) - Collapsed on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1 pl-2 sm:pl-3 pr-1 sm:pr-2 border-r border-white/5">
              {/* Chat File Attachment */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileAttachment}
                multiple
                accept=".pdf,.docx,.csv,.xlsx,.xls,.txt,.json"
                className="hidden"
                aria-label="Attach file for chat"
              />
              <button
                type="button"
                className="group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-200"
                title="Attach Files for Chat"
                disabled={disabled || isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                <BsPaperclip className="text-base sm:text-lg" />
              </button>

              {/* Document Upload to Workbench */}
              {workbenchContext?.active && (
                <>
                  <input
                    type="file"
                    ref={documentInputRef}
                    onChange={handleDocumentUpload}
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                    className="hidden"
                    aria-label="Upload document to workbench"
                  />
                  <button
                    type="button"
                    className="group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200 border border-purple-500/20"
                    title={`Upload Document to ${workbenchContext.name}`}
                    disabled={disabled || isLoading || uploadingDocs}
                    onClick={() => documentInputRef.current?.click()}
                  >
                    <BsFileEarmark className="text-base sm:text-lg" />
                    {uploadingDocs && (
                      <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20 rounded-lg">
                        <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>

                  {/* Select Existing Documents */}
                  <button
                    type="button"
                    className="group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-200 border border-teal-500/20"
                    title="Attach Existing Documents"
                    disabled={disabled || isLoading}
                    onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                  >
                    <BsFileEarmarkText className="text-base sm:text-lg" />
                    {selectedDocuments.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-black text-[9px] rounded-full flex items-center justify-center font-bold">
                        {selectedDocuments.length}
                      </span>
                    )}
                  </button>

                  {/* Toggle Document Context */}
                  <button
                    type="button"
                    className={`group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${includeDocumentsInContext
                        ? 'text-teal-400 bg-teal-500/10'
                        : 'text-gray-400 hover:text-teal-400 hover:bg-teal-500/10'
                      }`}
                    title={includeDocumentsInContext ? "Documents will be included in context" : "Documents won't be included"}
                    onClick={() => setIncludeDocumentsInContext(!includeDocumentsInContext)}
                  >
                    {includeDocumentsInContext ? (
                      <BsToggleOn className="text-xl sm:text-2xl" />
                    ) : (
                      <BsToggleOff className="text-xl sm:text-2xl" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Web Search Toggle - Hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={() => setWebEnabled((v) => !v)}
                disabled={disabled || isLoading}
                title={webEnabled ? "Web Search: ON" : "Web Search: OFF"}
                className={`group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${webEnabled
                  ? "text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                  : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                  }`}
              >
                <BsGlobe2 className="text-base sm:text-lg" />
              </button>
            </div>

            {/* Workbench Context Toggle */}
            <div className="flex items-center gap-1 px-1 relative">
              <button
                type="button"
                onClick={() => {
                  setShowWorkbenchSelector(!showWorkbenchSelector);
                }}
                disabled={disabled || isLoading}
                title={
                  workbenchContext?.active
                    ? `Active Workbench: ${workbenchContext.name}`
                    : availableWorkbenches.length > 0
                      ? "Select Workbench"
                      : "No Workbenches Available"
                }
                className={`group/btn relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${workbenchContext?.active
                  ? "text-teal-400 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                  : "text-gray-400 hover:text-teal-400 hover:bg-teal-500/10"
                  }`}
              >
                <BsBriefcase className="text-base sm:text-lg" />
                {workbenchContext?.active && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                )}
              </button>

              {/* Workbench Selector Dropdown */}
              {showWorkbenchSelector && (
                <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#161B22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                  <div className="px-3 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {workbenchContext?.active ? 'Change Workbench' : 'Select Workbench'}
                    </span>
                    <button onClick={() => setShowWorkbenchSelector(false)} className="text-gray-500 hover:text-white">
                      <BsX />
                    </button>
                  </div>

                  {/* Clear Selection Option */}
                  {workbenchContext?.active && (
                    <button
                      onClick={() => {
                        onToggleWorkbenchContext(); // Toggle off
                        setShowWorkbenchSelector(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-500/10 transition-all border-b border-white/5 text-red-400"
                    >
                      <BsX className="text-sm flex-shrink-0" />
                      <span className="text-xs font-medium">Clear Selection</span>
                    </button>
                  )}

                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {availableWorkbenches.length > 0 ? (
                      availableWorkbenches.map((wb) => (
                        <button
                          key={wb.id}
                          onClick={() => {
                            onToggleWorkbenchContext(wb);
                            setShowWorkbenchSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0 ${workbenchContext?.id === wb.id ? "bg-teal-500/10 text-teal-400 border-l-2 border-l-teal-400" : "text-gray-300"
                            }`}
                        >
                          <BsBriefcase className="text-sm flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate font-medium">{wb.name}</div>
                            {workbenchContext?.id === wb.id && (
                              <div className="text-[10px] text-teal-400/70 mt-0.5">Currently Active</div>
                            )}
                          </div>
                          {workbenchContext?.id === wb.id && (
                            <BsCheck2Circle className="text-teal-400 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <BsBriefcase className="text-gray-600 text-2xl mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-gray-500">No workbenches found.</p>
                        <p className="text-[10px] text-gray-600 mt-1">Create one in the sidebar first.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Selector Dropdown */}
              {showDocumentSelector && workbenchContext?.active && (
                <div className="absolute bottom-full mb-2 left-0 w-80 bg-[#161B22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                  <div className="px-3 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Select Documents ({selectedDocuments.length} selected)
                    </span>
                    <button onClick={() => setShowDocumentSelector(false)} className="text-gray-500 hover:text-white">
                      <BsX />
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {workbenchDocuments.length > 0 ? (
                      workbenchDocuments.map((doc) => {
                        const isSelected = selectedDocuments.some(d => d.id === doc.id);
                        const fileIcon = doc.mime_type?.includes('pdf') ? BsFileEarmarkPdf : BsFileEarmarkText;
                        const Icon = fileIcon;

                        return (
                          <button
                            key={doc.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDocuments(prev => prev.filter(d => d.id !== doc.id));
                              } else {
                                setSelectedDocuments(prev => [...prev, doc]);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0 ${isSelected ? "bg-teal-500/10 text-teal-400 border-l-2 border-l-teal-400" : "text-gray-300"
                              }`}
                          >
                            <Icon className="text-sm flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs truncate font-medium">{doc.file_name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                                <span className="uppercase">{doc.document_type || 'other'}</span>
                                {doc.extracted_text && (
                                  <>
                                    <span>•</span>
                                    <span>OCR: {Math.round((doc.classification_confidence || 0) * 100)}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <BsCheck2Circle className="text-teal-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <BsFileEarmark className="text-gray-600 text-2xl mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-gray-500">No documents found.</p>
                        <p className="text-[10px] text-gray-600 mt-1">Upload documents first.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Text Input Area */}
            <div className="flex-1 relative py-2.5 sm:py-3 px-1 sm:px-2 min-w-0">
              {/* Rotating Placeholder */}
              {!message && !isFocused && (attachedFiles.length === 0 && !workbenchContext?.active) && (
                <span className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 text-gray-500/50 pointer-events-none text-sm sm:text-[15px] animate-fade-in truncate max-w-[calc(100%-1rem)]">
                  {currentPlaceholder}
                </span>
              )}

              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isFocused || attachedFiles.length > 0 || workbenchContext?.active ? placeholder : ""} // Default placeholder when focused
                disabled={disabled || isLoading}
                className="w-full bg-transparent text-gray-100 placeholder-transparent resize-none focus:outline-none text-sm sm:text-[15px] leading-relaxed max-h-[80px] sm:max-h-[120px] overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
                rows={1}
              />
            </div>

            {/* Right Actions (Voice & Send) */}
            <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3 pl-1 sm:pl-2 border-l border-white/5">
              <div className="hidden sm:block">
                <VoiceInput
                  disabled={disabled || isLoading}
                  onTranscript={setMessage}
                  onFinalTranscript={(text) => {
                    setMessage(text);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={(!message.trim() && attachedFiles.length === 0 && !workbenchContext?.active) || disabled || isLoading}
                className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center min-w-[40px] sm:min-w-[44px] ${(message.trim() || attachedFiles.length > 0 || workbenchContext?.active) && !disabled && !isLoading
                  ? "bg-teal-500 text-black hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] transform hover:-translate-y-0.5"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
                  }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/50 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <BsSend className="text-base sm:text-lg" />
                )}
              </button>
            </div>

            {/* Workbench Context Preview */}
            {workbenchContext?.active && (
              <div className="absolute bottom-full left-0 right-0 sm:right-auto mb-2 sm:mb-4 p-2 bg-[#161B22]/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-teal-500/30 shadow-2xl flex flex-col gap-2 sm:min-w-[300px] animate-slide-up z-30 mx-2 sm:mx-0">
                <div className="px-2 py-1 flex justify-between items-center border-b border-white/5 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workbench Context</span>
                  <div className="flex items-center gap-2">
                    {includeDocumentsInContext ? (
                      <span className="text-[10px] text-teal-400 flex items-center gap-1">
                        <BsToggleOn className="text-sm" /> Docs Included
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <BsToggleOff className="text-sm" /> Docs Excluded
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowWorkbenchSelector(true)}
                      className="text-[10px] text-gray-500 hover:text-teal-400 px-2 py-0.5 rounded bg-white/5"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-teal-500/5 border border-teal-500/10 group/workbench">
                  <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 flex-shrink-0">
                      <BsBriefcase className="text-xs sm:text-sm" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-200 truncate font-medium">{workbenchContext.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                        {selectedDocuments.length > 0 ? (
                          `${selectedDocuments.length} Selected Doc(s)`
                        ) : documentFiles.length > 0 ? (
                          `${documentFiles.length} Uploaded Doc(s)`
                        ) : (
                          'Financial Data Included'
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleWorkbenchContext();
                      setDocumentFiles([]);
                      setSelectedDocuments([]);
                    }}
                    className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0"
                    title="Detach Workbench"
                  >
                    <BsX className="text-lg" />
                  </button>
                </div>

                {/* Show selected existing documents */}
                {selectedDocuments.length > 0 && includeDocumentsInContext && (
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] text-gray-400 px-1 mb-1">Selected Documents:</div>
                    {selectedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-[10px]">
                        <BsFileEarmarkText className="text-teal-400 flex-shrink-0" />
                        <span className="text-gray-300 truncate flex-1">{doc.file_name}</span>
                        <span className="text-gray-500 uppercase text-[9px]">{doc.document_type}</span>
                        <button
                          onClick={() => setSelectedDocuments(prev => prev.filter(d => d.id !== doc.id))}
                          className="text-gray-500 hover:text-red-400 flex-shrink-0"
                        >
                          <BsX className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show uploaded documents */}
                {documentFiles.length > 0 && includeDocumentsInContext && (
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] text-gray-400 px-1 mb-1">Uploaded Documents:</div>
                    {documentFiles.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-[10px]">
                        <BsFileEarmarkText className="text-purple-400 flex-shrink-0" />
                        <span className="text-gray-300 truncate flex-1">{doc.file_name || doc.file?.name}</span>
                        <BsCheck2Circle className="text-emerald-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* File Preview Cards (Absolute above) - Mobile optimized */}
            {attachedFiles.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 sm:right-auto mb-2 sm:mb-4 p-2 bg-[#161B22]/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2 sm:min-w-[250px] animate-slide-up z-30 mx-2 sm:mx-0">
                <div className="px-2 py-1 flex justify-between items-center border-b border-white/5 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ready to Upload</span>
                  <span className="text-[10px] text-teal-400">{attachedFiles.length} file(s)</span>
                </div>
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group/file"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 flex-shrink-0">
                        <BsPaperclip className="text-xs sm:text-sm" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-gray-200 truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0"
                    >
                      <BsX className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Helper Footer - Hidden on mobile */}
        <div className="hidden sm:flex mt-3 justify-between items-center px-2 opacity-50 text-[10px] text-gray-500">
          <span>AI responses can be inaccurate. Double check critical financial data.</span>
          <span>{message.length} / 2000</span>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
