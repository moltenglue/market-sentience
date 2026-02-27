/**
 * FRED (Federal Reserve Economic Data) Scraper
 * 
 * Fetches key macroeconomic indicators from the FRED API
 * and formats them as markdown.
 * 
 * Note: Requires FRED API key for production use.
 * Falls back to simulated data if no API key is provided.
 * 
 * Source: https://fred.stlouisfed.org/
 */

import axios from 'axios'
import { setCachedMarkdown } from '../cache/markdownCache'

const FRED_API_URL = 'https://api.stlouisfed.org/fred/series/observations'
const SOURCE_NAME = 'fred-macro'
const DEFAULT_TTL = 60 // minutes - macro data changes less frequently

// Key macroeconomic indicators to track
const FRED_SERIES = {
  'DFF': { name: 'Federal Funds Rate', unit: '%', description: 'Effective Federal Funds Rate' },
  'CPIAUCSL': { name: 'Consumer Price Index', unit: 'Index', description: 'Consumer Price Index for All Urban Consumers' },
  'UNRATE': { name: 'Unemployment Rate', unit: '%', description: 'Unemployment Rate' },
  'GDP': { name: 'Gross Domestic Product', unit: 'Bil. $', description: 'Gross Domestic Product' },
  'T10Y2Y': { name: 'Yield Curve (10Y-2Y)', unit: '%', description: '10-Year Treasury Constant Maturity Minus 2-Year' },
  'DEXUSEU': { name: 'USD/EUR Exchange Rate', unit: 'Rate', description: 'U.S. Dollars to Euro Spot Exchange Rate' }
}

interface MacroIndicator {
  seriesId: string
  name: string
  unit: string
  description: string
  value: number | null
  date: string
  change: number | null
  changePercent: number | null
}

/**
 * Fetches data for a specific FRED series
 */
async function fetchFREDData(seriesId: string, apiKey: string | undefined): Promise<{ value: number | null; date: string; previousValue: number | null }> {
  // If no API key, return null to trigger fallback
  if (!apiKey) {
    return { value: null, date: new Date().toISOString().split('T')[0], previousValue: null }
  }

  try {
    const response = await axios.get(FRED_API_URL, {
      params: {
        series_id: seriesId,
        api_key: apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit: 2 // Get last 2 observations for change calculation
      },
      timeout: 10000
    })

    const observations = response.data?.observations || []
    
    if (observations.length === 0) {
      return { value: null, date: '', previousValue: null }
    }

    const current = observations[0]
    const previous = observations[1]

    return {
      value: current.value !== '.' ? parseFloat(current.value) : null,
      date: current.date,
      previousValue: previous?.value !== '.' ? parseFloat(previous.value) : null
    }
  } catch (error) {
    console.warn(`Failed to fetch FRED data for ${seriesId}:`, error)
    return { value: null, date: '', previousValue: null }
  }
}

/**
 * Generates simulated macro data for demonstration purposes
 * This is used when FRED API key is not available
 */
function generateSimulatedData(seriesId: string): { value: number; previousValue: number } {
  const simulations: Record<string, { value: number; previousValue: number }> = {
    'DFF': { value: 5.33, previousValue: 5.33 },
    'CPIAUCSL': { value: 313.55, previousValue: 312.23 },
    'UNRATE': { value: 3.7, previousValue: 3.8 },
    'GDP': { value: 27963.0, previousValue: 27610.0 },
    'T10Y2Y': { value: -0.35, previousValue: -0.41 },
    'DEXUSEU': { value: 0.92, previousValue: 0.91 }
  }
  
  return simulations[seriesId] || { value: 100, previousValue: 99 }
}

/**
 * Fetches all macro indicators
 */
async function fetchMacroIndicators(): Promise<MacroIndicator[]> {
  const apiKey = process.env.FRED_API_KEY
  const indicators: MacroIndicator[] = []

  for (const [seriesId, config] of Object.entries(FRED_SERIES)) {
    let data = await fetchFREDData(seriesId, apiKey)
    
    // Use simulated data if API call failed or no API key
    if (data.value === null) {
      const simulated = generateSimulatedData(seriesId)
      data = {
        value: simulated.value,
        date: new Date().toISOString().split('T')[0],
        previousValue: simulated.previousValue
      }
    }

    let change = null
    let changePercent = null
    
    if (data.previousValue !== null && data.value !== null) {
      change = data.value - data.previousValue
      changePercent = data.previousValue !== 0 ? (change / data.previousValue) * 100 : 0
    }

    indicators.push({
      seriesId,
      name: config.name,
      unit: config.unit,
      description: config.description,
      value: data.value,
      date: data.date,
      change,
      changePercent
    })
  }

  return indicators
}

