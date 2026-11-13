BEGIN;

DROP INDEX "Pedido_status_paidAt_idx";

ALTER TABLE "Pedido" DROP COLUMN "paidAt";

COMMIT;
