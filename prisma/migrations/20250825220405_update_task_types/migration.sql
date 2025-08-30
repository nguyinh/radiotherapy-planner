/*
  Warnings:

  - The values [VERIF,VALID,CURIETHERAPY] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('VERIFICATION_DE_DOSSIERS', 'VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ', 'GARDE_APPAREIL', 'CURIETHERAPIE', 'GESTION_CQ_APPAREIL', 'SUPPORT_DOSIMETRIE');
ALTER TABLE "Assignment" ALTER COLUMN "task" TYPE "TaskType_new" USING ("task"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "TaskType_old";
COMMIT;
