-- CreateEnum
CREATE TYPE "GuardType" AS ENUM ('GARDE_MATIN', 'GARDE_SOIR', 'GARDE_IRM_MATIN', 'GARDE_IRM_SOIR');

-- CreateTable
CREATE TABLE "Guard" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guard" "GuardType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guard_date_guard_key" ON "Guard"("date", "guard");

-- CreateIndex
CREATE UNIQUE INDEX "Guard_date_userId_key" ON "Guard"("date", "userId");

-- AddForeignKey
ALTER TABLE "Guard" ADD CONSTRAINT "Guard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
