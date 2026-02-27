/**
 * Yahoo Finance Scraper
 * 
 * Fetches daily market summaries from Yahoo Finance using the
 * yahoo-finance2 library and formats them as markdown.
 */

import yahooFinance from 'yahoo-finance2'
import { setCachedMarkdown } from '../cache/markdownCache'

const SOURCE_NAME = 'yahoo-finance'
const DEFAULT_TTL = 30 // minutes

// Major indices and ETFs to track
const MARKET_SYMBOLS = {
  indices: [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^RUT', name: 'Russell 2000' },
    { symbol: '^VIX', name: 'VIX' }
  ],
  sectors: [
    { symbol: 'XLF', name: 'Financials' },
    { symbol: 'XLK', name: 'Technology' },
    { symbol: 'XLE', name: 'Energy' },
    { symbol: 'XLI', name: 'Industrials' },
    { symbol: 'XLV', name: 'Health Care' },
    { symbol: 'XLP', name: 'Consumer Staples' },
    { symbol: 'XLY', name: 'Consumer Discretionary' },
    { symbol: 'XLB', name: 'Materials' },
    { symbol: 'XLU', name: 'Utilities' },
    { symbol: 'XLRE', name: 'Real Estate' }
  ],
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' }
  ]
}

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
}

/**
 * Fetches quote data for a list of symbols
 */
async function fetchQuotes(symbols: { symbol: string; name: string }[]): Promise<MarketData[]> {
  const results: MarketData[] = []
  
  for (const { symbol, name } of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol)
      
      results.push({
        symbol,
        name,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap
      })
    } catch (error) {
      console.warn(`Failed to fetch ${symbol}:`, error)
      // Continue with other symbols
    }
  }
  
  return results
}

/**
 * Formats market data as markdown tables
 */
function formatMarketDataAsMarkdown(
  indices: MarketData[],
  sectors: MarketData[],
  crypto: MarketData[]
): string {
  const timestamp = new Date().toISOString()
  
  let markdown = `# Market Summary - Yahoo Finance\n\n`
  markdown += `*Last updated: ${timestamp}*\n\n`
  
  // Major Indices
  markdown += `## Major Indices\n\n`
  markdown += `| Index | Price | Change | % Change |\n`
  markdown += `|-------|-------|--------|----------|\n`
  
  for (const item of indices) {
    const changeEmoji = item.change >= 0 ? '🟢' : '🔴'
    const changeStr = item.change >= 0 
      ? `+${item.change.toFixed(2)}`
      : item.change.toFixed(2)
    const percentStr = item.changePercent >= 0
      ? `+${item.changePercent.toFixed(2)}%`
      : `${item.changePercent.toFixed(2)}%`
    
    markdown += `| ${item.name} (${item.symbol}) | ${item.price.toFixed(2)} | ${changeEmoji} ${changeStr} | ${percentStr} |\n`
  }
  
  // Sector Performance
  markdown += `\n## Sector Performance\n\n`
  markdown += `| Sector | Price | Change | % Change |\n`
  markdown += `|--------|-------|--------|----------|\n`
  
  // Sort by performance
  const sortedSectors = [...sectors].sort((a, b) => b.changePercent - a.changePercent)
  
  for (const item of sortedSectors) {
    const changeEmoji = item.change >= 0 ? '🟢' : '🔴'
    const changeStr = item.change >= 0 
      ? `+${item.change.toFixed(2)}`
      : item.change.toFixed(2)
    const percentStr = item.changePercent >= 0
      ? `+${item.changePercent.toFixed(2)}%`
      : `${item.changePercent.toFixed(2)}%`
    
    markdown += `| ${item.name} (${item.symbol}) | ${item.price.toFixed(2)} | ${changeEmoji} ${changeStr} | ${percentStr} |\n`
  }
  
  // Cryptocurrency
  if (crypto.length > 0) {
    markdown += `\n## Cryptocurrency\n\n`
    markdown += `| Asset | Price | Change | % Change |\n`
    markdown += `|-------|-------|--------|----------|\n`
    
    for (const item of crypto) {
      const changeEmoji = item.change >= 0 ? '🟢' : '🔴'
      const changeStr = item.change >= 0 
        ? `+${item.change.toFixed(2)}`
        : item.change.toFixed(2)
      const percentStr = item.changePercent >= 0
        ? `+${item.changePercent.toFixed(2)}%`
        : `${item.changePercent.toFixed(2)}%`
      
      markdown += `| ${item.name} (${item.symbol}) | $${item.price.toLocaleString()} | ${changeEmoji} ${changeStr} | ${percentStr} |\n`
    }
  }
  
  // Market Summary
  const totalChange = indices.reduce((sum, idx) => sum + idx.changePercent, 0) / indices.length
  const marketMood = totalChange > 0.5 ? '🐂 Bullish' : totalChange < -0.5 ? '🐻 Bearish' : '⚖️ Mixed'
  
  markdown += `\n## Market Summary\n\n`
  markdown += `**Overall Market Mood:** ${marketMood}\n\n`
  markdown += `- **Average Index Change:** ${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%\n`
  markdown += `- **Best Performing Sector:** ${sortedSectors[0]?.name} (${sortedSectors[0]?.changePercent.toFixed(2)}%)\n`
  markdown += `- **Worst Performing Sector:** ${sortedSectors[sortedSectors.length - 1]?.name} (${sortedSectors[sortedSectors.length - 1]?.changePercent.toFixed(2)}%)\n\n`
  markdown += `*Data provided by Yahoo Finance*\n`
  
  return markdown
}

/**
 * Main scraper function - fetches and caches Yahoo Finance data
 */
export async function scrapeYahooFinance(): Promise<string> {
  console.log('Fetching Yahoo Finance data...')
  
  try {
    const [indices, sectors, crypto] = await Promise.all([
      fetchQuotes(MARKET_SYMBOLS.indices),
      fetchQuotes(MARKET_SYMBOLS.sectors),
      fetchQuotes(MARKET_SYMBOLS.crypto)
    ])
    
    const markdown = formatMarketDataAsMarkdown(indices, sectors, crypto)
    
    await setCachedMarkdown(SOURCE_NAME, 'yahoo-finance', markdown, {
      ttlMinutes: DEFAULT_TTL
    })
    
    console.log(`✓ Yahoo Finance data fetched successfully`)
    return markdown
  } catch (error) {
    console.error('✗ Failed to fetch Yahoo Finance data:', error)
    throw error
  }
}

/**
 * Get cached Yahoo Finance data or trigger fresh fetch
 */
export async function getYahooFinance(): Promise<string> {
  const { getCachedMarkdown } = await import('../cache/markdownCache')
  const cached = await getCachedMarkdown(SOURCE_NAME)
  
  if (cached) {
    console.log('Returning cached Yahoo Finance data')
    return cached.markdownContent
  }
  
  return scrapeYahooFinance()
}

// Export for testing
export { fetchQuotes, formatMarketDataAsMarkdown }
