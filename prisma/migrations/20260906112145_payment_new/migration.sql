/*
  Warnings:

  - The values [PENDING,SUCCESS,CANCELLED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `failedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `initiatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReference` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionReference` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bkashTrxId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_shipmentId_fkey";

-- DropIndex
DROP INDEX "payments_invoiceNumber_key";

-- DropIndex
DROP INDEX "payments_transactionId_idx";

-- DropIndex
DROP INDEX "payments_transactionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "failedAt",
DROP COLUMN "initiatedAt",
DROP COLUMN "invoiceNumber",
DROP COLUMN "paymentReference",
DROP COLUMN "transactionId",
DROP COLUMN "transactionReference",
ADD COLUMN     "bkashTrxId" TEXT,
ADD COLUMN     "payerReference" TEXT,
ADD COLUMN     "paymentGateway" TEXT NOT NULL DEFAULT 'bkash',
ADD COLUMN     "refundReason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'UNPAID';

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashTrxId_key" ON "payments"("bkashTrxId");

-- CreateIndex
CREATE INDEX "payments_bkashTrxId_idx" ON "payments"("bkashTrxId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
