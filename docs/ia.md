# Uso de IA no projeto

## Declaração

A IA generativa foi usada como apoio durante o desenvolvimento do Projeto B — simples. As sugestões foram revisadas, testadas e ajustadas antes de serem incorporadas ao projeto.

## Onde a IA foi utilizada

- Estruturação inicial do projeto em Node.js + TypeScript.
- Sugestão de organização em camadas e aplicação do padrão Repository.
- Apoio na criação dos testes unitários e de integração.
- Apoio na configuração de Docker Compose, CI, ESLint, Vitest e k6.
- Revisão da documentação, da ADR e do contrato OpenAPI.
- Análise dos resultados do smoke test.

## O que foi validado manualmente

- Regras de domínio e cálculo do total.
- Contrato HTTP e mensagens de erro.
- Execução dos testes e da cobertura.
- Lint, typecheck e build.
- Build e execução com Docker Compose.
- Persistência do pedido após reinício do container.
- Execução do smoke test k6 e leitura dos resultados.

## Prompts relevantes

1. "Estruture uma API de domínio único para pedidos com um fluxo ponta a ponta, usando Node.js e TypeScript, sem microsserviços."
2. "Aplique SOLID e justifique um padrão de projeto adequado ao Projeto B simples."
3. "Crie testes unitários para as regras de domínio e um teste de integração para criar e consultar um pedido."
4. "Configure Docker Compose com healthcheck, volume para SQLite, `.env.example` e CI no GitHub Actions."
5. "Crie um smoke test k6 com threshold p95 abaixo de 200 ms e documente o resultado medido."
6. "Revise o OpenAPI para refletir exatamente as respostas e erros implementados."

## Limites e cuidados

- Nenhum dado sensível, credencial ou segredo foi enviado para ferramentas de IA.
- As decisões de arquitetura foram avaliadas e justificadas na ADR.
- O código foi executado localmente e em Docker antes da entrega.
- A IA não foi usada para substituir a validação dos testes ou a revisão do contrato.

## Ferramenta

Assistente de IA integrado ao ambiente de desenvolvimento, usado em modo colaborativo para geração, revisão e documentação.
