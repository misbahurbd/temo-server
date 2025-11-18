/*
  Warnings:

  - You are about to drop the column `onboardingStatus` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "onboardingStatus",
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "OnboardingStatus";
