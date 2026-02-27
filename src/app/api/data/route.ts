/**
 * Data API Route
 * 
 * GET /api/data?source={source}
 * 
 * Retrieves cached markdown data from a specific source.
 * Does not trigger fresh scraping - use /api/refresh for that.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCachedMarkdown } from '@/lib/cache/markdownCache'
import { getAllData } from '@/lib/scrapers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    if (source === 'all' || !source) {
      // Return all data sources
      const data = await getAllData()
      return NextResponse.json({
        data,
        timestamp: new Date().toISOString()
      })
    }

    // Return specific source
    const cache = await getCachedMarkdown(source)
    
    if (!cache) {
      return NextResponse.json(
        { 
          error: 'Data not found or cache expired',
          source,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      source: cache.sourceName,
      content: cache.markdownContent,
      updatedAt: cache.updatedAt,
      ttlMinutes: cache.ttlMinutes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Data API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
