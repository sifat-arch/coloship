/*
  Warnings:

  - You are about to drop the column `currentHubId` on the `courier_profiles` table. All the data in the column will be lost.
  - Added the required column `CourierId` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "courier_profiles_currentHubId_idx";

-- AlterTable
ALTER TABLE "courier_profiles" DROP COLUMN "currentHubId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'COURIER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "CourierId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "courier_profiles_isApproved_idx" ON "courier_profiles"("isApproved");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_CourierId_fkey" FOREIGN KEY ("CourierId") REFERENCES "courier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
