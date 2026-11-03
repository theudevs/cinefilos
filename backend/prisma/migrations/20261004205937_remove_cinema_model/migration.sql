/*
  Warnings:

  - You are about to drop the column `cinemaId` on the `Filme` table. All the data in the column will be lost.
  - You are about to drop the column `cinemaId` on the `Sala` table. All the data in the column will be lost.
  - You are about to drop the column `cinemaId` on the `Sessao` table. All the data in the column will be lost.
  - You are about to drop the `Cinema` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Filme" DROP CONSTRAINT "Filme_cinemaId_fkey";

-- DropForeignKey
ALTER TABLE "Sala" DROP CONSTRAINT "Sala_cinemaId_fkey";

-- DropForeignKey
ALTER TABLE "Sessao" DROP CONSTRAINT "Sessao_cinemaId_fkey";

-- AlterTable
ALTER TABLE "Filme" DROP COLUMN "cinemaId";

-- AlterTable
ALTER TABLE "Sala" DROP COLUMN "cinemaId";

-- AlterTable
ALTER TABLE "Sessao" DROP COLUMN "cinemaId";

-- DropTable
DROP TABLE "Cinema";
