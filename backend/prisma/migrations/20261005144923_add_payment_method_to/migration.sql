-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "metodoPagamento" "MetodoPagamento";
