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

### Da lista de ideias
| # | Item |
| --- | --- |
| 03 | Caixas de narração (`caption-box`) |
| 05 | Balão de fala nas observações (`balao-fala`) |
| 09 | Grão de papel |
| 10 | Ficha de Poder |
| 14 | Tempo de caçada |
| 15 | Prioridade na wishlist |
| 39 | Temas de universo |
| 40 | Nome da coleção |
| 41 | Densidade do catálogo |

### Parcial — campo existe, falta o uso
| # | Item | O que falta |
| --- | --- | --- |
| 16 | Orçamento mensal | Consumir `Preferencias.orcamentoMensal` no dashboard |
| 21 | Eras da HQ | Gráfico/agrupamento por `Figure.era` |
| 33 | Som ambiente | Tocar o áudio no modo apresentação |

## Pendente

| # | Item |
| --- | --- |
| 01 | Modo Página de HQ |
| 02 | Onomatopeias nas ações |
| 04 | Capa de revista gerada |
| 06 | Cursor manopla |
| 07 | Transição de virada de página |
| 08 | Selo de raridade em relevo |
| 11 | Patente de colecionador |
| 12 | Medalhas |
| 13 | Pódio da coleção |
| 18 | Peça do dia |
| 19 | Preços defasados |
| 20 | Multiverso do personagem |
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

**Sugestão de ordem:** 19, 20 e 13 primeiro — os campos já existem no banco e a
Ficha de Poder já fornece os dados, então são telas novas sem migration.

## Campos já migrados e ainda sem uso

Estes existem no schema e não custam migration para quem for implementar:

- `Figure.rascunho` → item 34
- `Figure.corDominante` → busca por cor (item 25 do documento)
- `Figure.alturaCm` → comparação de escala (item 26)
- `Figure.era` → item 21
- `Grupo.icone` → item 43
- `Preferencias.orcamentoMensal` → item 16
- `Preferencias.somAmbiente` → item 33

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
