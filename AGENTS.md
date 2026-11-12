# Projeto Cinéfilos

## Contexto
- Projeto dividido em backend (NestJS, TypeScript, Prisma e PostgreSQL) e frontend (React, Vite).
- Backend e frontend são projetos independentes.
- Execute comandos no diretório correspondente.

## Convenções
- Respeite a arquitetura e os padrões existentes.
- No backend, mantenha a organização por módulos e utilize PrismaService para acesso ao banco.
- No frontend, centralize chamadas HTTP em src/api.
- Reutilize componentes e funcionalidades existentes antes de criar novos.

## Restrições
- Preserve alterações preexistentes do usuário.
- Não modifique arquivos gerados pelo Prisma manualmente.
- Não exponha dados sensíveis ou credenciais.
- Não execute migrações destrutivas, exclua dados ou crie commits sem autorização.
- Não modifique material/ sem solicitação.

## Validação
- Execute testes e verificações relevantes após alterações, quando possível.
- Evite comandos que alterem arquivos automaticamente sem necessidade.
- Informe o que foi alterado, quais verificações foram executadas e eventuais limitações.

## Contexto do projeto
- Consulte o arquivo MEMORY.md antes de implementar
  funcionalidades ou alterar regras de negócio.
- Preserve as decisões documentadas.
- Se uma solicitação contrariar uma decisão existente,
  informe o conflito antes de implementar.
- Não atualize MEMORY.md automaticamente.
  Sugira atualizações quando decisões forem alteradas.