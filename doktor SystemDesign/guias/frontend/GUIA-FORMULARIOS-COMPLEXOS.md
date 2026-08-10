# Guia Formularios Complexos

## Quando usar

Use quando o formulario tem multiplos campos com validacao cruzada, campos condicionais (aparecem/somem conforme outra resposta), submissao assincrona com feedback de erro por campo, ou etapas (wizard/multi-step).

## Quando nao usar

Para formulario simples (1-3 campos, sem validacao cruzada) uma abordagem direta com `useState` e validacao inline resolve sem precisar de biblioteca de formulario - nao adicione dependencia sem necessidade real (ver `GUIA_MINIMO_QUALIDADE.md`, item 3).

## Resultado esperado

- Validacao client-side compativel com a validacao server-side (mesma regra, mensagem consistente).
- Erro por campo, nao um erro generico no topo do formulario.
- Estado de loading/submitting que desabilita duplo submit.
- Campos condicionais nao deixam dado invisivel/orfao no payload.
- Formulario acessivel: label associado, foco no primeiro erro, navegacao por teclado.

## 1. Estrutura de estado

Para formularios com mais de ~4 campos ou validacao cruzada, prefira uma biblioteca de formulario (`react-hook-form` e a escolha padrao para stack React + TypeScript) em vez de `useState` por campo.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas nao coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.signup(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email">Email</label>
      <input id="email" {...register("email")} aria-invalid={!!errors.email} />
      {errors.email && <span role="alert">{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Cadastrar"}
      </button>
    </form>
  );
}
```

O schema (`zod`) centraliza a regra de validacao - o mesmo formato de regra pode ser espelhado no backend (`DESIGN_SYSTEM_BACKEND.md`, secao 6.2), reduzindo divergencia entre cliente e servidor.

## 2. Validacao client-side espelha a do servidor

Validacao no cliente e conveniencia de UX, nao seguranca - o servidor sempre revalida (ver `DESIGN_SYSTEM_SEGURANCA.md`). Mas a mensagem e a regra devem ser consistentes, para o usuario nao ver "invalido" no cliente e "valido" no servidor ou vice-versa.

- Regras de formato (email, tamanho minimo, obrigatoriedade) sao faceis de duplicar entre cliente e servidor - documente onde cada regra vive se nao houver schema compartilhado.
- Regras de negocio que dependem de estado do servidor (email ja cadastrado, CPF ja usado) so podem ser validadas no servidor - trate erro de submissao como validacao adicional, exibida no campo certo.

```tsx
const onSubmit = async (data: FormData) => {
  try {
    await api.signup(data);
  } catch (err) {
    if (err.field === "email") {
      setError("email", { message: "Este email ja esta cadastrado" });
    }
  }
};
```

## 3. Campos condicionais

Quando um campo so faz sentido dependendo de outra resposta, esconda o campo e **remova o dado do payload** quando ele nao se aplica - nao deixe dado orfao de um campo que o usuario nao preencheu porque estava escondido.

```tsx
const accountType = watch("accountType");

<select {...register("accountType")}>
  <option value="personal">Pessoal</option>
  <option value="business">Empresa</option>
</select>

{accountType === "business" && (
  <>
    <label htmlFor="cnpj">CNPJ</label>
    <input id="cnpj" {...register("cnpj")} />
  </>
)}
```

```tsx
const onSubmit = (data: FormData) => {
  const payload = data.accountType === "business"
    ? data
    : { ...data, cnpj: undefined };  // remove campo que nao se aplica
  api.submit(payload);
};
```

## 4. Formulario em etapas (wizard)

Para formularios longos, quebre em etapas com estado persistido entre elas (nao perca o que o usuario ja preencheu ao voltar).

```tsx
function useWizard(totalSteps: number) {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  return { step, next, back, isFirst: step === 0, isLast: step === totalSteps - 1 };
}
```

- Valide os campos da etapa atual antes de avancar (`trigger` do `react-hook-form` valida um subconjunto de campos).
- Mostre progresso (ex.: "Etapa 2 de 4") para o usuario saber quanto falta.
- Considere persistir o progresso em `localStorage` se o formulario for longo o suficiente para o usuario querer continuar depois.

## 5. Estado de submissao

```tsx
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Enviando..." : "Confirmar"}
</button>
```

- Desabilite o botao durante o submit para evitar duplo envio.
- Diferencie erro de rede (tentar de novo resolve) de erro de validacao (dado precisa mudar) na mensagem exibida.

## 6. Acessibilidade (baseline obrigatorio)

Ver `DESIGN_SYSTEM_FRONTEND.md` para o baseline completo. Pontos especificos de formulario:

- Todo `input` tem `label` associado via `htmlFor`/`id`, nunca so `placeholder` como identificacao do campo.
- Erro de campo usa `aria-invalid` e `role="alert"` (ou `aria-live`) para leitor de tela anunciar.
- Ao submeter com erro, mova o foco para o primeiro campo invalido.

```tsx
useEffect(() => {
  const firstError = Object.keys(errors)[0];
  if (firstError) {
    document.getElementsByName(firstError)[0]?.focus();
  }
}, [errors]);
```

## 7. Testes

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

test("mostra erro quando email e invalido", async () => {
  render(<SignupForm />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalido" } });
  fireEvent.click(screen.getByText("Cadastrar"));
  expect(await screen.findByText("Email invalido")).toBeInTheDocument();
});

test("desabilita o botao durante o submit", async () => {
  render(<SignupForm />);
  // preenche campos validos...
  fireEvent.click(screen.getByText("Cadastrar"));
  expect(screen.getByRole("button")).toBeDisabled();
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

test("campo condicional some e nao envia dado orfao", () => {
  render(<SignupForm />);
  fireEvent.change(screen.getByLabelText("Tipo de conta"), { target: { value: "personal" } });
  expect(screen.queryByLabelText("CNPJ")).not.toBeInTheDocument();
});
```

## Checklist

- [ ] Biblioteca de formulario usada apenas quando a complexidade justifica (nao para 1-3 campos simples).
- [ ] Validacao client-side espelha a regra do servidor, com mensagem consistente.
- [ ] Erro de submissao do servidor (ex.: "email ja existe") aparece no campo certo, nao generico.
- [ ] Campo condicional escondido nao envia dado orfao no payload.
- [ ] Formulario em etapas valida a etapa atual antes de avancar e mostra progresso.
- [ ] Botao de submit desabilita durante o envio (sem duplo submit).
- [ ] Todo input tem label associado; erro usa `aria-invalid`/`role="alert"`; foco vai para o primeiro erro ao submeter.
- [ ] Testes cobrem validacao de erro, estado de submitting e campo condicional.

## Ideias para quem quiser contribuir

- Template de wizard reutilizavel com progresso e persistencia em localStorage.
- Conjunto de schemas `zod` compartilhaveis entre frontend e backend (quando ambos forem TypeScript/Node).
