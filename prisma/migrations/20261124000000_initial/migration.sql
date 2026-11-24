CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECHNICIAN', 'APPROVER');
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'APPROVED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Account" (
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("provider", "providerAccountId"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token")
);
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

CREATE TABLE "Certificate" (
  "id" TEXT NOT NULL,
  "certificateNo" TEXT,
  "documentNo" TEXT,
  "projectTitle" TEXT,
  "clientName" TEXT,
  "clientAddress" TEXT,
  "clientPhone" TEXT,
  "clientEmail" TEXT,
  "instrumentDesc" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNo" TEXT,
  "location" TEXT,
  "procedure" TEXT,
  "tagNo" TEXT,
  "condition" TEXT,
  "calibrationDate" DATE,
  "dueDate" DATE,
  "nextCalibrationDate" DATE,
  "calibratedBy" TEXT,
  "certificateDate" DATE,
  "approvedBy" TEXT,
  "approvalSignature" TEXT,
  "approvalDate" DATE,
  "approverName" TEXT,
  "approverTitle" TEXT,
  "asReceived" TEXT,
  "asLeft" TEXT,
  "resultsSummary" TEXT,
  "notes" TEXT,
  "comments" TEXT,
  "sourceRow" INTEGER,
  "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
  "creatorId" TEXT,
  "approverId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Certificate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Certificate_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "Certificate"("certificateNo");
CREATE INDEX "Certificate_clientName_idx" ON "Certificate"("clientName");
CREATE INDEX "Certificate_calibrationDate_idx" ON "Certificate"("calibrationDate");
CREATE INDEX "Certificate_nextCalibrationDate_idx" ON "Certificate"("nextCalibrationDate");
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

CREATE TABLE "TestReading" (
  "id" TEXT NOT NULL,
  "certificateId" TEXT NOT NULL,
  "point" TEXT,
  "appliedValue" TEXT,
  "indicatedValue" TEXT,
  "error" TEXT,
  "tolerance" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestReading_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TestReading_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TestReading_certificateId_sortOrder_idx" ON "TestReading"("certificateId", "sortOrder");

