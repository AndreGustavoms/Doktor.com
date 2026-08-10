# Guia - Painel de Colecao com Filtros e Views

## Quando usar

Sempre que houver uma lista grande de itens homogeneos (projetos, produtos, tarefas, artigos, receitas) e o usuario precisar de controle sobre como filtrar, ordenar e visualizar essa lista - sem reinventar a barra de ferramentas, os filtros e a persistencia a cada projeto.

## Quando nao usar

Para listas pequenas (menos de ~20 itens) ou sem necessidade real de filtro/ordenacao - uma lista simples resolve com menos codigo.

## Resultado esperado

Uma tela com busca, filtros combinaveis, ordenacao, multiplos modos de visualizacao (grade / lista / kanban), grade de colunas ajustavel, header fixo e reordenacao por arrastar, tudo persistido no `localStorage`.

---

## Visao geral

O painel e composto por 5 camadas, de baixo para cima:

| Camada | Responsabilidade |
|---|---|
| Modelo do item | O formato minimo que cada card precisa expor (nome, tags, dono, status, etc.). |
| Estado + persistencia | `useState` para view/filtros/ordenacao, salvos e restaurados do `localStorage` com sanitizacao. |
| Derivacao (`useMemo`) | Aplica busca -> filtros -> ordenacao sobre a lista bruta, uma vez por mudanca. |
| Toolbar + painel de filtros | Header fixo com busca, alternador de views, seletor de colunas e o painel de filtros retratil. |
| Renderizacao por view | Grade responsiva (colunas ajustaveis), lista ou kanban - todos consumindo a mesma lista derivada. |

Regra de ouro: uma unica lista derivada (`filteredItems`) alimenta todas as views. Trocar de view nunca refaz a filtragem - so muda o container que desenha os cards.

---

## 1. Modelo do item

O painel nao precisa saber o que o item "e"; ele so le alguns campos para filtrar/ordenar. Defina um contrato minimo e mantenha o resto opaco:

```js
/**
 * Campos que o painel consome. Tudo alem disso e problema do card.
 * @typedef {Object} Item
 * @property {string}   id           - Identificador estavel (usado em selecao/reordenacao).
 * @property {string}   name         - Texto principal; alimenta a busca e a ordenacao A-Z.
 * @property {string}  [description] - Texto secundario; entra na busca.
 * @property {string[]}[tags]        - Rotulos multivalorados (tecnologias, categorias) -> filtro por chips.
 * @property {string}  [owner]       - Autor/criador/responsavel -> filtro por chips.
 * @property {string}  [status]      - Estado do item (ex.: 'in-progress' | 'completed').
 * @property {string}  [complexity]  - Faixa ordinal (ex.: 'simple' | 'medium' | 'complex').
 * @property {string}  [group]       - Coluna no modo kanban.
 * @property {string}  [createdAt]   - Data ISO -> ordenacao por recencia.
 */
```

Dica de portabilidade: renomeie os campos para o seu dominio (`tags` -> `ingredientes`, `owner` -> `autor`, `complexity` -> `dificuldade`). O que importa e manter os tipos (string, string[], data ISO) para que filtros e ordenacao continuem funcionando.

---

## 2. Estado e persistencia

Todo o controle do painel e estado local, com dois pontos salvos no `localStorage`: o modo de visualizacao e o conjunto de filtros. A persistencia e defensiva - nunca confie no que esta gravado.

`localStorage` e adequado aqui porque o filtro e preferencia pessoal do usuario numa colecao renderizada inteira no cliente. Quando o filtro precisa ser compartilhavel por link ou a lista e paginada no servidor, use a URL como fonte de verdade em vez disso - ver `guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md` (secao 2).

### Chaves e defaults

```js
const VIEW_MODE_STORAGE_KEY = 'painelViewMode';
const FILTERS_STORAGE_KEY   = 'painelFilters';

const DEFAULT_VIEW_MODE  = 'grid';
const VALID_VIEW_MODES   = new Set(['grid', 'list', 'kanban']);
const VALID_SORT_OPTIONS = new Set(['createdAt', 'name', 'complexity', 'custom']);

const DEFAULT_FILTERS = {
  searchTerm: '',
  filterComplexity: 'all',
  filterStatus: 'all',
  filterTags: [],
  filterOwners: [],
  filterReadme: 'all',   // exemplo de filtro booleano ('all' | 'with' | 'without')
  sortBy: 'createdAt',
};
```

