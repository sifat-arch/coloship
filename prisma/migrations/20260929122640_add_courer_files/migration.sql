-- AlterTable
ALTER TABLE "courier_profiles" ADD COLUMN     "profileImageId" TEXT,
ADD COLUMN     "resume" TEXT,
ADD COLUMN     "resumePublicId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
