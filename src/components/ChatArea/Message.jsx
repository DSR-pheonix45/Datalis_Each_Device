import React, { useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import ThinkingIndicator from "./ThinkingIndicator";
import AnalysisModal from "./AnalysisModal";
import { BsLightbulb } from "react-icons/bs";

// Helper to highlight text recursively
const highlightText = (content, query) => {
    if (!query || !content) return content;

    if (Array.isArray(content)) {
        return content.map((child, i) => (
            <React.Fragment key={i}>{highlightText(child, query)}</React.Fragment>
        ));
    }

    if (React.isValidElement(content)) {
        if (content.props.children) {
            return React.cloneElement(content, {
                children: highlightText(content.props.children, query)
            });
        }
        return content;
    }

    if (typeof content === 'string') {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = content.split(new RegExp(`(${escapedQuery})`, 'gi'));

        if (parts.length === 1) return content;

        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-teal-500/30 text-teal-200 border-b border-teal-500/50 px-0.5 rounded-sm animate-pulse no-underline mx-0.5 font-bold">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    }

    return content;
};

const Message = ({ message, searchQuery = "" }) => {
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    const formattedTime = format(new Date(message.timestamp), "h:mm a");
    const isUser = message.role === "user";
    const isAI = message.role === "assistant";

    // Parse Content for Chips and Analysis Data
    const parseContent = (content) => {
        if (!content) return { text: "", chips: [], analysisData: null };

        let text = content;
        const chips = [];
        let analysisData = null;

        // 1. Extract Bracketed Chips [SUGGESTION: ...]
        const bracketRegex = /\[SUGGESTION: (.*?)\]/g;
        let match;
        while ((match = bracketRegex.exec(text)) !== null) {
            // Remove markdown bold/italic markers (* or _) and trim
            const cleanSuggestion = match[1].replace(/[*_]/g, '').trim();
            if (cleanSuggestion) {
                chips.push(cleanSuggestion);
            }
        }
        text = text.replace(bracketRegex, "");

        // 2. Extract Unbracketed Chips SUGGESTION: ...
        // Using replace with callback to handle extraction and removal simultaneously
        // [\s\S]*? matches across newlines, ensuring we catch multi-line suggestions or those separated by newlines
        // Also handles optional markdown bold/italic markers before "SUGGESTION:"
        const plainRegex = /(?:\*\*|__|\*|_)?\s*SUGGESTION:(?:\*\*|__|\*|_)?([\s\S]*?)(?=(?:\*\*|__|\*|_)?\s*SUGGESTION:|$)/g;
        
        text = text.replace(plainRegex, (_, group1) => {
            // Remove markdown bold/italic markers (* or _) and trim
            const cleanSuggestion = group1.replace(/[*_]/g, '').trim();
            if (cleanSuggestion) {
                chips.push(cleanSuggestion);
            }
            return ""; // Remove the suggestion block from the text
        }).trim();

        // 3. Extract Analysis Details XML
        const analysisRegex = /<AnalysisDetails>([\s\S]*?)<\/AnalysisDetails>/;
        const analysisMatch = analysisRegex.exec(text);

        if (analysisMatch) {
            const xmlContent = analysisMatch[1];
            
            // Simple extraction using regex with case insensitivity
            const extractTag = (tag, content) => {
                const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
                const match = regex.exec(content);
                return match ? match[1].trim() : "";
            };

            const sourceContent = extractTag("Source", xmlContent);
            const sourceFile = extractTag("File", sourceContent) || "General Knowledge";
            const sourceLocation = extractTag("Location", sourceContent);
            
            const citationsContent = extractTag("Citations", xmlContent);
            const citationRegex = /<Citation>([\s\S]*?)<\/Citation>/gi;
            const citations = [];
            let citationMatch;
            while ((citationMatch = citationRegex.exec(citationsContent)) !== null) {
                citations.push(citationMatch[1].trim());
            }

            const reasoningContent = extractTag("Reasoning", xmlContent);
            // Split reasoning by numbers (1. , 2. ) or newlines if no numbers
            let reasoningSteps = reasoningContent.split(/\d+\.\s+/).filter(s => s.trim());
            if (reasoningSteps.length === 0 && reasoningContent) {
                reasoningSteps = [reasoningContent];
            }

            const confidence = extractTag("Confidence", xmlContent);

            analysisData = {
                source: {
                    file: sourceFile,
                    location: sourceLocation
                },
                citations: citations,
                reasoning: reasoningSteps,
                confidence: confidence || "0.0"
            };

            // Guardrail: If confidence is 0 or source is None, treat as no analysis
            if (parseFloat(analysisData.confidence) === 0 || sourceFile.toLowerCase() === 'none' || sourceFile.toLowerCase() === 'n/a') {
                analysisData = null;
            }

            // Remove the XML block from displayed text
            text = text.replace(analysisRegex, "");
        }

        return { text, chips, analysisData };
    };

    const { text: displayContent, chips, analysisData } = isAI && !message.isLoading
        ? parseContent(message.content)
        : { text: message.content, chips: [], analysisData: null };

    return (
        <div
            className={`mb-6 flex ${isUser ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-2 duration-500 group`}
        >
            <div
                className={`flex gap-3 max-w-[90%] xl:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"
                    }`}
            >
                {/* Assistant Avatar - Larger & authoritative */}
                {isAI && (
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0E1117] to-[#161B22] border border-white/5 flex items-center justify-center shadow-lg group-hover:border-teal-500/30 transition-colors duration-300">
                            <span className="text-teal-400 font-bold text-lg">D</span>
                        </div>
                    </div>
                )}

                <div className={`flex flex-col space-y-1 ${isUser ? "items-end" : "items-start"}`}>
                    {/* Sender Name & Time */}
                    <div
                        className={`flex items-center gap-2 px-1 ${isUser ? "justify-end" : "justify-start"
                            }`}
                    >
                        <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                            {isAI ? "Dabby Consultant" : "You"}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">{formattedTime}</span>
                    </div>

                    {/* Message Bubble struct */}
                    <div
                        className={`
              relative rounded-2xl px-6 py-5 shadow-sm
              ${isUser
                                ? "bg-[#161B22] text-white border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                                : "bg-[#0E1117] text-gray-200 border border-white/5"
                            }
              ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}
              backdrop-blur-sm
              transition-all duration-200
            `}
                    >
                        <div className="relative z-10 w-full">
                            {isUser ? (
                                // User Message - Simple text with system font
                                <div>
                                    <div
                                        className="text-base leading-relaxed font-normal break-words font-sans"
                                    >
                                        {highlightText(message.content, searchQuery)}

                                        {/* Workbench Context Display */}
                                        {message.options?.workbenchId && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="flex items-center gap-2 text-xs text-teal-400 mb-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="font-semibold">Workbench Context Included</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Attached Documents Display */}
                                        {message.options?.selectedDocuments && message.options.selectedDocuments.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="font-semibold">{message.options.selectedDocuments.length} Document(s) Attached</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {message.options.selectedDocuments.map((doc, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span className="text-purple-200">{doc.file_name}</span>
                                                            {doc.document_type && (
                                                                <span className="text-purple-400/60 uppercase text-[10px]">• {doc.document_type}</span>
                                                            )}
                                                            {doc.classification_confidence && (
                                                                <span className="text-purple-400/60 text-[10px]">• {Math.round(doc.classification_confidence * 100)}%</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attached Files Display */}
                                        {(message.metadata?.files || message.options?.uploadedFiles) && (message.metadata?.files?.length > 0 || message.options?.uploadedFiles?.length > 0) && (
                                            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/10">
                                                {(message.metadata?.files || message.options?.uploadedFiles)?.map((file, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-sm hover:border-teal-500/30 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
                                                            {file.name.endsWith('.pdf') ? (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-white text-xs truncate max-w-[150px]">{file.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">
                                                                {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'File'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : message.isLoading ? (
                                // Loading / Thinking State
                                <ThinkingIndicator context={message.content.toLowerCase()} />
                            ) : (
                                // AI Message with Markdown
                                <div className="w-full">
                                    <div className="prose prose-invert max-w-none break-words prose-p:leading-relaxed prose-pre:bg-[#0D1117] prose-pre:border prose-pre:border-gray-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                            components={{
                                                // Custom Code Block Styling
                                                code({ inline, className, children, ...props }) {
                                                    const highlightedChildren = highlightText(children, searchQuery);
                                                    return inline ? (
                                                        <code className="bg-[#1C2128] text-teal-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{highlightedChildren}</code>
                                                    ) : (
                                                        <code className={`${className} block bg-[#0D1117] p-4 rounded-lg overflow-x-auto text-sm leading-relaxed`} {...props}>{highlightedChildren}</code>
                                                    );
                                                },
                                                // Table Styling
                                                table: ({ children }) => <div className="overflow-x-auto my-4 rounded-xl border border-white/5"><table className="min-w-full text-left">{children}</table></div>,
                                                thead: ({ children }) => <thead className="bg-[#1C2128] text-gray-200 border-b border-gray-700 font-bold">{children}</thead>,
                                                th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-400/90">{highlightText(children, searchQuery)}</th>,
                                                td: ({ children }) => <td className="px-4 py-3 border-b border-gray-800/50 text-sm opacity-90">{highlightText(children, searchQuery)}</td>,
                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/30">{highlightText(children, searchQuery)}</a>,
                                                blockquote: ({ children }) => <blockquote className="border-l-4 border-teal-500/50 pl-4 py-1.5 my-4 bg-teal-500/5 rounded-r text-gray-300 italic">{highlightText(children, searchQuery)}</blockquote>,
                                                // General Text Styling with Highlight
                                                p: ({ children }) => <p className="mb-4 last:mb-0">{highlightText(children, searchQuery)}</p>,
                                                li: ({ children }) => <li className="mb-1">{highlightText(children, searchQuery)}</li>,
                                                ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                                                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b border-white/10 pb-2">{highlightText(children, searchQuery)}</h1>,
                                                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{highlightText(children, searchQuery)}</h2>,
                                                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{highlightText(children, searchQuery)}</h3>,
                                                strong: ({ children }) => <strong className="font-bold text-white">{highlightText(children, searchQuery)}</strong>,
                                                em: ({ children }) => <em className="italic text-gray-300">{highlightText(children, searchQuery)}</em>
                                            }}
                                        >
                                            {displayContent}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Suggestion Chips Section */}
                                    {chips.length > 0 && (
                                        <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in duration-500 border-t border-white/5 pt-4">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 w-full mb-1 ml-1 font-semibold">Suggested Actions:</span>
                                            {chips.map((chip, idx) => (
                                                <button
                                                    key={idx}
                                                    className="px-3.5 py-1.5 bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 rounded-full text-xs font-medium text-teal-400 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 group/chip"
                                                    onClick={() => {
                                                        // Dispatch event for MainApp or ChatInput to handle
                                                        const event = new CustomEvent('suggestionClicked', { detail: chip });
                                                        window.dispatchEvent(event);
                                                    }}
                                                >
                                                    <span>{chip}</span>
                                                    <svg className="w-3 h-3 opacity-50 group-hover/chip:opacity-100 group-hover/chip:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Analysis Logic Button */}
                                    {analysisData && (
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => setIsAnalysisOpen(true)}
                                                className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-teal-400 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-teal-500/20"
                                            >
                                                <BsLightbulb size={12} />
                                                <span>how did we reach till this ?</span>
                                                <span className={`ml-1 text-[10px] font-mono px-1 rounded ${parseFloat(analysisData.confidence) > 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {Math.round(parseFloat(analysisData.confidence) * 100)}%
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Modal */}
            <AnalysisModal 
                isOpen={isAnalysisOpen} 
                onClose={() => setIsAnalysisOpen(false)} 
                analysisData={analysisData} 
            />
        </div>
    );
};

export default Message;
