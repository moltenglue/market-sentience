'use client'

/**
 * Markets Component
 * 
 * Displays prediction markets data from Quotient.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, BarChart3 } from 'lucide-react'

interface MarketsProps {
  data: string // Markdown content
}

interface Market {
  question: string
  probability: string
  volume: string
  liquidity: string
  category: string
}

export function Markets({ data }: MarketsProps) {
  const [expanded, setExpanded] = useState(false)
  const markets = parseMarketsData(data)

  const displayMarkets = expanded ? markets : markets.slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Prediction Markets
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {markets.length} active markets
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayMarkets.length > 0 ? (
          displayMarkets.map((market, index) => (
            <MarketRow key={index} market={market} />
          ))
        ) : (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            No market data available. Click refresh to load.
          </div>
        )}
      </div>

      {markets.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {markets.length - 5} More
            </>
          )}
        </button>
      )}
    </div>
  )
}

function MarketRow({ market }: { market: Market }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Parse probability for styling
  const probMatch = market.probability.match(/(\d+\.?\d*)%/)
  const probability = probMatch ? parseFloat(probMatch[1]) : 50
  const isHighProbability = probability >= 70
  const isLowProbability = probability <= 30

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {market.question}
            </h3>
            <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {market.category}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-lg font-bold ${
              isHighProbability ? 'text-green-600 dark:text-green-400' :
              isLowProbability ? 'text-red-600 dark:text-red-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {market.probability}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Volume:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {market.volume}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Liquidity:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {market.liquidity}
              </span>
            </div>
            <div className="col-span-2">
              <a 
                href="https://quotient-markets-api.onrender.com/api-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                View on Quotient
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Parse markdown data to extract markets
 */
function parseMarketsData(markdown: string): Market[] {
  const markets: Market[] = []
  
  if (!markdown) return markets

  // Extract table rows from markdown
  const tableMatch = markdown.match(/\| Market \|.*?\n\|[-|]+\n([\s\S]*?)(?=\n\n|$)/)
  if (!tableMatch) return markets

  const rows = tableMatch[1].trim().split('\n')
  
  for (const row of rows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(Boolean)
    if (cells.length >= 4) {
      markets.push({
        question: cells[0].replace(/\\\|/g, '|'),
        probability: cells[1],
        volume: cells[2],
        liquidity: cells[3],
        category: cells[4] || 'General'
      })
    }
  }

  return markets
}
