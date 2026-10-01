-- Phase 2E Migration: Remote Website QR Widget Persistence
-- CreateEnum
CREATE TYPE "WidgetStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "Widget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WidgetStatus" NOT NULL DEFAULT 'ACTIVE',
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Widget_publicId_key" ON "Widget"("publicId");

-- CreateIndex
CREATE INDEX "Widget_organizationId_deletedAt_idx" ON "Widget"("organizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "Widget_publicId_idx" ON "Widget"("publicId");

-- CreateIndex
CREATE INDEX "Widget_status_idx" ON "Widget"("status");

-- CreateIndex
CREATE INDEX "Widget_organizationId_createdAt_idx" ON "Widget"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
