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
import Database from 'better-sqlite3'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'prisma/data/dev.db')
  const sqlite = new Database(dbPath)
  const adapter = new PrismaBetterSqlite3(sqlite, { url: `file:${dbPath}` })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
