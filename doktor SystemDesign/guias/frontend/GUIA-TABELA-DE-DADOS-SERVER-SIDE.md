# Guia Tabela de Dados Server-Side

## Quando usar

Use paginacao, ordenacao e filtro **server-side** quando o volume de dados e grande demais para carregar tudo no cliente (milhares de linhas ou mais), ou quando o dado muda com frequencia e a tabela precisa refletir o estado atual sem recarregar tudo.

## Quando nao usar

Para conjuntos pequenos (poucas centenas de linhas) que cabem confortavelmente em memoria, filtro/ordenacao **client-side** e mais simples e mais responsivo (sem round-trip de rede a cada interacao) - ver `guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md` para o padrao client-side equivalente.

## Resultado esperado

- Paginacao, ordenacao e filtro refletidos na URL (deep-linkable, funciona com voltar/avancar do navegador).
- Requisicao ao servidor debounced em busca textual (nao uma requisicao por tecla digitada).
- Estado de loading que nao pisca a tabela inteira a cada mudanca pequena de pagina/filtro.
- Contrato de API estavel entre paginacao, ordenacao e filtro (ver `DESIGN_SYSTEM_API_REST.md`).

## 1. Contrato de API

Sigra o padrao de paginacao/filtro do `DESIGN_SYSTEM_API_REST.md`. Exemplo de contrato:

```text
GET /api/orders?page=2&page_size=20&sort=-created_at&status=pending&search=joao

Resposta:
{
  "data": [ ... ],
  "meta": {
    "page": 2,
    "page_size": 20,
    "total_pages": 8,
    "total_count": 153
  }
}
```

- `sort=-created_at` (prefixo `-` para descendente) e uma convencao comum e legivel.
- Filtros ficam como query params nomeados, nao um blob JSON codificado na URL.

## 2. Estado sincronizado com a URL

Paginacao/ordenacao/filtro devem estar na URL, nao so em estado React local - assim o usuario pode compartilhar o link, usar voltar/avancar do navegador, e recarregar a pagina sem perder o filtro.

```tsx
import { useSearchParams } from "react-router-dom";

function useTableState() {
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const sort = params.get("sort") ?? "-created_at";
  const search = params.get("search") ?? "";

  const setPage = (p: number) => setParams((prev) => { prev.set("page", String(p)); return prev; });
  const setSort = (s: string) => setParams((prev) => { prev.set("sort", s); prev.set("page", "1"); return prev; });
  const setSearch = (q: string) => setParams((prev) => { prev.set("search", q); prev.set("page", "1"); return prev; });

  return { page, sort, search, setPage, setSort, setSearch };
}
```

Mudar filtro ou ordenacao sempre reseta para a pagina 1 - senao o usuario pode acabar numa pagina que nao existe mais no resultado filtrado.

Guardar o estado na URL (em vez de `localStorage`) e a escolha certa quando o filtro precisa ser compartilhavel por link ou sobreviver a paginacao no servidor. Para uma colecao pequena renderizada inteira no cliente, onde o filtro e so preferencia pessoal do usuario, `guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md` (secao 2) usa `localStorage` em vez disso.

## 3. Busca com debounce

Nao dispare uma requisicao a cada tecla digitada - isso gera trafego desnecessario e pode fazer respostas chegarem fora de ordem.

```tsx
import { useDeferredValue, useEffect, useState } from "react";

function useDebouncedSearch(initial: string, delayMs = 300) {
  const [raw, setRaw] = useState(initial);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(raw), delayMs);
    return () => clearTimeout(timer);
  }, [raw, delayMs]);

  return { raw, setRaw, debounced };
}
```

O componente atualiza o input imediatamente (`raw`, para responsividade visual) mas so dispara a requisicao quando `debounced` mudar.

## 4. Buscar dados com cache/dedupe

Use uma lib de data fetching (`@tanstack/react-query`, `swr`) para lidar com cache, dedupe de requisicoes concorrentes e revalidacao - reescrever isso manualmente e propenso a bugs de race condition (resposta antiga sobrescrevendo a mais recente).

```tsx
import { useQuery, keepPreviousData } from "@tanstack/react-query";

function useOrdersQuery(page: number, sort: string, search: string) {
  return useQuery({
    queryKey: ["orders", page, sort, search],
    queryFn: () => api.getOrders({ page, sort, search }),
    placeholderData: keepPreviousData,  // mantem os dados antigos visiveis durante o carregamento da proxima pagina
  });
}
```

