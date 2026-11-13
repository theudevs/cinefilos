export const OCUPACAO_POLTRONA_CONFLICT_MESSAGE =
  'Uma ou mais poltronas acabaram de ser reservadas.';

const OCUPACAO_POLTRONA_UNIQUE_CONSTRAINT =
  'OcupacaoPoltrona_sessaoId_poltronaId_key';

type PrismaKnownErrorLike = {
  code?: string;
  meta?: {
    constraint?: unknown;
    driverAdapterError?: {
      cause?: {
        constraint?: {
          fields?: unknown;
          index?: unknown;
        };
      };
    };
    modelName?: unknown;
    target?: unknown;
  };
};

function hasOcupacaoPoltronaFields(fields: unknown) {
  if (!Array.isArray(fields)) {
    return false;
  }

  const normalizedFields = (fields as unknown[]).map((field: unknown) =>
    typeof field === 'string' ? field.replaceAll('"', '') : field,
  );

  return (
    normalizedFields.includes('sessaoId') &&
    normalizedFields.includes('poltronaId')
  );
}

export function isOcupacaoPoltronaUniqueConflict(error: unknown) {
  const prismaError = error as PrismaKnownErrorLike;

  if (prismaError?.code !== 'P2002') {
    return false;
  }

  const { constraint, modelName, target } = prismaError.meta ?? {};
  const adapterConstraint =
    prismaError.meta?.driverAdapterError?.cause?.constraint;

  if (
    constraint === OCUPACAO_POLTRONA_UNIQUE_CONSTRAINT ||
    adapterConstraint?.index === OCUPACAO_POLTRONA_UNIQUE_CONSTRAINT
  ) {
    return true;
  }

  if (
    typeof target === 'string' &&
    target.includes(OCUPACAO_POLTRONA_UNIQUE_CONSTRAINT)
  ) {
    return true;
  }

  const targetMatches = hasOcupacaoPoltronaFields(target);
  const adapterFieldsMatch = hasOcupacaoPoltronaFields(
    adapterConstraint?.fields,
  );

  return (
    (modelName === 'OcupacaoPoltrona' && targetMatches) || adapterFieldsMatch
  );
}
