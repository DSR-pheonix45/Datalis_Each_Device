import { extractPdfText } from "./pdfParser";
import { read, utils } from "xlsx";

// LLM API service - Using Groq API (100% FREE & FAST!)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Get Groq API key from environment variable
const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY ||
  "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";

// Fallback API keys
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// FREE Models on Groq (super fast!)
const FREE_MODELS = [
  "llama-3.1-8b-instant", // Higher rate limits, best for large context
  "llama-3.3-70b-versatile", // Very smart but strict rate limits (1k TPM)
];



/**
 * Process uploaded files for Edge Function (read content in frontend)
 */
async function processUploadedFilesForEdgeFunction(uploadedFiles) {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return [];
  }

  let processedFiles = [];

  for (const file of uploadedFiles) {
    try {
      const content = await readFileContent(file);
      if (content) {
        processedFiles.push({
          name: file.name,
          content: content,
          size: file.size,
          type: file.type,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to process file ${file.name} for Edge Function:`,
        error
      );
      processedFiles.push({
        name: file.name,
        content: `Error reading file: ${error.message}`,
        size: file.size,
        type: file.type,
      });
    }
  }

  return processedFiles;
}

/**
 * Process already-processed file data for direct API calls (files are already objects with content)
 */
async function processUploadedFilesForDirectAPI(uploadedFiles) {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return "";
  }

  let fileContents = [];

  for (const fileData of uploadedFiles) {
    try {
      if (fileData.content && fileData.name) {
        fileContents.push(
          `--- File: ${fileData.name} ---\n${fileData.content}\n--- End of ${fileData.name} ---\n`
        );
      }
    } catch (error) {
      console.warn(`Failed to process file data ${fileData.name}:`, error);
      fileContents.push(
        `--- File: ${fileData.name || "Unknown"} (could not read content) ---\n`
      );
    }
  }
  return fileContents.join("\n");
}

/**
 * Read file content based on file type
 */
async function readFileContent(file) {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  // Handle text-based files
  if (
    [
      "txt",
      "md",
      "json",
      "csv",
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "py",
      "java",
      "cpp",
      "c",
      "php",
      "rb",
      "go",
    ].includes(fileExtension)
  ) {
    return await file.text();
  }

  // Handle PDF files
  if (fileExtension === "pdf") {
    try {
      return await extractPdfText(file);
    } catch (error) {
      console.warn("Failed to parse PDF file:", error);
      return `PDF Document: ${file.name}\nSize: ${file.size} bytes\nError: Could not extract PDF text`;
    }
  }

  // Handle Excel files - try to read as binary and extract data
  if (fileExtension === "xlsx") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const content = await parseExcelFile(arrayBuffer, file.name);
      return content;
    } catch (error) {
      console.warn("Failed to parse Excel file:", error);
      return `Excel Document: ${file.name}\nSize: ${file.size} bytes\nError: Could not parse Excel content\nPlease ensure this is a valid Excel file.`;
    }
  }

  // Handle CSV files (more reliable than Excel parsing)
  if (fileExtension === "csv") {
    try {
      const csvContent = await file.text();
      console.log("CSV content length:", csvContent.length);

      // Parse CSV into structured data
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length > 0) {
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        // LIMIT INCREASE: Handle up to 5000 rows or 200KB of text
        const MAX_ROWS = 5000;
        const MAX_CHARS = 15000; // Adjusted for stricter Groq free tier limits (approx 4k tokens)

        const dataRows = lines.slice(1, Math.min(lines.length, MAX_ROWS + 1));

        let formattedData = `CSV Document: ${file.name}\nSize: ${file.size} bytes\nTotal Rows: ${lines.length - 1}\n\nHeaders: ${headers.join(" | ")}\n\nData Preview:\n`;

        let currentChars = formattedData.length;
        let processedRows = 0;

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const values = row.split(",").map((v) => v.trim().replace(/"/g, ""));
          const rowString = `Row ${i + 1}: ${values.join(" | ")}\n`;

          if (currentChars + rowString.length > MAX_CHARS) {
            formattedData += `\n... [Truncated after ${processedRows} rows due to size limit] ...`;
            break;
          }

          formattedData += rowString;
          currentChars += rowString.length;
          processedRows++;
        }

        if (lines.length > MAX_ROWS && processedRows === MAX_ROWS) {
          formattedData += `\n... and ${lines.length - 1 - MAX_ROWS} more rows (truncated)`;
        }

        return formattedData;
      }

      return `CSV Document: ${file.name}\nSize: ${file.size
        } bytes\n\nContent:\n${csvContent.substring(0, 5000)}\n${csvContent.length > 5000 ? "\n... (truncated)" : ""
        }`;
    } catch (error) {
      console.warn("Failed to parse CSV file:", error);
      return `CSV Document: ${file.name}\nSize: ${file.size} bytes\nError: Could not parse CSV content\nPlease ensure this is a valid CSV file.`;
    }
  }

  // Handle Office documents (would need additional libraries)
  if (fileExtension === "docx") {
    return `Word Document: ${file.name}\nSize: ${file.size} bytes\nNote: Office document parsing not yet implemented`;
  }
}

/**
 * Parse Excel file content using SheetJS (xlsx)
 */
async function parseExcelFile(arrayBuffer, fileName) {
  try {
    console.log(
      "Parsing Excel file:",
      fileName,
      "Size:",
      arrayBuffer.byteLength,
      "bytes"
    );

    // Parse workbook
    const workbook = read(arrayBuffer, { type: "array" });
    let combinedContent = [];

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      // Convert to CSV with extensive limit (limiting to ~1000 rows/columns avoids crashing but allows "big files")
      const csvContent = utils.sheet_to_csv(sheet, {
        blankrows: false,
        skipHidden: true
      });

      if (csvContent && csvContent.length > 10) {
        combinedContent.push(`\n=== SHEET: ${sheetName} ===\n${csvContent}`);
      }
    });

    const finalContent = combinedContent.join("\n");

    if (finalContent.length > 500000) {
      // Safety truncation for extremely large files, though Llama 3.3 70b has 128k context
      console.warn("Excel file content truncated due to extreme size");
      return `Excel Document: ${fileName}\n\n${finalContent.substring(0, 500000)}\n\n... (Content truncated due to size limits)`;
    }

    if (finalContent.trim().length === 0) {
      return `Excel Document: ${fileName}\n(File appears empty or contains no readable text data)`;
    }

    return `Excel Document: ${fileName}\n${finalContent}`;
  } catch (error) {
    console.error("Excel parsing error:", error);
    return `Excel Document: ${fileName}\nError: ${error.message}\nPlease ensure this is a valid Excel file.`;
  }
}


/**
 * Call Groq API (100% FREE and FAST!)
 */
async function callGroqAPI(request, model) {
  try {
    const apiKey = GROQ_API_KEY;

    if (!apiKey || apiKey === "PASTE_YOUR_GROQ_API_KEY_HERE") {
      throw new Error(
        "⚠️ GROQ_API_KEY not configured!\n\n" +
        "Get your FREE API key:\n" +
        "1. Go to https://console.groq.com/keys\n" +
        "2. Sign up (free)\n" +
        "3. Create API key\n" +
        "4. Paste in llmService.js"
      );
    }

    console.log(`🚀 Calling Groq API with model: ${model}`);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: request.messages || [
          {
            role: "system",
            content: `You are Dabby Consultant, an expert financial AI assistant. Your goal is to provide specific, actionable financial insights.

CRITICAL BEHAVIOR RULES:
1.  **Be Concise**: Avoid long, "documentation-style" lists. Get straight to the point.
2.  **Structure**: Use short paragraphs. Use bolding for key metrics.
3.  **Suggestions**: Instead of a bullet list of "what I can do", provide 2-3 specific, clickable "Suggestion Chips" at the end of your response for the user's next likely action.
    Format them EXACTLY like this at the very end:
    [SUGGESTION: Analyze detail]
    [SUGGESTION: Create chart]
    [SUGGESTION: Compare periods]

4.  **Tone**: Professional but strictly "product-like"—modern, sharp, and direct. Avoid filling space with polite fluff.
5.  **Data Analysis**: If data is provided, analyze it deeply for anomalies, trends, and growth metrics.
6.  **Realtime**: If realtime data is provided in context, use it. Otherwise, admit lack of live data.

Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
          },
          ...(request.history || []), // Inject history here
          {
            role: "user",
            content:
              request.query +
              (request.context ? `\n\n=== RELEVANT DATA / FILE CONTENT ===\n${request.context}` : "") +
              (request.web_search
                ? "\n\nInclude relevant information from the web."
                : ""),
          },
        ],
        max_tokens: 4096, // Increased for longer responses
        temperature: 0.6, // Slightly lowered for more analytical precision
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Groq API error with ${model}:`,
        response.status,
        errorText
      );
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Groq response received for ${model}:`, data);

    if (data.error) {
      console.error(`Groq API error in response for ${model}:`, data.error);
      throw new Error(data.error.message);
    }

    const responseText = data.choices?.[0]?.message?.content;
    console.log(
      `Groq response text for ${model}:`,
      responseText?.substring(0, 100)
    );

    if (!responseText) {
      console.error(`No response text found in Groq data:`, data);
      throw new Error(`No response from Groq API using ${model}`);
    }

    console.log(`✅ Groq API succeeded with ${model}`);
    return { response: responseText };
  } catch (error) {
    console.error(`❌ Groq API call failed with ${model}:`, error);
    throw error;
  }
}

