/*
  Warnings:

  - You are about to drop the column `endAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "endAt",
ADD COLUMN     "endDate" TIMESTAMP(3);
