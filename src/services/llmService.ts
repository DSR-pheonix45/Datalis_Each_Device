// LLM API service for direct calls from frontend
const LLM_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface LLMRequest {
  query: string
  context?: string
  web_search?: boolean
}

export interface LLMResponse {
  response: string
  error?: string
}

/**
 * Call LLM API directly from frontend (fallback when edge function fails)
 */
export async function callLLMDirectly(request: LLMRequest): Promise<LLMResponse> {
  try {
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('GROQ_API_KEY not configured in frontend environment')
    }

    console.log('Calling LLM API directly from frontend')

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are Dabby Consultant, a helpful AI assistant. Respond conversationally and helpfully to any question.'
          },
          {
            role: 'user',
            content: request.query + (request.context ? `\n\nContext: ${request.context}` : '') + (request.web_search ? '\n\nInclude relevant information from the web.' : '')
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('LLM API error:', response.status, errorText)
      throw new Error(`LLM API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      console.error('LLM API error in response:', data.error)
      throw new Error(data.error.message)
    }

    const responseText = data.choices?.[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from LLM API')
    }

    return { response: responseText }

  } catch (error) {
    console.error('LLM API call failed:', error)
    return {
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Main function that tries edge function first, then falls back to direct LLM call
 */
export async function callLLMWithFallback(request: LLMRequest): Promise<LLMResponse> {
  // First try the Supabase edge function
  try {
    console.log('Trying Supabase edge function first...')

    const { supabase } = await import('../lib/supabase')

    const { data, error } = await supabase.functions.invoke('chat_query', {
      body: {
        query: request.query,
        workbench_id: null, // No workbench context for now
        web_search: request.web_search || false,
        uploaded_files: []
      }
    })

    if (error) throw error

    if (data?.response) {
      console.log('Edge function succeeded')
      return { response: data.response }
    }

  } catch (error) {
    console.warn('Edge function failed, falling back to direct LLM call:', error)
  }

  // Fallback to direct LLM API call
  console.log('Using direct LLM API call as fallback')
  return callLLMDirectly(request)
}
