/*
 * register() roda uma vez quando uma nova instância do servidor Next
 * inicia, e completa antes do servidor atender qualquer requisição —
 * é o hook oficial para logar o estado de boot. Ver
 * docs/SECURITY.md §4.1 (ameaça A4): confirma explicitamente que o
 * painel está vinculado só a loopback, para ficar óbvio no terminal
 * mesmo que alguém não tenha lido a documentação.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logInfo } = await import("@/server/log");
    logInfo("Escutando apenas em 127.0.0.1 — não acessível pela rede local.");
  }
}
