import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import { installMockApi, resetFixtures } from "./mock-api";
import "../index.css";
import "./demo.css";
if (
  import.meta.env.MODE !== "ux-demo" ||
  !["localhost", "127.0.0.1", "[::1]", import.meta.env.VITE_DEMO_HOST].filter(Boolean).includes(location.hostname)
)
  throw new Error("A simulação só pode executar localmente no modo ux-demo.");
installMockApi();
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <details className="ux-demo-bar" open={location.pathname !== "/" || !matchMedia("(max-width: 600px)").matches}>
      <summary><strong>Demonstração · use apenas dados fictícios</strong></summary>
      <nav aria-label="Ambiente de testes">
        <a href="/">Home</a>
        <a href="/agendar/demonstracao">Paciente</a>
        <a href="/agenda">Recepção</a>
        <button onClick={resetFixtures}>Restaurar dados</button>
        <label>
          Cenário
          <select
            aria-label="Cenário simulado"
            defaultValue={sessionStorage.getItem("odonto-ux-scenario") ?? ""}
            onChange={(event) => {
              sessionStorage.setItem("odonto-ux-scenario", event.target.value);
              location.reload();
            }}
          >
            <option value="">Normal</option>
            <option value="empty">Sem horários / consultas</option>
            <option value="error">Erro de serviço</option>
            <option value="conflict">Conflito no envio</option>
          </select>
        </label>
      </nav>
      <small>
        Sem backend. Dados nesta aba até restaurar ou fechar. Sem mensagens ou
        pagamentos.
      </small>
    </details>
    <QueryClientProvider client={client}>
      <Suspense fallback={<p role="status">Carregando demonstração...</p>}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