### Sanitizacao na leitura

O ponto mais importante da persistencia: normalizar os dados lidos para nunca deixar um valor invalido (de uma versao antiga, ou adulterado) contaminar o estado.

```js
const sanitizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const normalizeFilters = (value) => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_FILTERS };
  return {
    searchTerm: typeof value.searchTerm === 'string' ? value.searchTerm : DEFAULT_FILTERS.searchTerm,
    filterComplexity: VALID_COMPLEXITIES.has(value.filterComplexity) ? value.filterComplexity : 'all',
    filterStatus: VALID_STATUSES.has(value.filterStatus) ? value.filterStatus : 'all',
    filterTags: sanitizeArray(value.filterTags),
    filterOwners: sanitizeArray(value.filterOwners),
    filterReadme: VALID_README_FILTERS.has(value.filterReadme) ? value.filterReadme : 'all',
    sortBy: VALID_SORT_OPTIONS.has(value.sortBy) ? value.sortBy : DEFAULT_FILTERS.sortBy,
  };
};

const loadSavedFilters = () => {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    return normalizeFilters(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_FILTERS };
  }
};
```

### Inicializacao e escrita

Carregue os filtros salvos uma unica vez (via `useRef`, para nao reler a cada render) e grave-os num `useEffect` sempre que mudarem:

```js
const initialFiltersRef = useRef(null);
if (!initialFiltersRef.current) initialFiltersRef.current = loadSavedFilters();
const initialFilters = initialFiltersRef.current;

const [viewMode, setViewMode]     = useState(() => {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return VALID_VIEW_MODES.has(saved) ? saved : DEFAULT_VIEW_MODE;
  } catch { return DEFAULT_VIEW_MODE; }
});
const [gridColumns, setGridColumns] = useState(3);
const [searchTerm, setSearchTerm]   = useState(initialFilters.searchTerm);
const [filterTags, setFilterTags]   = useState(initialFilters.filterTags);
const [sortBy, setSortBy]           = useState(initialFilters.sortBy);
const [showFilters, setShowFilters] = useState(false);
// ... demais filtros seguem o mesmo molde ...

// Persiste o modo de visualizacao
useEffect(() => {
  try { localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode); } catch {}
}, [viewMode]);

// Persiste o conjunto de filtros
useEffect(() => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
      searchTerm, filterComplexity, filterStatus, filterTags, filterOwners, filterReadme, sortBy,
    }));
  } catch {}
}, [searchTerm, filterComplexity, filterStatus, filterTags, filterOwners, filterReadme, sortBy]);
```

Por que `useRef` para o valor inicial? Um `useState(loadSavedFilters())` chamaria `loadSavedFilters()` em todo render (o React ignora o retorno, mas o custo de `JSON.parse` fica). O `useRef` garante leitura unica. Alternativa equivalente: `useState(() => loadSavedFilters())` (inicializador preguicoso).

---

## 3. Opcoes disponiveis derivadas dos dados

Tags e autores nao sao hardcoded: sao descobertos a partir dos proprios itens, para o painel se adaptar a qualquer colecao.

```js
const usedTags = useMemo(() => {
  const set = new Set();
  items.forEach(i => Array.isArray(i.tags) && i.tags.forEach(t => set.add(t)));
  return Array.from(set).sort();
}, [items]);

const usedOwners = useMemo(() => {
  const set = new Set();
  items.forEach(i => i.owner && set.add(i.owner));
  return Array.from(set).sort();
}, [items]);
```

Assim os chips de filtro so mostram valores que existem - nunca uma tag orfa.

---

## 4. Header e toolbar

O header e fixo no topo (`sticky top-0 z-50`) e muda de largura conforme a view (kanban ocupa a tela toda; grade/lista ficam centradas num `max-w-7xl`):

