import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health Check API Route
 * 
 * GET /api/health
 * 
 * Returns the health status of the application.
 * Used by Docker health checks and monitoring systems.
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      checks: {
        database: 'connected',
        api: 'running'
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: 'disconnected',
        api: 'running'
      }
    }, { status: 503 })
  }
}
