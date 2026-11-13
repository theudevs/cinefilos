-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill paid orders with the best historical approximation available.
UPDATE "Pedido"
SET "paidAt" = "createdAt"
WHERE "status" = 'PAGO';

-- CreateIndex
CREATE INDEX "Pedido_status_paidAt_idx" ON "Pedido"("status", "paidAt");
