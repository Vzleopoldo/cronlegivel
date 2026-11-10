# CronLegível

Traduz expressões **cron** para português e mostra as **próximas execuções**.

**A dor:** `*/15 9-18 * * 1-5` é difícil de ler. É comum agendar um job no horário
errado e só descobrir em produção. O CronLegível mostra na hora:

> A cada 15 minutos, das 9h00 às 18h59, de segunda a sexta

## Funcionalidades

- Tradução da expressão (5 campos: minuto, hora, dia do mês, mês, dia da semana).
- Suporte a `*`, valores, listas (`1,3,5`), intervalos (`9-18`), passos (`*/15`, `5/20`, `0-30/10`)
  e atalhos (`@daily`, `@hourly`, `@weekly`, `@monthly`, `@yearly`).
- As próximas 5 execuções, no horário local.
- Mensagens de erro que dizem qual campo está errado e por quê.

## Stack

- HTML, CSS e JavaScript, sem framework, com build pelo [Vite](https://vite.dev).
- Testes: [Vitest](https://vitest.dev). Lint: ESLint.
- Node 22 (veja `.nvmrc`).

## Como instalar e rodar

```bash
npm ci          # instala as versões exatas do package-lock.json
npm run dev     # abre em http://localhost:5173
```

## Como rodar os testes

```bash
npm test               # testes unitários
npm run test:coverage  # testes + cobertura (mínimo de 80% de linhas)
npm run lint           # análise estática
npm run build          # gera o site estático em dist/
```

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/cron.js` | núcleo: validação, tradução e próximas execuções (funções puras) |
| `src/cron.test.js` | testes do núcleo |
| `src/main.js` | liga o núcleo à página |
| `index.html`, `src/style.css` | interface |

## Como contribuir

A `main` é protegida: toda mudança entra por Pull Request revisado, com título no padrão
Conventional Commits (ex.: `feat: suporte a nomes de meses`). Use o template de PR.

## Gerência de configuração

O processo do projeto (papéis, ambientes, branching, itens de configuração, CI/CD, baselines e
controle de mudanças) está no [Plano de Gerenciamento de Configuração](docs/plano-gcs.pdf).
