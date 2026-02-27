'use client'

/**
 * MacroBar Component
 * 
 * Displays key macroeconomic indicators and market summary at the top of the dashboard.
 */

import { TrendingUp, TrendingDown, Minus, Activity, DollarSign, Percent } from 'lucide-react'

interface MacroIndicator {
  name: string
  value: string
  change: string
  isPositive: boolean | null
  icon: 'trend' | 'dollar' | 'percent' | 'activity'
}

interface MacroBarProps {
  data: string // Markdown content
}

export function MacroBar({ data }: MacroBarProps) {
  // Parse markdown to extract key indicators
  const indicators = parseMacroData(data)

  const getIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5" />
      case 'dollar':
        return <DollarSign className="w-5 h-5" />
      case 'percent':
        return <Percent className="w-5 h-5" />
      case 'activity':
        return <Activity className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const getTrendIcon = (isPositive: boolean | null) => {
    if (isPositive === null) return <Minus className="w-4 h-4 text-gray-500" />
    if (isPositive) return <TrendingUp className="w-4 h-4 text-green-500" />
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Macro Indicators
        </h2>
        <span className="text-xs text-blue-200">Live Market Data</span>
      </div>

      {indicators.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {indicators.map((indicator, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
            >
              <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                {getIcon(indicator.icon)}
                <span>{indicator.name}</span>
              </div>
              <div className="text-xl font-bold">{indicator.value}</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(indicator.isPositive)}
                <span className={indicator.isPositive === null ? 'text-gray-300' : indicator.isPositive ? 'text-green-300' : 'text-red-300'}>
                  {indicator.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-blue-200 text-sm">
          Loading macro data... If this persists, data may not be available.
        </div>
      )}
    </div>
  )
}

/**
 * Parse markdown data to extract key macro indicators
 */
export function parseMacroData(markdown: string): MacroIndicator[] {
  const indicators: MacroIndicator[] = []
  
  if (!markdown) return indicators

  // Extract S&P 500
  const sp500Match = markdown.match(/S&P 500.*?\|([\d,\.]+)\|.*?([\+\-]?[\d\.]+)\s*\|\s*([\+\-]?[\d\.]+)%/)
  if (sp500Match) {
    const change = parseFloat(sp500Match[3])
    indicators.push({
      name: 'S&P 500',
      value: sp500Match[1],
      change: `${sp500Match[2]} (${sp500Match[3]}%)`,
      isPositive: change >= 0,
      icon: 'trend'
    })
  }

  // Extract VIX
  const vixMatch = markdown.match(/VIX.*?\|([\d,\.]+)\|/)
  if (vixMatch) {
    indicators.push({
      name: 'VIX',
      value: vixMatch[1],
      change: 'Volatility Index',
      isPositive: null,
      icon: 'activity'
    })
  }

  // Extract Fed Rate
  const fedRateMatch = markdown.match(/Federal Funds Rate.*?\|([\d\.]+)\s*%?/)
  if (fedRateMatch) {
    indicators.push({
      name: 'Fed Rate',
      value: `${fedRateMatch[1]}%`,
      change: 'Policy Rate',
      isPositive: null,
      icon: 'percent'
    })
  }

  // Extract Unemployment
  const unempMatch = markdown.match(/Unemployment Rate.*?\|([\d\.]+)\s*%?/)
  if (unempMatch) {
    indicators.push({
      name: 'Unemployment',
      value: `${unempMatch[1]}%`,
      change: 'Labor Market',
      isPositive: parseFloat(unempMatch[1]) < 5,
      icon: 'activity'
    })
  }

  // Extract 10Y-2Y Yield
  const yieldMatch = markdown.match(/Yield Curve.*?\|([\-\d\.]+)\s*%?/)
  if (yieldMatch) {
    const yieldVal = parseFloat(yieldMatch[1])
    indicators.push({
      name: 'Yield Curve',
      value: `${yieldMatch[1]}%`,
      change: yieldVal < 0 ? 'Inverted' : 'Normal',
      isPositive: yieldVal >= 0,
      icon: 'percent'
    })
  }

  // Extract Bitcoin
  const btcMatch = markdown.match(/Bitcoin.*?\$?([\d,\.]+)\s*\|/)
  if (btcMatch) {
    indicators.push({
      name: 'Bitcoin',
      value: `$${btcMatch[1]}`,
      change: 'Crypto',
      isPositive: null,
      icon: 'dollar'
    })
  }

  return indicators
}
