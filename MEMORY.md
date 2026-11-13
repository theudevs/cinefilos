# Memoria do Projeto Cinefilos

## Visao do Produto

- O Cinefilos e uma plataforma para um unico cinema, inspirada no funcionamento de redes como a Cinemark, mas sem suporte atual a filiais, redes, tenants ou multiplos estabelecimentos.
- A plataforma permite administrar filmes, salas, sessoes e produtos, alem de oferecer ao cliente um fluxo de compra de ingressos e produtos.
- O sistema possui dois perfis: cliente (`USER`) e administrador (`ADMIN`).
- O administrador cadastra e gerencia o catalogo e a operacao do cinema. O cliente consulta filmes e sessoes, seleciona poltronas, adiciona produtos e acompanha seus pedidos.

## Arquitetura

- O backend e a fonte central das regras de negocio e dos dados da plataforma.
- O frontend web e um cliente independente que consome a API do backend.
- O aplicativo mobile sera outro cliente independente, criado com React Native e Expo, consumindo a mesma API. Ele pode permanecer no mesmo repositorio em uma pasta propria, sem substituir o frontend web.
- Componentes React web e estilos CSS nao sao diretamente reutilizaveis no React Native. Contratos TypeScript, tipos e funcoes de acesso a API poderao ser compartilhados futuramente, caso isso seja necessario.
- Chamadas HTTP do frontend web ficam centralizadas em `src/api`.
- O backend organiza funcionalidades por modulos e utiliza o `PrismaService` para acesso ao banco.
- A URL da API ainda precisa ser tratada por ambiente. Em um celular, `localhost` aponta para o proprio aparelho, portanto o aplicativo mobile devera usar um endereco acessivel para o backend.

## Autenticacao e Autorizacao

- A autenticacao utiliza JWT.
- Os perfis de acesso sao `USER` e `ADMIN`.
- O cadastro publico cria exclusivamente usuarios com perfil `USER`. Um perfil administrativo nao pode ser escolhido pelo formulario nem aceito como resultado do cadastro publico.
- A criacao e administracao de novos usuarios `ADMIN` foi adiada. Por enquanto, permanece o administrador ja existente.
- A identidade do comprador e obtida pelo token autenticado. Operacoes de pedido nao devem confiar em um `userId` enviado pelo cliente.
- Usuarios comuns podem consultar e operar apenas os proprios pedidos.
- Administradores podem consultar todos os pedidos e filtra-los por filme.
- No frontend web, token e usuario autenticado sao armazenados no `localStorage`. Uma resposta `401` remove esses dados e encerra a sessao local.

## Regras de Negocio

### Salas e poltronas

- Uma sala e cadastrada por uma matriz de linhas e colunas.
- A capacidade da sala e derivada dessa matriz.
- As poltronas sao geradas a partir da matriz e recebem codigos correspondentes a linha e coluna.
- A matriz de uma sala nao deve ser alterada livremente depois de sua criacao, pois sessoes, ingressos e poltronas dependem dessa estrutura.

### Sessoes

- Uma mesma sala nao pode ser utilizada por sessoes com intervalos de horario sobrepostos.
- A verificacao de conflito deve representar o intervalo ocupado pela sessao, e nao apenas comparar horarios iniciais identicos.
- Os valores de ingresso inteiro e meia pertencem a sessao.
- O backend calcula o valor do ingresso conforme o tipo selecionado e os valores registrados na sessao.

### Pedidos e ingressos

