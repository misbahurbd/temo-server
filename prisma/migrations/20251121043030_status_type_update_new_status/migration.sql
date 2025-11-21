-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_assigneeToId_fkey";

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "assigneeToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigneeToId_fkey" FOREIGN KEY ("assigneeToId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
