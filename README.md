# Collector's Gauntlet

Aplicação web pessoal e local para controlar uma coleção de action figures
(wishlist, itens comprados, itens na estante). Uso single-user, sem login, sem deploy em nuvem.

> Projeto pessoal de fã, sem afiliação com Marvel, Disney ou qualquer fabricante
> de action figures. Nomes de personagens, marcas e linhas aparecem apenas como
> dados catalogados dentro da coleção do usuário.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- PostgreSQL via Prisma ORM (Neon no deploy)
- Tailwind CSS v4 + Framer Motion
- Recharts (gráficos do dashboard)
- Upload de imagem reencodado com `sharp` (WebP + thumbnail), guardado no banco

## Como rodar

O banco é **PostgreSQL** (local ou Neon). Copie `.env.example` para `.env` e
preencha `DATABASE_URL` e `DIRECT_URL` antes do primeiro comando.

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel + Neon)

Tudo em free tier. As imagens ficam no próprio banco (tabela `Imagem`, servida
por `/api/imagem/[id]`) porque serverless não tem disco persistente — gravar em
`public/uploads` perderia as fotos a cada deploy.

1. **Neon** — crie um projeto e copie as duas connection strings:
   `DATABASE_URL` é a **com pool** (host termina em `-pooler`), usada pela
   aplicação; `DIRECT_URL` é a **sem pool**, usada só pelas migrations.
2. **Migrations** — com as duas variáveis no `.env` local:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed   # opcional: popula listas auxiliares + figuras de exemplo
   ```
3. **Vercel** — importe o repositório e cadastre `DATABASE_URL` e `DIRECT_URL`
   nas Environment Variables. O `postinstall` já roda `prisma generate`.
4. **Dados existentes** — exporte o CSV em `/listas` no ambiente antigo e
   importe no novo. As fotos precisam ser reenviadas pela UI: URLs antigas no
   formato `/uploads/...` são descartadas na importação, já que aqueles arquivos
   não existem mais.

> O free tier da Neon suspende o banco após alguns minutos ocioso, então a
> primeira visita depois de um tempo parado demora alguns segundos. Como todas
> as páginas são `force-dynamic`, isso aparece na navegação.

> **Atenção:** o app não tem autenticação. Publicado, qualquer pessoa com o link
> pode editar e excluir peças. Mantenha o backup CSV em dia.

O comando de seed popula o banco com as listas auxiliares (Marca, Grupo, Escala,
Estilo, Alinhamento, Tipo, Status, Faixa de Preço) e as 30 figuras definidas em
`seed_figures.json`, usando a paleta de cores original.

## Funcionalidades

- **Coleção**: listagem em tabela (ordenável, com filtros combináveis) e em
  catálogo/grid, com busca por texto livre.
- **Nova Figura / Editar Figura** (`/nova`): formulário completo com upload de
  imagem por drag-and-drop e aviso de possível duplicata.
- **Detalhe em modal**: clicar num card/linha abre a peça sobreposta
  (intercepting route), com edição inline, zoom da foto e navegação ← →
  entre as peças da listagem atual.
- **Edição em lote**: selecionar várias peças e trocar o status (ou excluir)
  de uma vez.
- **Lixeira com desfazer**: excluir manda pra lixeira; o toast oferece
  "Desfazer" e a purga definitiva só acontece 24h depois.
- **Backup CSV** (`/listas`): exporta a coleção e reimporta o mesmo formato,
  para edição em massa em planilha.
- **Listas Auxiliares** (`/listas`): CRUD de Marca, Grupo, Conjunto, Escala,
  Estilo, Alinhamento, Tipo, Status e Faixa de Preço, incluindo cor de
  fundo/texto.
- **Dashboard** (`/dashboard`): KPIs e gráficos (pizza por Grupo, barras por
  Marca e por Escala), calculados ao vivo a partir do banco. Os KPIs por status
  seguem as Listas Auxiliares — renomear/criar status pela UI não quebra a tela.

### Atalhos de teclado

| Tecla | Ação |
| --- | --- |
| `/` | foca a busca |
| `n` | abre o cadastro de nova peça |
| `←` `→` | peça anterior / próxima (dentro do modal de detalhe) |
| `Esc` | fecha o zoom da foto ou o modal |

## Rotas

`/` Coleção · `/wishlist` · `/dashboard` · `/listas` · `/nova` (cadastro) ·
`/figuras/[id]` (detalhe, com versão em modal via intercepting route).

> **Atenção:** `/figuras/*` é reservado para ids de peça. A rota interceptadora
> `app/@modal/(.)figuras/[id]` casa com qualquer segmento ali dentro numa
> navegação client-side, então um irmão estático (como o antigo
> `/figuras/nova`) vira `id = "nova"`, não encontra a peça e derruba a página
> em 404 — mesmo com o servidor respondendo 200. Por isso o cadastro mora em
> `/nova`.

## Estrutura

- `prisma/schema.prisma` — modelo de dados (`Figure`, `Marca`, `Grupo`,
  `Conjunto`, `Option`, `Imagem`)
- `prisma/seed.ts` — script de seed
- `lib/actions/` — server actions (CRUD, lote, duplicação, importação CSV)
- `lib/queries.ts` — helpers de filtro/ordenação e o filtro `NOT_DELETED`
- `lib/images.ts` — reencode/thumbnail de upload e persistência na tabela `Imagem`
- `lib/csv.ts` — serialização/parse do CSV de backup
- `components/` — UI (tabela, grid, formulário, badges, filtros, gráficos)
- `app/` — rotas (App Router)

## Fora de escopo (por enquanto)

Login/autenticação, deploy em nuvem/Docker, scraping automático de preço, leitura
de código de barras, histórico de preço, app mobile nativo.
