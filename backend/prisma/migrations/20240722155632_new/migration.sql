/*
  Warnings:

  - The primary key for the `PerfumeNote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `type` to the `PerfumeNote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('TOP', 'MIDDLE', 'BASE');

-- DropIndex
DROP INDEX "PerfumeNote_perfumeId_noteId_key";

-- AlterTable
ALTER TABLE "PerfumeNote" DROP CONSTRAINT "PerfumeNote_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "type" "NoteType" NOT NULL,
ADD CONSTRAINT "PerfumeNote_pkey" PRIMARY KEY ("id");
