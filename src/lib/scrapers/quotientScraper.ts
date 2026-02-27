/**
 * Quotient Markets Scraper
 * 
 * Extracts prediction market data from Quotient Markets API
 * and formats it as markdown for caching.
 * 
 * Source: https://quotient-markets-api.onrender.com/api-portal
 */

import axios from 'axios'
import { setCachedMarkdown } from '../cache/markdownCache'

const QUOTIENT_API_URL = 'https://quotient-markets-api.onrender.com/api/markets'
const SOURCE_NAME = 'quotient-markets'
const DEFAULT_TTL = 30 // minutes

interface QuotientMarket {
  id: string
  question: string
  probability: number
  volume: number
  liquidity: number
  closeTime?: string
  category?: string
}

/**
 * Fetches active prediction markets from Quotient API
 */
async function fetchQuotientMarkets(): Promise<QuotientMarket[]> {
  try {
    const response = await axios.get(QUOTIENT_API_URL, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MarketSentimentDashboard/1.0'
      }
    })

    // Handle different response structures
    const data = response.data
    if (Array.isArray(data)) {
      return data
    } else if (data.markets && Array.isArray(data.markets)) {
      return data.markets
    } else if (data.data && Array.isArray(data.data)) {
      return data.data
    }

    console.warn('Unexpected Quotient API response structure:', Object.keys(data))
    return []
  } catch (error) {
    console.error('Error fetching Quotient markets:', error)
    throw error
  }
}

/**
 * Formats market data as markdown table
 */
function formatMarketsAsMarkdown(markets: QuotientMarket[]): string {
  if (markets.length === 0) {
    return '# Quotient Markets\n\nNo active prediction markets found.\n'
  }

  const timestamp = new Date().toISOString()
  
  let markdown = `# Quotient Prediction Markets\n\n`
  markdown += `*Last updated: ${timestamp}*\n\n`
  markdown += `## Top Active Markets\n\n`
  
  // Create table header
  markdown += `| Market | Probability | Volume | Liquidity | Category |\n`
  markdown += `|--------|-------------|--------|-----------|----------|\n`
  
  // Sort by volume (highest first) and take top 20
  const topMarkets = markets
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 20)
  
  // Add table rows
  for (const market of topMarkets) {
    const probability = market.probability !== undefined 
      ? `${(market.probability * 100).toFixed(1)}%`
      : 'N/A'
    const volume = market.volume !== undefined
      ? `$${market.volume.toLocaleString()}`
      : 'N/A'
    const liquidity = market.liquidity !== undefined
      ? `$${market.liquidity.toLocaleString()}`
      : 'N/A'
    const category = market.category || 'General'
    
    // Escape pipe characters in the question
    const question = market.question.replace(/\|/g, '\\|')
    
    markdown += `| ${question} | ${probability} | ${volume} | ${liquidity} | ${category} |\n`
  }
  
  // Add summary statistics
  const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0)
  const totalLiquidity = markets.reduce((sum, m) => sum + (m.liquidity || 0), 0)
  const avgProbability = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.probability || 0), 0) / markets.length
    : 0
  
  markdown += `\n## Summary Statistics\n\n`
  markdown += `- **Total Markets:** ${markets.length}\n`
  markdown += `- **Total Volume:** $${totalVolume.toLocaleString()}\n`
  markdown += `- **Total Liquidity:** $${totalLiquidity.toLocaleString()}\n`
  markdown += `- **Average Probability:** ${(avgProbability * 100).toFixed(1)}%\n`
  markdown += `- **Data Source:** [Quotient Markets](${QUOTIENT_API_URL})\n`
  
  return markdown
}

/**
 * Main scraper function - fetches and caches Quotient markets data
 */
export async function scrapeQuotientMarkets(): Promise<string> {
  console.log('Scraping Quotient Markets...')
  
  try {
    const markets = await fetchQuotientMarkets()
    const markdown = formatMarketsAsMarkdown(markets)
    
    await setCachedMarkdown(SOURCE_NAME, QUOTIENT_API_URL, markdown, {
      ttlMinutes: DEFAULT_TTL
    })
    
    console.log(`✓ Quotient Markets scraped successfully (${markets.length} markets)`)
    return markdown
  } catch (error) {
    console.error('✗ Failed to scrape Quotient Markets:', error)
    throw error
  }
}

/**
 * Get cached Quotient markets or trigger fresh scrape
 */
export async function getQuotientMarkets(): Promise<string> {
  const { getCachedMarkdown } = await import('../cache/markdownCache')
  const cached = await getCachedMarkdown(SOURCE_NAME)
  
  if (cached) {
    console.log('Returning cached Quotient Markets data')
    return cached.markdownContent
  }
  
  return scrapeQuotientMarkets()
}

// Export for testing
export { fetchQuotientMarkets, formatMarketsAsMarkdown }