```jsx
<header className="bg-dark-surface border-b border-dark-border sticky top-0 inset-x-0 z-50 w-full">
  <div className={viewMode === 'kanban'
    ? 'w-full px-4 sm:px-6 lg:px-8 py-6'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
    <div className="flex flex-col gap-4">
      {/* titulo + acoes a direita */}

      {/* Linha de busca + controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {/* Botao que abre/fecha o painel de filtros */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtros
          </button>

          {/* Seletor de colunas - so faz sentido na grade */}
          {viewMode === 'grid' && (
            <select
              value={gridColumns}
              onChange={(e) => setGridColumns(Number(e.target.value))}
              title="Colunas por linha"
              className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm
                         focus:outline-none focus:border-blue-500"
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} colunas</option>)}
            </select>
          )}

          {/* Alternador de visualizacao */}
          <div className="flex bg-dark-bg border border-dark-border rounded-lg">
            <button onClick={() => setViewMode('grid')}   title="Grade"
              className={`p-2 ${viewMode === 'grid'   ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}>
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('list')}   title="Lista"
              className={`p-2 ${viewMode === 'list'   ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}>
              <List className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('kanban')} title="Kanban"
              className={`p-2 ${viewMode === 'kanban' ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}>
              <Columns className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && <FilterPanel /* ... */ />}
    </div>
  </div>
