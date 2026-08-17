# Roadmap

Estado da evolução do Collector's Gauntlet. Este arquivo existe para que uma
nova sessão de trabalho saiba onde a anterior parou, sem depender do histórico
de conversa.

A lista completa de ideias, com descrição de cada uma, está no documento
**Longbox de Ideias**:
<https://claude.ai/code/artifact/d081aadc-4d4f-448b-b085-fe3036487cf0>

Os números abaixo são os IDs desse documento.

## Concluído

### Base do produto
- Correção do 404 intermitente na rota de cadastro (ver comentário em
  `app/@modal/(.)figuras/[id]/page.tsx` — `/figuras/*` é namespace exclusivo de IDs).
- KPIs do dashboard derivados das Listas Auxiliares, sem nomes de status fixos.
- Navegação com setas no modal, edição em lote, duplicar peça, backup CSV,
  lixeira com desfazer, atalhos de teclado, lightbox, detecção de duplicata.
- Migração de SQLite para PostgreSQL (Neon) e deploy na Vercel.
- Imagens no banco (tabela `Imagem`), servidas por `/api/imagem/[id]`.
- Navegação mobile (navbar inferior, filtros roláveis, faixa de marca no topo).
- Metas de coleção por Grupo e Conjunto.
- Vitrine pública (`/vitrine`) com modo apresentação, e PWA.
- Telas derivadas do acervo: `/podio`, `/precos` e `/personagens`.

### Da lista de ideias
| # | Item |
| --- | --- |
| 03 | Caixas de narração (`caption-box`) |
| 05 | Balão de fala nas observações (`balao-fala`) |
| 09 | Grão de papel |
| 10 | Ficha de Poder |
| 13 | Pódio da coleção (`/podio`) |
| 14 | Tempo de caçada |
| 15 | Prioridade na wishlist |
| 16 | Orçamento mensal (painel no dashboard) |
| 19 | Preços defasados (`/precos`, com fila de revisão) |
| 20 | Multiverso do personagem (`/personagens` + faixa na ficha) |
| 21 | Eras da HQ (gráfico no dashboard) |
| 33 | Som ambiente (clique sintetizado na apresentação) |
| 39 | Temas de universo |
| 40 | Nome da coleção |
| 41 | Densidade do catálogo |

Os cálculos de 13, 16, 19, 20 e 21 vivem em `lib/insights.ts` — leituras
derivadas, sem escrita, todas respeitando `NOT_DELETED` e `WISHLIST_STATUSES`.

## Descartado por decisão do usuário

| # | Item | Motivo |
| --- | --- | --- |
| 07 | Transição de virada de página | O retângulo atravessando a tela a cada
navegação incomodou mais do que somou. Removido inteiro (componente e keyframe);
não reintroduzir sem pedido explícito. |

## Pendente

| # | Item |
| --- | --- |
| 01 | Modo Página de HQ |
| 02 | Onomatopeias nas ações |
| 04 | Capa de revista gerada |
| 06 | Cursor manopla |
| 08 | Selo de raridade em relevo |
| 11 | Patente de colecionador |
| 12 | Medalhas |
| 18 | Peça do dia |
| 22 | Mapa de calor do acervo |
| 23 | Buracos na coleção |
| 28 | Cartão colecionável |
| 29 | Livro de visitas |
| 30 | Curadoria por link |
| 31 | Visita guiada |
| 32 | QR na caixa |
| 34 | Cadastro relâmpago |
| 35 | Cadastro por foto |
| 42 | Ordem manual dos grupos |
| 43 | Ícone por grupo |
| 44 | O estalo |

**Sugestão de ordem:** 12 (Medalhas) e 11 (Patente) — a Ficha de Poder, as metas
e o tempo de caçada já dão todos os critérios, então é regra em cima de dado que
já existe. Depois 34 e 43, que só esperam o campo migrado virar UI.

## Campos já migrados e ainda sem uso

Estes existem no schema e não custam migration para quem for implementar:

- `Figure.rascunho` → item 34
- `Figure.corDominante` → busca por cor (item 25 do documento)
- `Figure.alturaCm` → comparação de escala (item 26)
- `Grupo.icone` → item 43

## Onde as telas novas moram

`/podio`, `/precos` e `/personagens` **não estão na sidebar** — a navbar do
mobile já tem 5 itens e não comporta mais. Chega-se nelas pelos atalhos no topo
do dashboard e pela paleta de comandos (⌘K). Não remova os atalhos sem dar outro
caminho: hoje são a única porta de entrada.

## Armadilhas conhecidas

- **React 19 é estrito.** O lint barra `setState` dentro de efeito e chamada de
  função impura (`Math.random`) durante o render. Derive no render ou gere valor
  determinístico — ver `components/Confetti.tsx`.
- **`ViewTransition` do React não está disponível.** O projeto usa React estável,
  que não exporta esse componente; importar do `react-experimental` do Next criaria
  uma segunda cópia do React. Para morph de elemento, usar `layoutId` do
  framer-motion — ver `components/Vitrine.tsx`.
- **`overflow-x` recorta filhos posicionados.** Por isso o menu de filtro no mobile
  é um bottom sheet em portal, e não um dropdown absoluto.
- **Não hardcode nomes de status.** A separação Coleção/Wishlist é dinâmica; use
  `WISHLIST_STATUSES` e `getCollectionStatuses()`.
- **O seed não recria figuras** com o banco populado (proteção contra apagar a
  coleção). Use `SEED_RESET=1` para forçar.
- **Todo export de um módulo `"use client"` vira referência de cliente.** Não dá
  pra chamar do servidor nem uma função pura que more nele. Por isso os helpers
  da Ficha de Poder saíram de `components/FichaPoder.tsx` para `lib/ficha.ts`: o
  pódio ranqueia por `mediaFicha()` durante o render de servidor. Regra: helper
  usado dos dois lados nasce em `lib/`, nunca no componente.
- **Rota nova que lê figuras precisa entrar em `revalidateFigures()`** (em
  `lib/actions/figures.ts`). Sem isso a tela congela depois de qualquer edição —
  e o sintoma (dado velho só numa tela) não aponta pra causa.
- **Dois `next dev` no mesmo diretório não coexistem.** O Next 16 recusa o
  segundo com *"Another next dev server is already running"*, mesmo em outra
  porta, porque o `.next` é compartilhado. Com duas sessões de trabalho no mesmo
  repo, só uma sobe servidor — a outra verifica com `npm run build`.
- **Plural em pt-BR não sai de sufixo.** `versão`/`versões` troca o miolo da
  palavra; concatenar sufixo gera "versãoões". Escreva as duas formas inteiras.
