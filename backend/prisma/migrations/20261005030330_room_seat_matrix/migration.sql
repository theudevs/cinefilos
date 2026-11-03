/*
  Warnings:

  - You are about to drop the column `valorInteira` on the `Ingresso` table. All the data in the column will be lost.
  - You are about to drop the column `valorMeia` on the `Ingresso` table. All the data in the column will be lost.
  - You are about to drop the column `qtInteira` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `qtMeia` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the `LancheCombo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessaoId,poltronaId]` on the table `Ingresso` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numero]` on the table `Sala` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `poltronaId` to the `Ingresso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Ingresso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor` to the `Ingresso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `colunas` to the `Sala` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linhas` to the `Sala` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoIngresso" AS ENUM ('INTEIRA', 'MEIA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('ABERTO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('ALIMENTO', 'BEBIDA', 'COMBO');

-- DropForeignKey
ALTER TABLE "LancheCombo" DROP CONSTRAINT "LancheCombo_pedidoId_fkey";

-- AlterTable
ALTER TABLE "Ingresso" DROP COLUMN "valorInteira",
DROP COLUMN "valorMeia",
ADD COLUMN     "poltronaId" INTEGER NOT NULL,
ADD COLUMN     "tipo" "TipoIngresso" NOT NULL,
ADD COLUMN     "valor" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "qtInteira",
DROP COLUMN "qtMeia",
ADD COLUMN     "status" "StatusPedido" NOT NULL DEFAULT 'ABERTO',
ALTER COLUMN "valorTotal" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Sala" ADD COLUMN     "colunas" INTEGER NOT NULL,
ADD COLUMN     "linhas" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "valorInteira" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "valorMeia" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "LancheCombo";

-- CreateTable
CREATE TABLE "Poltrona" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "salaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poltrona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "valorUnitario" DECIMAL(65,30) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoProduto" (
    "id" SERIAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poltrona_salaId_codigo_key" ON "Poltrona"("salaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Ingresso_sessaoId_poltronaId_key" ON "Ingresso"("sessaoId", "poltronaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sala_numero_key" ON "Sala"("numero");

-- AddForeignKey
ALTER TABLE "Poltrona" ADD CONSTRAINT "Poltrona_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingresso" ADD CONSTRAINT "Ingresso_poltronaId_fkey" FOREIGN KEY ("poltronaId") REFERENCES "Poltrona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoProduto" ADD CONSTRAINT "PedidoProduto_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoProduto" ADD CONSTRAINT "PedidoProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
