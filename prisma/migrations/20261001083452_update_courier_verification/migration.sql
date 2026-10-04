/*
  Warnings:

  - You are about to drop the column `status` on the `courier_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "courier_profiles" DROP COLUMN "status",
ADD COLUMN     "VerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
