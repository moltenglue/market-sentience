/**
 * Gemini AI Integration
 * 
 * Provides RAG (Retrieval-Augmented Generation) capabilities by
 * injecting cached markdown context into Gemini AI prompts.
 * 
 * Uses Google's Gemini API via @google/genai package.
 */

import { GoogleGenAI } from '@google/genai'
import { getAllData } from '../scrapers'

// Model configuration
const MODEL_NAME = 'gemini-2.0-flash-exp'  // Using latest flash model for better performance
const MAX_CONTEXT_LENGTH = 100000  // Maximum characters of context to include

// Lazy initialization of Gemini client
let genAI: GoogleGenAI | null = null

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    genAI = new GoogleGenAI({ apiKey })
  }
  return genAI
}

/**
 * System prompt that instructs Gemini how to use the context
 */
const SYSTEM_PROMPT = `You are an expert financial dashboard assistant. You have access to real-time market data, news, and sentiment analysis that is updated every 15-60 minutes.

Your role is to help users understand financial markets by:
1. Answering questions about current market conditions
2. Explaining trends and patterns in the data
3. Providing context for market movements
4. Summarizing news and sentiment

Use the provided markdown context to answer queries accurately. The context includes:
- Market indices and sector performance (Yahoo Finance)
- Macroeconomic indicators (FRED)
- Prediction markets data (Quotient)
- Financial news headlines (Sherwood News)
- Reddit sentiment analysis (r/wallstreetbets)

Guidelines:
- Always reference specific data points when available
- If data is stale or missing, acknowledge it
- Keep responses concise but informative
- Use markdown formatting for clarity
- If you don't have relevant context, say so honestly

Current context data:`

/**
 * Fetches and compiles all cached markdown data for context
 */
async function buildContext(): Promise<string> {
  try {
    const allData = await getAllData()
    
    // Combine all markdown content
    let context = ''
    
    // Order matters: macro first, then markets, then sentiment
    const orderedSources = [
      'yahoo-finance',
      'fred-macro',
      'quotient-markets',
      'sherwood-news',
      'reddit-wsb'
    ]
    
    for (const source of orderedSources) {
      if (allData[source]) {
        context += `\n\n---\n\n## ${source.toUpperCase().replace(/-/g, ' ')}\n\n${allData[source]}\n`
      }
    }
    
    // Truncate if too long (prioritize recent data)
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = context.substring(0, MAX_CONTEXT_LENGTH) + '\n\n[Context truncated due to length...]'
    }
    
    return context
  } catch (error) {
    console.error('Error building context:', error)
    return '\n\n[Error loading context data]\n'
  }
}

/**
 * Generates a response from Gemini using RAG context
 * @param userMessage - The user's query
 * @returns The AI's response text
 */
export async function generateResponse(userMessage: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return '⚠️ Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.'
  }

  try {
    console.log('Building context for Gemini...')
    const context = await buildContext()
    
    const fullPrompt = `${SYSTEM_PROMPT}\n${context}\n\n---\n\nUser query: ${userMessage}\n\nProvide a helpful response based on the context above.`
    
    console.log('Sending request to Gemini...')
    
    const response = await getGenAI().models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40
      }
    })
    
    const text = response.text
    
    if (!text) {
      return 'Sorry, I was unable to generate a response. Please try again.'
    }
    
    return text
  } catch (error) {
    console.error('Error generating Gemini response:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return '⚠️ Invalid Gemini API key. Please check your configuration.'
      }
      if (error.message.includes('quota')) {
        return '⚠️ Gemini API quota exceeded. Please try again later.'
      }
      return `⚠️ Error: ${error.message}`
    }
    
    return '⚠️ An unexpected error occurred. Please try again.'
  }
}

/**
 * Generates a streaming response from Gemini
 * @param userMessage - The user's query
 * @returns Async generator yielding response chunks
 */
export async function* generateStreamingResponse(userMessage: string): AsyncGenerator<string, void, unknown> {
  if (!process.env.GEMINI_API_KEY) {
    yield '⚠️ Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.'
    return
  }

  try {
    console.log('Building context for Gemini streaming...')
    const context = await buildContext()
    
    const fullPrompt = `${SYSTEM_PROMPT}\n${context}\n\n---\n\nUser query: ${userMessage}\n\nProvide a helpful response based on the context above.`
    
    console.log('Sending streaming request to Gemini...')
    
    const response = await getGenAI().models.generateContentStream({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40
      }
    })
    
    for await (const chunk of response) {
      const text = chunk.text
      if (text) {
        yield text
      }
    }
  } catch (error) {
    console.error('Error in Gemini streaming response:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        yield '⚠️ Invalid Gemini API key. Please check your configuration.'
      } else if (error.message.includes('quota')) {
        yield '⚠️ Gemini API quota exceeded. Please try again later.'
      } else {
        yield `⚠️ Error: ${error.message}`
      }
    } else {
      yield '⚠️ An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Generates a market summary using all available context
 * @returns A summary of current market conditions
 */
export async function generateMarketSummary(): Promise<string> {
  return generateResponse('Provide a comprehensive summary of today\'s market conditions including major indices, macro indicators, prediction markets, and overall sentiment.')
}

/**
 * Gets sentiment analysis from context
 * @returns Sentiment analysis based on Reddit and news data
 */
export async function generateSentimentAnalysis(): Promise<string> {
  return generateResponse('Analyze the current market sentiment based on Reddit r/wallstreetbets and recent news headlines. What are investors focused on?')
}

// Export for testing
export { buildContext, SYSTEM_PROMPT }
