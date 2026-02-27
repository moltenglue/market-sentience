/**
 * Refresh API Route
 * 
 * POST /api/refresh
 * 
 * Manually triggers data refresh from all sources or a specific source.
 * Also supports automatic refresh of stale data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshData, autoRefreshStale, DataSource } from '@/lib/scrapers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { source = 'all', auto = false } = body

    console.log(`Refresh request: source=${source}, auto=${auto}`)

    let results: Record<string, { success: boolean; error?: string }>

    if (auto) {
      // Automatically refresh only stale data
      results = await autoRefreshStale()
    } else {
      // Manual refresh of specific source or all
      results = await refreshData(source as DataSource)
    }

    // Calculate summary
    const sources = Object.keys(results)
    const successCount = sources.filter(s => results[s].success).length
    const failedCount = sources.length - successCount

    const response = {
      success: failedCount === 0,
      summary: {
        total: sources.length,
        successful: successCount,
        failed: failedCount
      },
      results,
      timestamp: new Date().toISOString()
    }

    const statusCode = failedCount === 0 ? 200 : failedCount === sources.length ? 500 : 207

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Refresh API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/refresh
 * 
 * Returns status of data sources without refreshing
 */
export async function GET() {
  try {
    const { getDataSourcesStatus } = await import('@/lib/scrapers')
    const status = await getDataSourcesStatus()

    return NextResponse.json({
      sources: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get refresh status error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