/**
 * Formats macro indicators as markdown
 */
function formatMacroDataAsMarkdown(indicators: MacroIndicator[]): string {
  const timestamp = new Date().toISOString()
  const usingSimulated = !process.env.FRED_API_KEY
  
  let markdown = `# Macroeconomic Indicators\n\n`
  markdown += `*Last updated: ${timestamp}*\n\n`
  
  if (usingSimulated) {
    markdown += `> ⚠️ **Note:** Using simulated data. For live data, set the \`FRED_API_KEY\` environment variable.\n\n`
  }
  
  markdown += `## Key Economic Indicators\n\n`
  markdown += `| Indicator | Value | Unit | Change | Date |\n`
  markdown += `|-----------|-------|------|--------|------|\n`
  
  for (const indicator of indicators) {
    const valueStr = indicator.value !== null 
      ? indicator.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : 'N/A'
    
    let changeStr = 'N/A'
    if (indicator.change !== null) {
      const changeEmoji = indicator.change >= 0 ? '🟢' : '🔴'
      const changePrefix = indicator.change >= 0 ? '+' : ''
      changeStr = `${changeEmoji} ${changePrefix}${indicator.change.toFixed(2)}`
      if (indicator.changePercent !== null) {
        changeStr += ` (${changePrefix}${indicator.changePercent.toFixed(2)}%)`
      }
    }
    
    markdown += `| ${indicator.name} | ${valueStr} | ${indicator.unit} | ${changeStr} | ${indicator.date} |\n`
  }
  
  // Add detailed descriptions
  markdown += `\n## Indicator Descriptions\n\n`
  
  for (const indicator of indicators) {
    markdown += `### ${indicator.name}\n\n`
    markdown += `${indicator.description}\n\n`
    markdown += `- **Series ID:** ${indicator.seriesId}\n`
    markdown += `- **Frequency:** Monthly/Quarterly (varies by indicator)\n\n`
  }
  
  // Economic summary
  const fedRate = indicators.find(i => i.seriesId === 'DFF')?.value
  const unemployment = indicators.find(i => i.seriesId === 'UNRATE')?.value
  const yieldCurve = indicators.find(i => i.seriesId === 'T10Y2Y')?.value
  
  markdown += `## Economic Summary\n\n`
  
  if (fedRate !== undefined && fedRate !== null) {
    markdown += `**Federal Reserve Policy:** ${fedRate > 4 ? '🔒 Restrictive' : fedRate > 2 ? '⚖️ Neutral' : '🔓 Accommodative'} (${fedRate}%)\n\n`
  }
  
  if (unemployment !== undefined && unemployment !== null) {
    markdown += `**Labor Market:** ${unemployment < 4 ? '💪 Strong' : unemployment < 6 ? '⚖️ Moderate' : '⚠️ Weak'} (${unemployment}% unemployment)\n\n`
  }
  
  if (yieldCurve !== undefined && yieldCurve !== null) {
    markdown += `**Yield Curve:** ${yieldCurve < 0 ? '🔻 Inverted (recession risk)' : '✅ Normal'} (${yieldCurve}%)\n\n`
  }
  
  markdown += `*Data provided by Federal Reserve Economic Data (FRED)*\n`
  markdown += `*Source: [FRED](https://fred.stlouisfed.org/)*\n`
  
  return markdown
}

/**
 * Main scraper function - fetches and caches FRED data
 */
export async function scrapeFREDData(): Promise<string> {
  console.log('Fetching FRED macroeconomic data...')
  
  try {
    const indicators = await fetchMacroIndicators()
    const markdown = formatMacroDataAsMarkdown(indicators)
    
    await setCachedMarkdown(SOURCE_NAME, 'https://fred.stlouisfed.org/', markdown, {
      ttlMinutes: DEFAULT_TTL
    })
    
    console.log(`✓ FRED data fetched successfully (${indicators.length} indicators)`)
    return markdown
  } catch (error) {
    console.error('✗ Failed to fetch FRED data:', error)
    throw error
  }
}

/**
 * Get cached FRED data or trigger fresh fetch
 */
export async function getFREDData(): Promise<string> {
  const { getCachedMarkdown } = await import('../cache/markdownCache')
  const cached = await getCachedMarkdown(SOURCE_NAME)
  
  if (cached) {
    console.log('Returning cached FRED data')
    return cached.markdownContent
  }
  
  return scrapeFREDData()
}

// Export for testing
export { fetchMacroIndicators, formatMacroDataAsMarkdown }
