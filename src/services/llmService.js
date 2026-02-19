import { extractPdfText } from "./pdfParser";
import { read, utils } from "xlsx";
import mammoth from "mammoth";
import { rlService } from "./ReinforcementLearningService"; // Import RL Service

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
 * Read file content based on file type
 */
export async function readFileContent(file) {
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

  // Handle Office documents
  if (fileExtension === "docx" || fileExtension === "doc") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return `Word Document: ${file.name}\n${result.value}`;
    } catch (error) {
      console.warn("Failed to parse Word file:", error);
      return `Word Document: ${file.name}\nSize: ${file.size} bytes\nError: Could not extract text from Word document`;
    }
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
      // Convert to JSON first to get structured data with row numbers
      const jsonData = utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      
      if (jsonData && jsonData.length > 0) {
        let sheetContent = `\n=== SHEET: ${sheetName} ===\n`;
        // Add headers
        const headers = jsonData[0];
        sheetContent += `Headers: ${headers.join(" | ")}\n`;
        
        // Add rows with numbers
        // Limit to 200 rows per sheet to avoid token overflow
        const MAX_SHEET_ROWS = 200; 
        const dataRows = jsonData.slice(1, Math.min(jsonData.length, MAX_SHEET_ROWS + 1));
        
        dataRows.forEach((row, index) => {
           sheetContent += `Row ${index + 2}: ${row.join(" | ")}\n`;
        });
        
        if (jsonData.length > MAX_SHEET_ROWS) {
            sheetContent += `... [Truncated ${jsonData.length - MAX_SHEET_ROWS} more rows] ...\n`;
        }
        
        combinedContent.push(sheetContent);
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

    // 2. Map history to strict format required by LLM APIs (only role and content)
    const formattedHistory = (request.history || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // [RL] Get User Learnings & Strategy
    const userId = request.userId;
    const userLearnings = rlService.getLearningsContext(userId);
    const strategy = rlService.selectStrategy(userId);
    console.log(`[RL] Applied Strategy: ${strategy.name}`);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are Dabby Consultant, an expert financial AI assistant. Your goal is to provide specific, actionable financial insights.

[USER LEARNINGS FROM PAST SESSIONS]
${userLearnings}

[CURRENT STRATEGY: ${strategy.name}]
${strategy.prompt}

CRITICAL BEHAVIOR RULES:
1.  **NO HALLUCINATIONS / NO FAKE DATA**: 
    - If the user asks for an overview but provides NO file and NO specific data context, do NOT invent numbers. 
    - Do NOT generate generic tables with "Investments: $120,000" or similar placeholders. 
    - Instead, politely state: "I don't have access to your financial data yet. Please upload a file (PDF, CSV, Excel) or connect a Workbench to get started."

2.  **Be Concise**: Avoid long, "documentation-style" lists. Get straight to the point.
3.  **Structure**: Use short paragraphs. Use bolding for key metrics.
4.  **Suggestions**: Instead of a bullet list of "what I can do", provide 2-3 specific, clickable "Suggestion Chips" at the end of your response for the user's next likely action.
    Format them EXACTLY like this at the very end:
    [SUGGESTION: Analyze detail]
    [SUGGESTION: Identify trends]
    [SUGGESTION: Compare periods]

5.  **Tone**: Professional but strictly "product-like"—modern, sharp, and direct. Avoid filling space with polite fluff.
6.  **Data Analysis**: ONLY analyze data that is explicitly provided in the context or files. If data is missing, ask for it.
7.  **Realtime**: If realtime data is provided in context, use it. Otherwise, admit lack of live data.
8.  **Explainability & Citations**:
        CRITICAL: If you used any data from the provided files, you MUST provide at least one specific citation in the text (e.g., "According to the P&L (Row 5)..."). Do NOT output any XML or hidden blocks.

Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
          },
          ...formattedHistory,
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

    // Updated to v1 API endpoint (v1beta is deprecated and often fails)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are Dabby Consultant, an expert financial AI assistant. Your goal is to provide specific, actionable financial insights.
    
    CRITICAL: 
    - If NO data/context is provided, DO NOT hallucinate financial numbers. Politey ask for a file or context.
    - Be concise, professional, and provide 2-3 specific clickable suggestions at the end in the format [SUGGESTION: Action].`;

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
        "model": "google/gemini-2.0-flash-001", // Good balanced model on OpenRouter
        "messages": [
          {
            "role": "system",
            "content": "You are Dabby Consultant, an expert financial AI assistant. If NO context is provided, DO NOT hallucinate numbers. Ask for data."
          },
          {
            "role": "user",
            "content": request.query + (request.context ? `\n\nContext: ${request.context}` : "")
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
    }
  }

  // 2. Fallback to Gemini
  try {
    console.log("⚠️ Groq failed, falling back to Gemini...");
    return await callGeminiAPI(request);
  } catch (error) {
    console.warn("❌ Gemini fallback failed:", error.message);
  }

  // 3. Fallback to OpenRouter
  try {
    console.log("⚠️ Gemini failed, falling back to OpenRouter...");
    return await callOpenRouterAPI(request);
  } catch (error) {
    console.warn("❌ OpenRouter fallback failed:", error.message);
  }

  // If all models fail, return error
  return {
    response: "I'm sorry, I'm having trouble connecting to all available AI services (Groq, Gemini, OpenRouter). Please try again later or check your API keys.",
    error: "All LLM services failed"
  };
}



/**
 * Main function that handles RAG context retrieval and LLM calls
 */
export async function callLLMWithFallback(request) {
  console.log("callLLMWithFallback called with:", {
    query: request.query,
    contextLength: request.context?.length,
    filesCount: request.uploaded_files?.length,
    web_search: request.web_search
  });

  let combinedContext = request.context || "";

  // Add currency context if available
  if (request.currency) {
    const currencyNote = `\n=== CURRENCY CONTEXT ===\nUser's confirmed currency: ${request.currency}. Assume all financial figures are in ${request.currency} unless otherwise specified.\n`;
    combinedContext = currencyNote + combinedContext;
  }

  // 1. Process and upload files if provided
  if (request.uploaded_files && request.uploaded_files.length > 0) {
    console.log("Processing files for immediate context...", request.uploaded_files);

    const { LocalRAG } = await import("./localRAG");

    // Extract file content for immediate use
    const processedFiles = [];

    for (const file of request.uploaded_files) {
      try {
        console.log(`Reading file: ${file.name} (${file.type})`);
        const rawContent = await readFileContent(file);
        
        if (!rawContent || rawContent.startsWith("Error:") || rawContent.includes("Error: Could not")) {
            console.warn(`File read warning for ${file.name}:`, rawContent);
        } else {
            console.log(`Successfully read ${file.name}, content length: ${rawContent.length}`);
        }

        // If CSV, use RAG to filter relevant rows
        let finalContent = rawContent;
        if (file.name.toLowerCase().endsWith('.csv')) {
          console.log(`Applying Local RAG to ${file.name} with query: "${request.query}"`);
          try {
            finalContent = LocalRAG.searchCSV(rawContent, request.query || "", 60); // Get top 60 relevant rows
            console.log(`Local RAG result length: ${finalContent.length}`);
          } catch (ragError) {
            console.error("Local RAG failed, using raw content:", ragError);
            finalContent = rawContent.substring(0, 15000) + "\n...(Truncated due to RAG failure)...";
          }
        } else {
          // For non-CSV, hard limit to prevent crashing
          if (finalContent.length > 20000) {
            console.log(`Truncating large file ${file.name} from ${finalContent.length} to 20000 chars`);
            finalContent = finalContent.substring(0, 20000) + "\n...(Truncated for size)...";
          }
        }

        processedFiles.push({
          name: file.name,
          content: finalContent
        });

      } catch (e) {
        console.error(`CRITICAL Error reading file ${file.name}:`, e);
        processedFiles.push({
            name: file.name,
            content: `Error reading file: ${e.message}`
        });
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
      console.log("Added file content to context, total new length:", combinedContext.length);
    } else {
        console.warn("No file content was extracted to add to context.");
    }
  }

  // 2. Query RAG context from Supabase if needed
  /*
  if (request.use_rag) {
    console.log('Querying RAG context for:', request.query)
    const ragContext = await queryRAGContext(request.query)
    if (ragContext) {
      combinedContext += '\n\n=== Relevant RAG Context ===\n' + ragContext
    }
  }
  */

  // 3. Make the LLM call with combined context
  return await callLLMDirectly({
    ...request,
    context: combinedContext,
  });
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

/**
 * Generate Embedding for text using Gemini API
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateEmbedding(text) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API key not configured for embeddings. Returning null.");
      return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "models/embedding-001",
        content: {
          parts: [{ text: text.substring(0, 2048) }] // Limit text length
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Embedding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null; // Return null on failure so caller can handle gracefully
  }
}

/**
 * Generate Raw Completion (for system use)
 */
export async function generateRawCompletion(messages, model = "llama-3.1-8b-instant") {
  try {
    const apiKey = GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1, // Low temp for extraction tasks
        max_tokens: 4096
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in generateRawCompletion:", error);
    throw error;
  }
}
