# ADR 0001 — SQLite com Repository e API em camadas

- **Status:** aceita
- **Data:** 11/11/2026
- **Contexto:** Projeto B — simples

## Contexto

O Projeto B exige uma API de domínio único, um fluxo ponta a ponta, execução com Docker Compose, aplicação de SOLID e justificativa de um padrão. A entrega precisa ser simples de executar, testar e explicar, sem introduzir microsserviços ou infraestrutura desproporcional.

O domínio escolhido foi o de pedidos. O fluxo principal é criar um pedido com itens, calcular o total e consultar o pedido posteriormente.

## Decisão

Adotar Node.js 22 + TypeScript + Express, com persistência em SQLite via `better-sqlite3`, organizada em camadas:

- domínio puro com validações e cálculo do total;
- casos de uso na camada de aplicação;
- interface `PedidoRepository` na aplicação;
- implementação `PedidoRepositorySqlite` na infraestrutura;
- rotas HTTP com Zod, Pino e Prometheus.

O padrão escolhido é o **Repository**. Ele separa as regras de negócio do mecanismo de persistência, permite substituir SQLite por outro banco sem alterar os casos de uso e viabiliza testes de integração rápidos com banco em memória.

## Alternativas consideradas

### PostgreSQL + Prisma

Seria mais próximo de um ambiente de produção, mas adicionaria outro container, migrações, ORM e complexidade operacional sem necessidade para um único fluxo simples.

### Arquivo JSON

Seria a opção com menos infraestrutura, porém teria concorrência, transações, consultas e integridade mais frágeis. Também exigiria código próprio para lidar com escrita atômica.

### Banco apenas em memória

Seria suficiente para testes, mas não atenderia à persistência esperada em uma API executada via Docker Compose.

## Consequências

### Positivas

- Um único comando sobe a aplicação com Docker Compose.
- SQLite não exige servidor externo e mantém o projeto simples.
- O padrão Repository permite testar casos de uso e integração com banco em memória.
- A separação em camadas facilita a aplicação de SOLID e a leitura do código.
- O contrato HTTP permanece independente da persistência.

### Negativas

- SQLite não é a melhor escolha para escrita concorrente em alta escala.
- O arquivo do banco precisa estar em um volume para persistir entre reinícios.
- Uma evolução para múltiplas instâncias exigiria migrar para um banco compartilhado.

## Aplicação de SOLID

- **SRP:** domínio valida e calcula; casos de uso orquestram; repositório persiste; rotas traduzem HTTP.
- **OCP:** a interface `PedidoRepository` permite nova implementação sem alterar os casos de uso.
- **LSP:** qualquer implementação de `PedidoRepository` respeita o mesmo contrato.
- **ISP:** a interface do repositório expõe apenas `salvar` e `buscarPorId`.
- **DIP:** casos de uso dependem da abstração, não de SQLite.
