'use client'

/**
 * MacroBar Component
 * 
 * Displays key macroeconomic indicators and market summary at the top of the dashboard.
 */

import { TrendingUp, TrendingDown, Minus, Activity, DollarSign, Percent } from 'lucide-react'
import { parseMacroData } from '@/lib/markdownUtils'

interface MacroBarProps {
  data: string // Markdown content
}

export function MacroBar({ data }: MacroBarProps) {
  const rawIndicators = parseMacroData(data)
  
  const indicators = rawIndicators.map(ind => {
    let icon: 'trend' | 'dollar' | 'percent' | 'activity' = 'activity'
    if (ind.name.includes('S&P') || ind.name.includes('500')) icon = 'trend'
    else if (ind.name.includes('Bitcoin') || ind.name.includes('Crypto')) icon = 'dollar'
    else if (ind.name.includes('Rate') || ind.name.includes('Yield')) icon = 'percent'
    
    return { ...ind, icon }
  })

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
                {getTrendIcon(indicator.isPositive ?? null)}
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

export default MacroBar