/**
 * Fallback: Call Gemini API directly
 */
async function callGeminiAPI(request) {
  try {
    if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");

    console.log("🚀 Falling back to Gemini API...");
    
    // We use gemini-1.5-flash which is fast and has a generous free tier
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const systemPrompt = `You are Dabby Consultant, an expert financial AI assistant. Your goal is to provide specific, actionable financial insights.
    Be concise, professional, and provide 2-3 specific clickable suggestions at the end in the format [SUGGESTION: Action].`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `SYSTEM INSTRUCTIONS: ${systemPrompt}\n\nUSER QUERY: ${request.query}${request.context ? `\n\nCONTEXT: ${request.context}` : ""}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) throw new Error("No response from Gemini API");

    console.log("✅ Gemini API succeeded");
    return { response: responseText };
  } catch (error) {
    console.error("❌ Gemini API call failed:", error);
    throw error;
  }
}

/**
 * Fallback: Call OpenRouter API
 */
async function callOpenRouterAPI(request) {
  try {
    if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key not configured");

    console.log("🚀 Falling back to OpenRouter API...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://datalis.ai",
        "X-Title": "Datalis"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Good balanced model on OpenRouter
        messages: [
          {
            role: "system",
            content: "You are Dabby Consultant, an expert financial AI assistant."
          },
          {
            role: "user",
            content: request.query + (request.context ? `\n\nContext: ${request.context}` : "")
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) throw new Error("No response from OpenRouter API");

    console.log("✅ OpenRouter API succeeded");
    return { response: responseText };
  } catch (error) {
    console.error("❌ OpenRouter API call failed:", error);
    throw error;
  }
}

export async function callLLMDirectly(request) {
  // 1. Try FREE Groq models first
  console.log("🆓 Trying Groq models...");

  for (let i = 0; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i];
    try {
      console.log(`Trying Groq model ${i + 1}/${FREE_MODELS.length}: ${model}`);
      const result = await callGroqAPI(request, model);
      return result;
    } catch (error) {
      const isAuthError = error.message.includes("401") || error.message.toLowerCase().includes("invalid api key");
      console.warn(`❌ Groq model ${model} failed:`, error.message);

      if (isAuthError) {
        console.warn("Auth error detected, skipping other Groq models...");
        break; // Don't bother with other models if API key is invalid
      }
      
      if (i === FREE_MODELS.length - 1) {
        console.log("All Groq models failed.");
      }
    }
  }

  // 2. Fallback to Gemini if Groq fails
  if (GEMINI_API_KEY) {
    try {
      console.log("🚀 Trying Gemini fallback...");
      const result = await callGeminiAPI(request);
      return result;
    } catch (error) {
      console.warn("❌ Gemini fallback failed:", error.message);
    }
  }

  // 3. Fallback to OpenRouter as last resort
  if (OPENROUTER_API_KEY) {
    try {
      console.log("🚀 Trying OpenRouter fallback...");
      const result = await callOpenRouterAPI(request);
      return result;
    } catch (error) {
      console.error("❌ OpenRouter fallback failed:", error.message);
    }
  }

  return {
    response: "I'm sorry, I'm having trouble connecting to my AI engines. This could be due to invalid API keys or rate limits. Please check your configuration in the .env file.",
    error: "All LLM providers failed"
  };
}

/**
 * Upload files to Supabase and process them for RAG
 */
async function uploadFilesToSupabase(uploadedFiles) {
  const { supabase } = await import("../lib/supabase.js");
  const results = [];

  for (const file of uploadedFiles) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      const base64Content = btoa(binary);

      const { data, error } = await supabase.functions.invoke(
        "workbench-files-upload",
        {
          body: {
            file: {
              name: file.name,
              type: file.type,
              content: base64Content,
            },
          },
        }
      );

      if (error) {
        results.push({ name: file.name, success: false, error: error.message });
      } else {
        results.push({
          name: file.name,
          success: true,
          fileId: data?.file?.id,
        });
      }
    } catch (err) {
      results.push({ name: file.name, success: false, error: err.message });
    }
  }

  return results;
}

/**
 * Query RAG context from Supabase using vector search
 */
async function queryRAGContext(query) {
  try {
    const { supabase } = await import("../lib/supabase.js");

    const { data, error } = await supabase.functions.invoke("query_context", {
      body: {
        query: query,
        limit: 5,
      },
    });

    if (error) {
      console.error("RAG context query error:", error);
      return null;
    }

    return data.context || null;
  } catch (error) {
    console.error("Error querying RAG context:", error);
    return null;
  }
}

/**
 * Main function that handles RAG context retrieval and LLM calls
 */
export async function callLLMWithFallback(request) {
  console.log("callLLMWithFallback called with:", request);

  let combinedContext = request.context || "";

  // 1. Process and upload files if provided
  if (request.uploaded_files && request.uploaded_files.length > 0) {
    console.log("Processing files for immediate context...");

    const { LocalRAG } = await import("./localRAG");

    // Extract file content for immediate use
    const processedFiles = [];

    for (const file of request.uploaded_files) {
      try {
        const rawContent = await readFileContent(file);

        // If CSV, use RAG to filter relevant rows
        let finalContent = rawContent;
        if (file.name.endsWith('.csv')) {
          console.log(`Applying Local RAG to ${file.name} with query: "${request.query}"`);
          finalContent = LocalRAG.searchCSV(rawContent, request.query || "", 60); // Get top 60 relevant rows
        } else {
          // For non-CSV, hard limit to prevent crashing
          if (finalContent.length > 6000) {
            finalContent = finalContent.substring(0, 6000) + "\n...(Truncated for size)...";
          }
        }

        processedFiles.push({
          name: file.name,
          content: finalContent
        });

      } catch (e) {
        console.error("Error reading file for RAG", e);
      }
    }

    const fileContext = processedFiles
      .map(
        (f) =>
          `\n--- File: ${f.name} ---\n${f.content}\n--- End of ${f.name} ---\n`
      )
      .join("\n");

    // Add file content to context immediately
    if (fileContext.trim()) {
      combinedContext += "\n\n=== Relevant File Context (Filtered) ===\n" + fileContext;
      console.log("Added file content to context, length:", fileContext.length);
    }

    // Skip Supabase upload for now (edge functions not deployed)
    // TODO: Enable this once edge functions are deployed with CORS configured
    /*
    console.log('Uploading files to Supabase for RAG processing...')
    const uploadResults = await uploadFilesToSupabase(request.uploaded_files, request.workbench_id)
    const uploadedCount = uploadResults.filter(r => r.success).length
    console.log(`Uploaded ${uploadedCount}/${uploadResults.length} files successfully for RAG`)
    */
  }

  // 2. Query RAG context if workbench is active (skip for now - edge functions not deployed)
  /*
  if (request.workbench_id) {
    console.log('Querying RAG context from Supabase...')
    const ragContext = await queryRAGContext(request.query, request.workbench_id)
    
    if (ragContext) {
      console.log('RAG context retrieved, length:', ragContext.length)
      combinedContext += '\n\n=== Relevant Context from Documents ===\n' + ragContext
    } else {
      console.log('No RAG context found or query failed')
    }
  }
  */

  // 3. Skip edge function, use direct LLM API call (edge functions not deployed)
  /*
  try {
    console.log('Trying Supabase edge function...')
 
    const { supabase } = await import('../lib/supabase.js')
 
    const { data, error } = await supabase.functions.invoke('chat_query', {
      body: {
        query: request.query,
        context: combinedContext,
        web_search: request.web_search || false,
        workbench_id: request.workbench_id || null
      }
    })
 
    if (error) throw error
 
    if (data?.response) {
      console.log('Edge function succeeded')
      return { response: data.response, context: combinedContext }
    }
 
  } catch (error) {
    console.warn('Edge function failed, falling back to direct LLM call:', error)
  }
  */

  // 3. Web Search (if explicitly requested via web_search flag)
  if (request.web_search) {
    console.log("Web search enabled, fetching latest information...");
    try {
      const { WebSearchService } = await import("./webSearchService");
      const searchResults = await WebSearchService.search(request.query);
      
      if (searchResults && searchResults.trim()) {
        combinedContext += "\n\n" + searchResults;
        console.log("Added web search results to context");
      }
    } catch (error) {
      console.error("Web search failed:", error);
      // Continue without web search results if there's an error
    }
  }

  // 4. Use direct LLM API call with context and history
  console.log("Using direct LLM API call with file context");

  // Format history for the LLM
  // We need to allow the caller to pass 'history' which is an array of messages
  // We map them to the { role, content } format expected by the API
  let formattedHistory = [];
  if (request.history && Array.isArray(request.history)) {
    // Take the last 20 messages to preserve context window
    const recentHistory = request.history.slice(-20);
    formattedHistory = recentHistory.map(msg => ({
      role: msg.role || (msg.sender === "You" ? "user" : "assistant"),
      content: msg.content
    })).filter(msg => msg.content && msg.role); // Ensure valid messages
  }

  const result = await callLLMDirectly({
    ...request,
    history: formattedHistory,
    context: combinedContext,
  });
  console.log("Direct LLM API call result:", result);
  return { response: result.response, context: combinedContext };
}


/**
 * Generate a natural language response explaining data results
 * @param {Array} results - Array of computed results
 * @param {string} originalQuery - User's original query
 * @returns {Promise<string>} - Natural language explanation
 */
export async function generateExplanation(results, originalQuery) {
  if (!results || results.length === 0) {
    return "I couldn't compute any results with the current data mapping. Please ensure your columns are mapped correctly.";
  }

  const summary = results
    .map((res) => {
      const value =
        typeof res.value === "number" ? res.value.toFixed(2) : res.value;
      return `- ${res.name}: ${value}${res.unit || ""}`;
    })
    .join("\n");

  let systemPrompt = `You are Dabby, an expert Business Consultant AI and Data Analyst powered by Groq.
You help users analyze their business data and uploaded documents to provide actionable insights.

Current Functionality:
- You have access to real-time data ONLY via the Web Search tool if enabled.
- You can process uploaded files (CSV, PDF, etc.) by searching them for relevant context.

Important Rules:
1. Current Date: Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Use this for any time-based reasoning.
2. If the user asks about "current" events and you don't have search results, admit it but use the Today's Date to answer time questions.
3. Be concise and professional.`;

  const prompt = `${systemPrompt}\n\nYou are a financial analyst. The user asked: "${originalQuery}"

Based on their data, here are the computed results:
${summary}

Provide a brief, insightful analysis of these results. Include:
1. Key observations
2. Any concerning or positive trends
3. Brief recommendations if applicable

Keep the response concise (2-3 paragraphs max) and use business-friendly language.`;

  try {
    const result = await callLLMDirectly({
      query: prompt,
      context: "",
    });

    return result.response;
  } catch (error) {
    console.error("Error generating explanation:", error);
    return `Here are your computed results:\n${summary}`;
  }
}

/**
 * AI-powered Decision Intelligence Discovery
 * Identifies Measures, Insights, and Business Questions instead of raw formulas.
 */
export async function discoverInsightsWithAI(headers, sampleData, fileName) {
  const isTransposed = headers.length > 20 && sampleData.length < 5;
  
  const prompt = `
    You are a Principal Product Engineer and FP&A Analyst. 
    I have a file named "${fileName}".
    
    DATA STRUCTURE:
    - Headers: ${headers.join(", ")}
    - Sample data: ${JSON.stringify(sampleData, null, 2)}
    - Orientation: ${isTransposed ? "Row-wise" : "Column-wise"}
    
    TASK:
    Instead of calculating formulas, identify the "Decision Intelligence" layer for this business.
    
    1. Identify MEASURES (Atomic raw data points).
    2. Suggest INSIGHTS (Time-aware aggregations like Total Sales Monthly).
    3. Suggest INDICATORS (Behavioral trends like MoM Growth).
    4. Define ANALYTICAL QUESTIONS (The high-level business health questions this data answers).

    Response format (ONLY valid JSON):
    {
      "measures": [
        { "id": "revenue", "name": "Revenue", "column": "Exact Header Name" }
      ],
      "insights": [
        { "id": "total_revenue", "name": "Total Revenue", "measure": "revenue", "aggregation": "sum" }
      ],
      "indicators": [
        { "id": "rev_growth", "name": "Revenue Growth", "insight": "total_revenue", "type": "growth" }
      ],
      "questions": [
        {
          "id": "sales_health",
          "question": "Is our sales growth sustainable?",
          "indicator": "rev_growth",
          "thresholds": { "healthy": ">10", "watch": "0-10", "risk": "<0" }
        }
      ]
    }
  `;

  try {
    const result = await callLLMDirectly({
      query: prompt,
      context: "",
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result.response;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error in AI discovery:", error);
    return null;
  }
}