`placeholderData: keepPreviousData` evita a tabela "piscar" vazia a cada troca de pagina - mostra o conteudo anterior com um indicador sutil de loading ate a nova pagina chegar.

## 5. Estrutura da tabela

```tsx
function OrdersTable() {
  const { page, sort, search, setPage, setSort } = useTableState();
  const { data, isLoading, isFetching } = useOrdersQuery(page, sort, search);

  return (
    <div aria-busy={isFetching}>
      <table>
        <thead>
          <tr>
            <SortableHeader field="created_at" currentSort={sort} onSort={setSort}>Data</SortableHeader>
            <SortableHeader field="total" currentSort={sort} onSort={setSort}>Total</SortableHeader>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((order) => (
            <tr key={order.id}>
              <td>{order.created_at}</td>
              <td>{order.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={data?.meta.total_pages ?? 1} onChange={setPage} />
    </div>
  );
}
```

- `aria-busy` no container comunica estado de carregamento a leitores de tela sem bloquear a interacao visual.
- Cabecalho ordenavel alterna asc/desc/nenhum ao clicar, refletindo no `sort` da URL.

## 6. Estados vazio e de erro

```tsx
{isLoading && <TableSkeleton />}
{!isLoading && data?.data.length === 0 && <EmptyState message="Nenhum pedido encontrado" />}
{error && <ErrorState message="Nao foi possivel carregar os pedidos" onRetry={refetch} />}
```

Diferencie "carregando pela primeira vez" (skeleton) de "atualizando pagina/filtro" (indicador sutil, sem esconder o conteudo atual).

## 7. Performance de renderizacao

Para tabelas com muitas colunas ou linhas visiveis simultaneamente (ainda que paginadas), memoize linhas que nao mudam entre renders.

```tsx
const OrderRow = React.memo(function OrderRow({ order }: { order: Order }) {
  return (
    <tr>
      <td>{order.created_at}</td>
      <td>{order.total}</td>
    </tr>
  );
});
```

Para paginacao muito grande por pagina (centenas de linhas visiveis de uma vez, incomum mas possivel), considere virtualizacao (`react-window`, `@tanstack/react-virtual`) - so adicione essa complexidade se o tamanho de pagina realmente justificar.

## 8. Testes

```tsx
test("muda para pagina 2 e atualiza a URL", () => {
  render(<OrdersTable />, { wrapper: RouterWrapper });
  fireEvent.click(screen.getByLabelText("Proxima pagina"));
  expect(screen.getByText(/pagina 2/i)).toBeInTheDocument();
});

test("busca dispara apos debounce, nao a cada tecla", async () => {
  const fetchSpy = jest.spyOn(api, "getOrders");
  render(<OrdersTable />);
  fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "joao" } });
  expect(fetchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ search: "joao" }));
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ search: "joao" })), { timeout: 500 });
});

test("mostra estado vazio quando nao ha resultados", async () => {
  mockApi.getOrders.mockResolvedValue({ data: [], meta: { total_count: 0 } });
  render(<OrdersTable />);
  expect(await screen.findByText("Nenhum pedido encontrado")).toBeInTheDocument();
});
```

## Checklist

- [ ] Paginacao/ordenacao/filtro seguem o contrato de API do `DESIGN_SYSTEM_API_REST.md`.
- [ ] Estado da tabela esta sincronizado com a URL (deep-linkable).
- [ ] Mudar filtro/ordenacao reseta a pagina para 1.
- [ ] Busca textual usa debounce, nao dispara requisicao por tecla.
- [ ] Biblioteca de data fetching trata cache/dedupe/race condition entre paginas.
- [ ] Tabela nao "pisca" vazia ao trocar de pagina (mantem dado anterior com indicador de loading).
- [ ] Estados de loading inicial, vazio e erro sao visualmente distintos.
- [ ] Testes cobrem paginacao, debounce de busca e estado vazio.

## Ideias para quem quiser contribuir

- Componente de tabela server-side generico e reutilizavel (colunas configuraveis via props).
- Guia complementar de exportacao (CSV/XLSX) de resultados filtrados sem carregar tudo no cliente.
