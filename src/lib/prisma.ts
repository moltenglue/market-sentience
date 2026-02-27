/**
 * Prisma Client Singleton
 * 
 * This module provides a singleton instance of the PrismaClient to ensure
 * efficient database connection management across the application.
 * 
 * In development, it prevents multiple instances during hot reloading.
 * In production, it ensures a single connection pool.
 */

import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloading.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we have a database URL
const hasDatabaseUrl = !!process.env.DATABASE_URL

// Create a mock PrismaClient for build time if no database URL is set
const createPrismaClient = () => {
  if (!hasDatabaseUrl) {
    console.warn('DATABASE_URL not set, using mock PrismaClient')
    return new PrismaClient({
      datasources: {
        db: {
          url: 'file:./placeholder.db'
        }
      }
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
