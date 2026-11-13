BEGIN;

-- Impede que a aplicação antiga confirme novos pedidos ou ingressos entre a
-- verificação e o backfill. Leituras continuam permitidas durante a migration.
LOCK TABLE "Pedido", "Ingresso" IN SHARE MODE;

-- A migration não escolhe automaticamente qual pedido ativo deve manter uma
-- poltrona. Se os dados atuais violarem a regra, a operação é interrompida
-- antes de qualquer alteração estrutural.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Ingresso" AS ingresso
    INNER JOIN "Pedido" AS pedido ON pedido."id" = ingresso."pedidoId"
    WHERE pedido."status" IN ('ABERTO', 'PAGO')
    GROUP BY ingresso."sessaoId", ingresso."poltronaId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Backfill de OcupacaoPoltrona interrompido: existem poltronas duplicadas entre pedidos ativos.';
  END IF;
END $$;

CREATE TABLE "OcupacaoPoltrona" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "sessaoId" INTEGER NOT NULL,
    "poltronaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcupacaoPoltrona_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OcupacaoPoltrona_sessaoId_poltronaId_key"
ON "OcupacaoPoltrona"("sessaoId", "poltronaId");

CREATE INDEX "OcupacaoPoltrona_pedidoId_idx"
ON "OcupacaoPoltrona"("pedidoId");

ALTER TABLE "OcupacaoPoltrona"
ADD CONSTRAINT "OcupacaoPoltrona_pedidoId_fkey"
FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OcupacaoPoltrona"
ADD CONSTRAINT "OcupacaoPoltrona_sessaoId_fkey"
FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OcupacaoPoltrona"
ADD CONSTRAINT "OcupacaoPoltrona_poltronaId_fkey"
FOREIGN KEY ("poltronaId") REFERENCES "Poltrona"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "OcupacaoPoltrona" ("pedidoId", "sessaoId", "poltronaId")
SELECT ingresso."pedidoId", ingresso."sessaoId", ingresso."poltronaId"
FROM "Ingresso" AS ingresso
INNER JOIN "Pedido" AS pedido ON pedido."id" = ingresso."pedidoId"
WHERE pedido."status" IN ('ABERTO', 'PAGO')
ORDER BY ingresso."sessaoId", ingresso."poltronaId", ingresso."pedidoId";

-- Todo ingresso de pedido ativo deve ter sido representado no backfill, e todo
-- pedido ativo deve conservar ao menos uma ocupação. Qualquer violação causa
-- rollback integral por causa da transação explícita.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Ingresso" AS ingresso
    INNER JOIN "Pedido" AS pedido ON pedido."id" = ingresso."pedidoId"
    LEFT JOIN "OcupacaoPoltrona" AS ocupacao
      ON ocupacao."pedidoId" = ingresso."pedidoId"
      AND ocupacao."sessaoId" = ingresso."sessaoId"
      AND ocupacao."poltronaId" = ingresso."poltronaId"
    WHERE pedido."status" IN ('ABERTO', 'PAGO')
      AND ocupacao."id" IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM "Pedido" AS pedido
    LEFT JOIN "OcupacaoPoltrona" AS ocupacao
      ON ocupacao."pedidoId" = pedido."id"
    WHERE pedido."status" IN ('ABERTO', 'PAGO')
    GROUP BY pedido."id"
    HAVING COUNT(ocupacao."id") = 0
  ) THEN
    RAISE EXCEPTION
      'Backfill de OcupacaoPoltrona interrompido: existem pedidos ativos sem ocupacao correspondente.';
  END IF;
END $$;

COMMIT;
