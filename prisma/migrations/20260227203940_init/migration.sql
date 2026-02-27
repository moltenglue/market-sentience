-- CreateTable
CREATE TABLE "MarkdownCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "ttlMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DataSourceConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ttlMinutes" INTEGER NOT NULL DEFAULT 30,
    "configJson" TEXT,
    "lastRunAt" DATETIME,
    "lastStatus" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MarkdownCache_sourceName_key" ON "MarkdownCache"("sourceName");

-- CreateIndex
CREATE INDEX "MarkdownCache_sourceName_updatedAt_idx" ON "MarkdownCache"("sourceName", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatHistory_sessionId_createdAt_idx" ON "ChatHistory"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceConfig_sourceName_key" ON "DataSourceConfig"("sourceName");
