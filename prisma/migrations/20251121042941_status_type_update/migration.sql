/*
  Warnings:

  - You are about to drop the column `activityType` on the `activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "activities" DROP COLUMN "activityType";

-- DropEnum
DROP TYPE "ActivityType";
