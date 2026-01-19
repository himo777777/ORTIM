-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'PDF');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "epaAllPassed" BOOLEAN,
ADD COLUMN     "epaAverageLevel" DOUBLE PRECISION,
ADD COLUMN     "isRecertification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "osceScore" DOUBLE PRECISION,
ADD COLUMN     "osceStationsPassed" INTEGER,
ADD COLUMN     "previousCertId" TEXT,
ADD COLUMN     "recertificationCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "instructorOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OSCEAssessment" ADD COLUMN     "checklistItems" JSONB,
ADD COLUMN     "criticalErrors" TEXT[],
ADD COLUMN     "hasCriticalError" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CourseExamCriteria" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "quizPassingScore" INTEGER NOT NULL DEFAULT 70,
    "quizRetakeAllowed" INTEGER NOT NULL DEFAULT 2,
    "quizRetakeWaitDays" INTEGER NOT NULL DEFAULT 7,
    "osceMinStationsPassed" INTEGER NOT NULL DEFAULT 6,
    "osceTotalStations" INTEGER NOT NULL DEFAULT 8,
    "osceAllowRetake" BOOLEAN NOT NULL DEFAULT true,
    "osceRetakeWaitDays" INTEGER NOT NULL DEFAULT 14,
    "epaMinEntrustment" INTEGER NOT NULL DEFAULT 3,
    "epaAllRequired" BOOLEAN NOT NULL DEFAULT true,
    "criticalErrorPolicy" TEXT NOT NULL DEFAULT 'AUTO_FAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseExamCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'ORTAC Certifikat',
    "subtitle" TEXT DEFAULT 'Orthopaedic Resuscitation and Trauma Acute Care',
    "description" TEXT,
    "validityYears" INTEGER NOT NULL DEFAULT 3,
    "recertRequired" BOOLEAN NOT NULL DEFAULT true,
    "recertCourseName" TEXT DEFAULT 'ORTAC Uppdateringskurs',
    "recertValidityYears" INTEGER NOT NULL DEFAULT 3,
    "lipusNumber" TEXT,
    "lipusValidUntil" TIMESTAMP(3),
    "logoUrl" TEXT,
    "signatureImageUrl" TEXT,
    "signerName" TEXT DEFAULT 'Kursansvarig',
    "signerTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorGuide" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationNumber" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,
    "reportFrequency" "ReportFrequency" NOT NULL DEFAULT 'MONTHLY',
    "reportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastReportSentAt" TIMESTAMP(3),
    "nextReportDueAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationReportRecipient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationReportRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "r2Key" TEXT NOT NULL,
    "r2Bucket" TEXT NOT NULL DEFAULT 'ortim-media',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "videoProvider" TEXT,
    "videoId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contextUsed" JSONB,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEmbedding" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weakTopics" JSONB NOT NULL,
    "strongTopics" JSONB NOT NULL,
    "preferredTimes" JSONB,
    "averageSession" INTEGER,
    "learningStyle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseExamCriteria_courseId_key" ON "CourseExamCriteria"("courseId");

-- CreateIndex
CREATE INDEX "CourseExamCriteria_courseId_idx" ON "CourseExamCriteria"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_courseId_key" ON "CertificateTemplate"("courseId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_courseId_idx" ON "CertificateTemplate"("courseId");

-- CreateIndex
CREATE INDEX "InstructorGuide_courseId_type_idx" ON "InstructorGuide"("courseId", "type");

-- CreateIndex
CREATE INDEX "InstructorGuide_type_idx" ON "InstructorGuide"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_organizationNumber_key" ON "Organization"("organizationNumber");

-- CreateIndex
CREATE INDEX "Organization_organizationNumber_idx" ON "Organization"("organizationNumber");

-- CreateIndex
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "OrganizationReportRecipient_organizationId_idx" ON "OrganizationReportRecipient"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_r2Key_key" ON "MediaAsset"("r2Key");

-- CreateIndex
CREATE INDEX "MediaAsset_type_idx" ON "MediaAsset"("type");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedById_idx" ON "MediaAsset"("uploadedById");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_userId_idx" ON "ChatConversation"("userId");

-- CreateIndex
CREATE INDEX "ChatConversation_updatedAt_idx" ON "ChatConversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ContentEmbedding_contentType_idx" ON "ContentEmbedding"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEmbedding_contentType_contentId_chunkIndex_key" ON "ContentEmbedding"("contentType", "contentId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningProfile_userId_key" ON "UserLearningProfile"("userId");

-- CreateIndex
CREATE INDEX "UserLearningProfile_userId_idx" ON "UserLearningProfile"("userId");

-- AddForeignKey
ALTER TABLE "CourseExamCriteria" ADD CONSTRAINT "CourseExamCriteria_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationReportRecipient" ADD CONSTRAINT "OrganizationReportRecipient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLearningProfile" ADD CONSTRAINT "UserLearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
