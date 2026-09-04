/*
  Warnings:

  - You are about to drop the column `currentHubId` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `destinationHubId` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDeliveryAt` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `originHubId` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the `courier_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courier_earnings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hubs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "courier_assignments" DROP CONSTRAINT "courier_assignments_courierId_fkey";

-- DropForeignKey
ALTER TABLE "courier_assignments" DROP CONSTRAINT "courier_assignments_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "courier_earnings" DROP CONSTRAINT "courier_earnings_courierId_fkey";

-- DropForeignKey
ALTER TABLE "courier_earnings" DROP CONSTRAINT "courier_earnings_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "courier_profiles" DROP CONSTRAINT "courier_profiles_currentHubId_fkey";

-- DropForeignKey
ALTER TABLE "shipment_tracking_events" DROP CONSTRAINT "shipment_tracking_events_hubId_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_currentHubId_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_destinationHubId_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_originHubId_fkey";

-- DropIndex
DROP INDEX "shipments_currentHubId_idx";

-- DropIndex
DROP INDEX "shipments_destinationHubId_idx";

-- DropIndex
DROP INDEX "shipments_originHubId_idx";

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "currentHubId",
DROP COLUMN "destinationHubId",
DROP COLUMN "estimatedDeliveryAt",
DROP COLUMN "originHubId";

-- DropTable
DROP TABLE "courier_assignments";

-- DropTable
DROP TABLE "courier_earnings";

-- DropTable
DROP TABLE "hubs";
