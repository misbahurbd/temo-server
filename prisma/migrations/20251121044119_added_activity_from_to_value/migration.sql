-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'TASK_UPDATED';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "fromValue" TEXT,
ADD COLUMN     "toValue" TEXT;
