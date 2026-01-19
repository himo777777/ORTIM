-- CreateEnum
CREATE TYPE "KirkpatrickLevel" AS ENUM ('REACTION', 'LEARNING', 'BEHAVIOR', 'RESULTS');

-- CreateTable
CREATE TABLE "EPA" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT[],
    "criteria" TEXT[],
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EPAAssessment" (
    "id" TEXT NOT NULL,
    "epaId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "entrustmentLevel" INTEGER NOT NULL,
    "comments" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EPAAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OSCEStation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "checklist" TEXT[],
    "criticalErrors" TEXT[],
    "timeLimit" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OSCEStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotAssessment" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "kirkpatrickLevel" "KirkpatrickLevel" NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "responses" JSONB,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EPA_code_key" ON "EPA"("code");

-- CreateIndex
CREATE INDEX "EPA_code_idx" ON "EPA"("code");

-- CreateIndex
CREATE INDEX "EPAAssessment_epaId_idx" ON "EPAAssessment"("epaId");

-- CreateIndex
CREATE INDEX "EPAAssessment_participantId_idx" ON "EPAAssessment"("participantId");

-- CreateIndex
CREATE INDEX "EPAAssessment_assessorId_idx" ON "EPAAssessment"("assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "OSCEStation_code_key" ON "OSCEStation"("code");

-- CreateIndex
CREATE INDEX "OSCEStation_code_idx" ON "OSCEStation"("code");

-- CreateIndex
CREATE INDEX "PilotAssessment_participantId_idx" ON "PilotAssessment"("participantId");

-- CreateIndex
CREATE INDEX "PilotAssessment_kirkpatrickLevel_idx" ON "PilotAssessment"("kirkpatrickLevel");

-- CreateIndex
CREATE INDEX "PilotAssessment_assessmentType_idx" ON "PilotAssessment"("assessmentType");

-- AddForeignKey
ALTER TABLE "EPAAssessment" ADD CONSTRAINT "EPAAssessment_epaId_fkey" FOREIGN KEY ("epaId") REFERENCES "EPA"("id") ON DELETE CASCADE ON UPDATE CASCADE;
