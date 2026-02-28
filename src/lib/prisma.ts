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
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./prisma/data/dev.db',
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