- Um pedido pode conter varios ingressos e varios produtos.
- Cada ingresso relaciona uma sessao, uma poltrona e um tipo de ingresso.
- `Ingresso` preserva o historico da compra e nao e responsavel pela unicidade da poltrona ativa.
- `OcupacaoPoltrona` representa a reserva ou venda ativa e possui restricao unica por `sessaoId` e `poltronaId` no banco.
- Pedidos `ABERTO` e `PAGO` mantem suas ocupacoes. Pedidos `CANCELADO` nao mantem ocupacoes, mas seus ingressos historicos permanecem registrados.
- A disponibilidade de poltronas e calculada a partir de `OcupacaoPoltrona`, e nao pela existencia de ingressos historicos.
- A criacao do pedido, das ocupacoes, dos ingressos e dos produtos ocorre em uma unica transacao. Um conflito de ocupacao reverte toda a operacao e retorna HTTP `409`.
- Os status de pedido sao `ABERTO`, `PAGO` e `CANCELADO`.
- Um pedido `ABERTO` reserva suas poltronas.
- Um pedido `PAGO` representa uma compra confirmada.
- Um pedido `CANCELADO` libera suas poltronas.
- As unicas transicoes permitidas sao `ABERTO` para `PAGO` e `ABERTO` para `CANCELADO`.
- As transicoes sao condicionais ao estado `ABERTO`. Se outra operacao vencer a disputa ou o pedido ja estiver em estado terminal, a API retorna HTTP `409` sem sobrescrever o estado existente.
- O pagamento mantem as ocupacoes. O cancelamento altera o status e remove as ocupacoes na mesma transacao.
- Um usuario comum so pode pagar ou cancelar um pedido proprio. O administrador pode operar pedidos de qualquer usuario.
- Administradores respeitam a mesma matriz de transicoes dos usuarios comuns.

### Produtos e valores

- Produtos podem representar alimentos, bebidas e combos.
- Produtos associados a pedidos historicos nao devem ser removidos indiscriminadamente. A desativacao por meio do campo `ativo` e a estrategia adotada para preservar relacionamentos.
- O backend calcula valores usando dados do banco. Totais enviados pelo cliente nao sao considerados fonte confiavel.
- O ingresso registra o valor praticado na compra.
- O item de produto registra valor unitario, quantidade e subtotal.
- O pedido registra o valor total.
- Alteracoes futuras de preco nao devem modificar os valores historicos de pedidos existentes.
- Imagens de filmes e produtos sao armazenadas atualmente como URLs, nao como arquivos binarios no banco.

### Pagamento

- Os metodos registrados atualmente sao `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO` e `DINHEIRO`.
- O pagamento atual e uma simulacao: o sistema registra o metodo escolhido e altera o status do pedido, mas nao possui integracao com gateway, captura financeira ou confirmacao externa.

## Fluxo de Compra

1. O cliente acessa um filme em cartaz.
2. Escolhe o dia desejado.
3. Seleciona uma sessao e seu horario.
4. Seleciona uma ou mais poltronas e o tipo de cada ingresso.
5. Adiciona opcionalmente alimentos, bebidas ou combos.
6. Revisa ingressos, produtos, valores e metodo de pagamento.
7. Finaliza o pedido como pago ou o salva como aberto para finalizar posteriormente.

- O cliente pode avancar e voltar entre ingressos, produtos e resumo sem perder a selecao local.
- O checkout em andamento e mantido no `sessionStorage`.
- Abandonar a pagina nao cria automaticamente um pedido no banco. Para aparecer na listagem como `ABERTO`, o pedido precisa ser salvo explicitamente.
- Pedidos abertos podem ser pagos ou cancelados posteriormente pela listagem de pedidos.

## Persistencia

- O banco utilizado e PostgreSQL, acessado por meio do Prisma.
- O schema Prisma e as migrations representam a estrutura persistida do sistema.
- Arquivos gerados pelo Prisma nao sao editados manualmente.
- Restricoes importantes devem permanecer no banco mesmo quando tambem validadas no service. A unicidade de poltrona por sessao pertence a ocupacao ativa em `OcupacaoPoltrona`, enquanto `Ingresso` preserva o historico.
- Dados sensiveis e credenciais permanecem em arquivos de ambiente que nao devem ser versionados.
- O estado temporario do checkout no navegador nao substitui um pedido persistido no banco.

## Decisoes Futuras

- A criacao e o gerenciamento de novos administradores ainda nao foram definidos.
- Nao foi definida uma integracao real com meios de pagamento.
- Ainda pode ser avaliada uma politica de expiracao ou cancelamento automatico para pedidos abertos, evitando que poltronas fiquem reservadas indefinidamente.
- A estrategia de upload e armazenamento proprio de imagens ainda nao foi definida; atualmente sao utilizadas URLs.
- O compartilhamento de contratos e tipos entre web, mobile e backend pode ser avaliado quando o projeto mobile for iniciado.
- O aplicativo Expo sera criado como projeto separado do frontend web, mas a estrutura final de pastas e eventuais workspaces ainda podem ser ajustados conforme as necessidades da disciplina.
