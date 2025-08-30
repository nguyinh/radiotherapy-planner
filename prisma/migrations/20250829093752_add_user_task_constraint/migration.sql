/*
  Warnings:

  - The values [VERIFICATION_DE_DOSSIERS,VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[date,userId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('VERIFICATION_DE_DOSSIERS_1', 'VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_1', 'VERIFICATION_DE_DOSSIERS_2', 'VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_2', 'GARDE_APPAREIL', 'CURIETHERAPIE', 'GESTION_CQ_APPAREIL', 'SUPPORT_DOSIMETRIE');
ALTER TABLE "Assignment" ALTER COLUMN "task" TYPE "TaskType_new" USING ("task"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "TaskType_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_date_userId_key" ON "Assignment"("date", "userId");
