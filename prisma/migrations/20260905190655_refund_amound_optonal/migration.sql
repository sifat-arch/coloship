/*
  Warnings:

  - You are about to drop the column `refundTrxiId` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "refundTrxiId",
ADD COLUMN     "refundTrxId" TEXT,
ALTER COLUMN "refundAmount" DROP NOT NULL;
