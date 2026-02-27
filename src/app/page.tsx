'use client'

/**
 * Main Dashboard Page
 * 
 * The primary interface for the Market Sentiment Dashboard.
 * Displays macro indicators, prediction markets, news, and AI chat.
 */

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/Header'
import { MacroBar } from '@/components/dashboard/MacroBar'
import { Markets } from '@/components/dashboard/Markets'
import { News } from '@/components/dashboard/News'
import { Chat } from '@/components/chat/Chat'

interface DashboardData {
  yahooFinance: string
  fredMacro: string
  quotientMarkets: string
  sherwoodNews: string
  redditSentiment: string
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    yahooFinance: '',
    fredMacro: '',
    quotientMarkets: '',
    sherwoodNews: '',
    redditSentiment: ''
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  // Auto-refresh stale data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      autoRefreshStale()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const fetchAllData = useCallback(async () => {
    try {
      const response = await fetch('/api/data?source=all')
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const result = await response.json()
      
      setData({
        yahooFinance: result.data['yahoo-finance'] || '',
        fredMacro: result.data['fred-macro'] || '',
        quotientMarkets: result.data['quotient-markets'] || '',
        sherwoodNews: result.data['sherwood-news'] || '',
        redditSentiment: result.data['reddit-wsb'] || ''
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'all' })
      })
      
      if (!response.ok) throw new Error('Failed to refresh data')
      
      const result = await response.json()
      console.log('Refresh results:', result)
      
      // Fetch updated data
      await fetchAllData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, fetchAllData])

  const autoRefreshStale = useCallback(async () => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto: true })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (Object.keys(result.results).length > 0) {
          console.log('Auto-refreshed stale data:', result)
          await fetchAllData()
        }
      }
    } catch (error) {
      console.error('Error auto-refreshing:', error)
    }
  }, [fetchAllData])

  // Combine Yahoo Finance and FRED data for macro bar
  const macroData = `${data.yahooFinance}\n\n${data.fredMacro}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-full mx-auto p-4 lg:p-6">
        {/* Macro Bar - Full Width */}
        <section className="mb-6">
          <MacroBar data={macroData} />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Markets (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Markets data={data.quotientMarkets} />
          </div>

          {/* Center Column - News & Sentiment (5 cols) */}
          <div className="lg:col-span-5">
            <News 
              newsData={data.sherwoodNews}
              redditData={data.redditSentiment}
            />
          </div>

          {/* Right Column - Chat (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 h-[calc(100vh-200px)] min-h-[500px]">
              <Chat sessionId={sessionId} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-full mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Market Sentiment Dashboard • Data refreshed every 15-60 minutes</p>
          <p className="mt-1">
            Data sources: Yahoo Finance, FRED, Quotient Markets, Sherwood News, Reddit
          </p>
          <p className="mt-2 text-xs">
            Not financial advice. For informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}
