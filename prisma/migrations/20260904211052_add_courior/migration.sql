/*
  Warnings:

  - You are about to drop the column `hubId` on the `shipment_tracking_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shipment_tracking_events" DROP COLUMN "hubId";

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "courierId" TEXT;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "courier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