</header>
```

Icones vem do `lucide-react` (`Search`, `SlidersHorizontal`, `Grid3x3`, `List`, `Columns`, `Tag`, `User`, `X`).

---

## 5. Painel de filtros retratil

Renderizado condicionalmente (`showFilters`) com uma animacao de entrada `animate-slideDown` (ver secao 9). Combina dois tipos de controle:

- `<select>` para filtros de valor unico (ordenacao, complexidade, status, booleanos).
- Chips clicaveis para filtros multivalorados (tags, autores) - cada chip alterna um valor.

```jsx
{showFilters && (
  <div className="flex flex-wrap gap-4 p-4 bg-dark-bg border border-dark-border rounded-lg animate-slideDown">

    {/* Ordenar por */}
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm text-gray-400 mb-2">Ordenar por</label>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
        className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded text-white focus:border-blue-500">
        <option value="createdAt">Data de criacao</option>
        <option value="name">Nome (A-Z)</option>
        <option value="complexity">Complexidade</option>
        <option value="custom">Customizado (arraste para reordenar)</option>
      </select>
      {sortBy === 'custom' && <p className="text-xs text-blue-400 mt-1">Arraste os cards para reordenar</p>}
    </div>

    {/* Filtros de valor unico: mesmo molde para complexidade, status, etc. */}
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm text-gray-400 mb-2">Status</label>
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
        className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded text-white focus:border-blue-500">
        <option value="all">Todos</option>
        <option value="in-progress">Em andamento</option>
        <option value="completed">Finalizados</option>
      </select>
    </div>

    {/* Filtro multivalorado por chips (tags) */}
    {usedTags.length > 0 && (
      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2"><Tag className="w-4 h-4 inline mr-1" /> Filtrar por tag</label>
        <div className="flex flex-wrap gap-2">
          {usedTags.map(tag => (
            <button key={tag} onClick={() => toggleTagFilter(tag)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors
                ${filterTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-surface border border-dark-border text-gray-300 hover:bg-dark-hover'}`}>
              <Tag className="w-3 h-3" /> {tag}
              {filterTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
            </button>
          ))}
        </div>
        {filterTags.length > 0 && (
          <button onClick={() => setFilterTags([])} className="mt-2 text-xs text-gray-400 hover:text-white">
            Limpar filtros de tag
          </button>
        )}
      </div>
    )}
  </div>
)}
```

O toggle de um chip e um `set` imutavel classico:

```js
const toggleTagFilter = (tag) =>
  setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
```

---

## 6. A logica de filtragem e ordenacao

O coracao do painel: um unico `useMemo` que aplica, em ordem, busca -> filtros -> ordenacao. Roda so quando uma dependencia muda; as views apenas consomem o resultado.

```js
const filteredItems = useMemo(() => {
  let out = [...items];

  // 1) Busca (nome + descricao + tags)
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    out = out.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  // 2) Filtros de valor unico
  if (filterComplexity !== 'all') out = out.filter(i => i.complexity === filterComplexity);
  if (filterStatus !== 'all')     out = out.filter(i =>
    filterStatus === 'completed' ? i.isCompleted : !i.isCompleted);

  // 3) Filtros multivalorados - 'every' = E logico (item precisa ter TODAS as tags marcadas)
  if (filterTags.length > 0)   out = out.filter(i =>
    filterTags.every(t => Array.isArray(i.tags) && i.tags.includes(t)));
  if (filterOwners.length > 0) out = out.filter(i => i.owner && filterOwners.includes(i.owner));

  // 4) Ordenacao
  out.sort((a, b) => {
    switch (sortBy) {
      case 'name':       return a.name.localeCompare(b.name);
      case 'createdAt':  return new Date(b.createdAt) - new Date(a.createdAt);
      case 'complexity': {
        const order = { simple: 0, medium: 1, complex: 2, unfeasible: 3 };
        return order[a.complexity] - order[b.complexity];
      }
      case 'custom': {                         // ordem manual salva pelo drag-and-drop
        const ia = customOrder.indexOf(a.id);
        const ib = customOrder.indexOf(b.id);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return 0;
      }
      default: return 0;
    }
  });

  return out;
}, [items, searchTerm, filterComplexity, filterStatus, filterTags, filterOwners, sortBy, customOrder]);
```

Decisoes que valem a pena copiar:

- `every` vs `some` nos filtros multivalorados define a semantica: `every` = "tem todas as tags marcadas" (intersecao, mais restritivo); troque por `some` se quiser "tem qualquer uma" (uniao).
- Ordinal por mapa (`{ simple: 0, ... }`) ordena categorias nao-alfabeticas na ordem certa.
- Ordem `custom` delega a um array de ids (`customOrder`) salvo separadamente - itens fora do array caem no fim, preservando estabilidade.

---

## 7. As tres visualizacoes

Todas partem da mesma `filteredItems`. O que muda e so a classe do container:

```jsx
<div className={
  viewMode === 'grid'
    ? `grid gap-6 ${
        gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
        gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
        gridColumns === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' :
                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
      }`
    : viewMode === 'list'
    ? 'space-y-4'
    : 'flex gap-4 h-[calc(100vh-250px)] px-4 sm:px-6 lg:px-8'  /* kanban: colunas rolaveis */
}>
  {viewMode === 'kanban'
    ? <KanbanBoard groups={groups} items={filteredItems} /* ... */ />
    : filteredItems.map(item => <ItemCard key={item.id} item={item} view={viewMode} />)}
</div>
```

| View | Container | Observacoes |
|---|---|---|
| Grade | `grid` + `grid-cols-*` responsivo | O numero de colunas e explicito por breakpoint - nunca pule de 1 para 6 no mobile. `gridColumns` so sobe o teto nos breakpoints grandes (`xl`, `2xl`). |
| Lista | `space-y-4` | Uma coluna; o card decide render "horizontal" via a prop `view`. |
| Kanban | `flex` horizontal com altura fixa | Colunas por `group`; scroll horizontal. Header vira largura total nessa view. |

Por que classes explicitas e nao `grid-cols-${n}`? O Tailwind faz purge das classes por analise estatica do codigo-fonte. Uma classe interpolada (`grid-cols-${gridColumns}`) nao existe no build final e simplesmente nao aplica. Sempre escreva os nomes completos (ou use `safelist` no `tailwind.config`).

---

## 8. Reordenacao por arrastar (opcional)

O modo de ordenacao `custom` e o kanban usam [`@dnd-kit`](https://dndkit.com/). O essencial:

```jsx
import { DndContext } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// grade/kanban usam rectSortingStrategy; lista usa verticalListSortingStrategy
const strategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;

<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={itemIds} strategy={strategy}>
    {/* cards */}
  </SortableContext>
</DndContext>

function handleDragEnd({ active, over }) {
  if (!over || active.id === over.id) return;
  const next = arrayMove(itemIds, itemIds.indexOf(active.id), itemIds.indexOf(over.id));
  setCustomOrder(next);          // vira a fonte da ordenacao 'custom'
  saveCustomOrder(next);         // persiste (localStorage / backend)
}
```

Ao soltar um card, grave a nova ordem e mude `sortBy` para `'custom'` - o `useMemo` da secao 6 passa a respeitar o array.

---

## 9. Tokens de design e animacoes

Visual dark-first, com 4 tokens de cor no `tailwind.config.js` e algumas animacoes no CSS global.

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { dark: {
    bg:      '#0d1117',  // fundo da pagina
    surface: '#161b22',  // header, paineis, cards
    border:  '#30363d',  // bordas
    hover:   '#21262d',  // estado hover / view ativa
  } } } },
};
```

```css
/* index.css - painel de filtros entra deslizando */
@keyframes slideDown {
  0%   { opacity: 0; transform: translateY(-10px); max-height: 0; }
  100% { opacity: 1; transform: translateY(0);     max-height: 500px; }
}
.animate-slideDown { animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

/* Scrollbar discreto combinando com o tema (util no kanban) */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: #161b22; }
::-webkit-scrollbar-thumb { background: #30363d; border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: #484f58; }
```

| Token / classe | Onde aparece |
|---|---|
| `bg-dark-surface` | Header, painel de filtros, cards |
| `bg-dark-bg` | Fundo da pagina, inputs |
| `border-dark-border` | Todas as bordas |
| `bg-dark-hover text-blue-400` | Botao da view ativa no alternador |
| `.animate-slideDown` | Entrada do painel de filtros |

---

## Como reproduzir (passo a passo)

1. Stack: React + Tailwind CSS. Icones via `lucide-react`. Reordenacao opcional via `@dnd-kit/core` + `@dnd-kit/sortable`.
2. Tokens: adicione o bloco `colors.dark` ao `tailwind.config.js` e as animacoes/scrollbar ao CSS global (secao 9).
3. Modelo: mapeie seu item para o contrato minimo (secao 1) - renomeie os campos, mantenha os tipos.
4. Estado + persistencia: copie as chaves, defaults, `sanitizeArray`/`normalizeFilters`/`loadSavedFilters` e os dois `useEffect` de gravacao (secao 2). Troque os prefixos das storage keys para nao colidir com outros paineis.
5. Opcoes derivadas: gere `usedTags`/`usedOwners` a partir dos dados (secao 3).
6. Toolbar: monte o header fixo com busca, botao de filtros, seletor de colunas e alternador de views (secao 4).
7. Painel de filtros: adicione os `<select>` de valor unico e os chips de tag/autor com `toggle*` (secao 5).
8. Derivacao: implemente o `useMemo` de `filteredItems` (secao 6), ajustando os campos e a semantica `every`/`some`.
9. Views: escreva o container com o mapa de `grid-cols-*` explicito, `space-y-4` e o kanban (secao 7).
10. (Opcional) Ative o drag-and-drop e a ordenacao `custom` (secao 8).

### O que customizar primeiro

| O que | Onde mexer |
|---|---|
| Campos do item | O contrato da secao 1 e os acessos em `filteredItems` |
| Quais filtros existem | Adicione/remova blocos no painel (secao 5) e clausulas no `useMemo` (secao 6) |
| E logico vs OU nas tags | `every` -> `some` na secao 6 |
| Numero de colunas / breakpoints | O mapa `grid-cols-*` na secao 7 |
| Paleta | Os 4 tokens `dark.*` no `tailwind.config.js` |
| Prefixo das storage keys | `VIEW_MODE_STORAGE_KEY` / `FILTERS_STORAGE_KEY` |

---

## Riscos e limites

- Reordenacao com `@dnd-kit` adiciona uma dependencia extra - so inclua se a ordenacao manual for realmente necessaria.
- Persistencia em `localStorage` e por navegador/dispositivo; se o filtro precisar ser compartilhado entre sessoes ou usuarios, mova para o backend.
- Grade com muitas colunas em telas grandes pode prejudicar leitura de cards com muito texto - valide visualmente antes de liberar mais de 4-5 colunas.

## Checklist

- [ ] Uma unica lista derivada (`filteredItems`) alimenta todas as views.
- [ ] Persistencia sanitiza os dados lidos do `localStorage` (nunca confia no valor salvo).
- [ ] Opcoes de filtro (tags, autores) sao descobertas dos dados, nunca hardcoded.
- [ ] Grade usa classes `grid-cols-*` explicitas, nunca interpoladas.
- [ ] Semantica de filtro multivalorado (`every`/`some`) foi escolhida conscientemente.
- [ ] Header fixo funciona em mobile e desktop.

## Ideias para quem quiser contribuir

- Extrair o painel como componente generico reutilizavel (props para campos do modelo, em vez de copiar o arquivo).
- Adicionar suporte a filtros salvos por preset (multiplas combinacoes nomeadas).
- Versao com persistencia no backend para compartilhar filtros entre usuarios/sessoes.
