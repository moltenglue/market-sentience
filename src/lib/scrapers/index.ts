/**
 * Scraper Orchestrator
 * 
 * Manages all data source scrapers and provides a unified interface
 * for fetching and refreshing market data.
 */

import { scrapeQuotientMarkets, getQuotientMarkets } from './quotientScraper'
import { scrapeSherwoodNews, getSherwoodNews } from './sherwoodScraper'
import { scrapeRedditSentiment, getRedditSentiment } from './redditScraper'
import { scrapeYahooFinance, getYahooFinance } from './yahooFinanceScraper'
import { scrapeFREDData, getFREDData } from './fredScraper'
import { isCacheStale } from '../cache/markdownCache'

export type DataSource = 
  | 'quotient-markets'
  | 'sherwood-news'
  | 'reddit-wsb'
  | 'yahoo-finance'
  | 'fred-macro'
  | 'all'

interface ScraperConfig {
  name: DataSource
  scrape: () => Promise<string>
  get: () => Promise<string>
  enabled: boolean
}

// Registry of all available scrapers
const scrapers: ScraperConfig[] = [
  {
    name: 'yahoo-finance',
    scrape: scrapeYahooFinance,
    get: getYahooFinance,
    enabled: true
  },
  {
    name: 'fred-macro',
    scrape: scrapeFREDData,
    get: getFREDData,
    enabled: true
  },
  {
    name: 'quotient-markets',
    scrape: scrapeQuotientMarkets,
    get: getQuotientMarkets,
    enabled: true
  },
  {
    name: 'sherwood-news',
    scrape: scrapeSherwoodNews,
    get: getSherwoodNews,
    enabled: true
  },
  {
    name: 'reddit-wsb',
    scrape: scrapeRedditSentiment,
    get: getRedditSentiment,
    enabled: true
  }
]

/**
 * Refreshes data for a specific source or all sources
 * @param source - The data source to refresh, or 'all' for all sources
 * @returns Object with results for each source
 */
export async function refreshData(source: DataSource = 'all'): Promise<Record<string, { success: boolean; error?: string }>> {
  const results: Record<string, { success: boolean; error?: string }> = {}
  
  const sourcesToRefresh = source === 'all' 
    ? scrapers.filter(s => s.enabled)
    : scrapers.filter(s => s.name === source && s.enabled)
  
  console.log(`Refreshing ${source === 'all' ? 'all data sources' : source}...`)
  
  for (const scraper of sourcesToRefresh) {
    try {
      await scraper.scrape()
      results[scraper.name] = { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to refresh ${scraper.name}:`, errorMessage)
      results[scraper.name] = { success: false, error: errorMessage }
    }
  }
  
  return results
}

/**
 * Gets data for a specific source (from cache or fresh)
 * @param source - The data source to fetch
 * @returns Markdown content for the source
 */
export async function getData(source: DataSource): Promise<string> {
  if (source === 'all') {
    throw new Error("Use getAllData() instead of getData('all')")
  }
  
  const scraper = scrapers.find(s => s.name === source)
  if (!scraper) {
    throw new Error(`Unknown data source: ${source}`)
  }
  
  if (!scraper.enabled) {
    throw new Error(`Data source ${source} is disabled`)
  }
  
  return scraper.get()
}

/**
 * Gets data from all sources
 * @returns Object with markdown content for each source
 */
export async function getAllData(): Promise<Record<string, string>> {
  const data: Record<string, string> = {}
  
  for (const scraper of scrapers) {
    if (!scraper.enabled) continue
    
    try {
      data[scraper.name] = await scraper.get()
    } catch (error) {
      console.error(`Failed to get data from ${scraper.name}:`, error)
      data[scraper.name] = `# Error\n\nFailed to load data from ${scraper.name}. Please try again later.`
    }
  }
  
  return data
}

/**
 * Checks which data sources need refreshing
 * @returns Array of source names that are stale
 */
export async function checkStaleSources(): Promise<string[]> {
  const staleSources: string[] = []
  
  for (const scraper of scrapers) {
    if (!scraper.enabled) continue
    
    const isStale = await isCacheStale(scraper.name)
    if (isStale) {
      staleSources.push(scraper.name)
    }
  }
  
  return staleSources
}

/**
 * Automatically refreshes stale data sources
 * @returns Results of the refresh operations
 */
export async function autoRefreshStale(): Promise<Record<string, { success: boolean; error?: string }>> {
  const staleSources = await checkStaleSources()
  
  if (staleSources.length === 0) {
    console.log('All data sources are up to date')
    return {}
  }
  
  console.log(`Auto-refreshing stale sources: ${staleSources.join(', ')}`)
  
  const results: Record<string, { success: boolean; error?: string }> = {}
  
  for (const sourceName of staleSources) {
    const scraper = scrapers.find(s => s.name === sourceName)
    if (!scraper) continue
    
    try {
      await scraper.scrape()
      results[sourceName] = { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results[sourceName] = { success: false, error: errorMessage }
    }
  }
  
  return results
}

/**
 * Gets a summary of all data sources and their status
 */
export async function getDataSourcesStatus(): Promise<Array<{
  name: string
  enabled: boolean
  stale: boolean
  lastUpdated?: Date
}>> {
  const { getAllCacheEntries } = await import('../cache/markdownCache')
  const caches = await getAllCacheEntries()
  
  return scrapers.map(scraper => {
    const cache = caches.find(c => c.sourceName === scraper.name)
    return {
      name: scraper.name,
      enabled: scraper.enabled,
      stale: cache ? new Date() > new Date(cache.updatedAt.getTime() + cache.ttlMinutes * 60 * 1000) : true,
      lastUpdated: cache?.updatedAt
    }
  })
}

// Export individual scrapers for direct access
export {
  scrapeQuotientMarkets,
  getQuotientMarkets,
  scrapeSherwoodNews,
  getSherwoodNews,
  scrapeRedditSentiment,
  getRedditSentiment,
  scrapeYahooFinance,
  getYahooFinance,
  scrapeFREDData,
  getFREDData
}
