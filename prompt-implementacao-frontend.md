# Prompt de Implementação — Frontend (Sistema de Gestão de Clínicas Odontológicas)

Cole no Cursor. O backend já está implementado (Spring Boot + PostgreSQL, multi-tenant, JWT com refresh via cookie httpOnly). Este prompt cobre só o frontend, também dividido em fases — execute e revise uma por vez.

---

## Contexto do projeto

React + Vite, consumindo a API REST do backend já pronto. O design visual de referência está em `clinica-design.jsx` (anexo) — use os tokens de cor, tipografia e os componentes de lá (`Sidebar`, `PageHeader`, `StatusBadge`, `PrimaryButton`) como base real dos componentes, não como mockup descartável.

**Stack:**
- React 18 + Vite
- Roteamento: React Router
- Estado de servidor: TanStack Query (React Query) — não Redux para dados de API, evita boilerplate de cache manual
- Estado de formulário: React Hook Form + Zod para validação (espelhando as regras do backend)
- HTTP client: Axios com interceptors centralizados
- Estilo: manter a abordagem de tokens/inline styles do `clinica-design.jsx`, ou migrar para CSS Modules/Tailwind com os mesmos tokens — decida e seja consistente no projeto inteiro
- Ícones: lucide-react (já usado no design de referência)

**Convenções gerais:**
- Estrutura de pastas por feature (`features/agenda`, `features/patients`, `features/conversations`, `features/billing`, `features/auth`), não por tipo de arquivo genérico espalhado.
- Todo componente que busca dado usa um hook próprio (`usePatients`, `useAppointments`) que encapsula a chamada React Query — componente de UI não conhece Axios diretamente.
- Nenhum `fetch`/`axios` direto dentro de componente — sempre via camada de `api/` + hook.

---

## Fase 1 — Fundação: autenticação, roteamento e camada de API

### 1.1 Cliente HTTP e autenticação

- Instância única do Axios com `baseURL` da API, `withCredentials: true` (necessário pro cookie httpOnly de refresh token ser enviado).
- **Access token em memória** — guardado em um `AuthContext`/store (Zustand é uma boa opção leve), nunca em `localStorage` ou `sessionStorage`. Ao dar F5 na página, o token some da memória; nesse caso, o app deve tentar um refresh silencioso (`POST /api/auth/refresh`, que usa o cookie httpOnly) antes de decidir se o usuário está deslogado.
- Interceptor de request: injeta `Authorization: Bearer {accessToken}` em toda chamada, exceto nos endpoints públicos (`/auth/login`, `/auth/register`, `/auth/confirm-email`).
- Interceptor de response:
  - `401` → tenta `POST /api/auth/refresh` uma única vez (evite loop infinito com uma flag de controle) → se conseguir, repete a request original com o novo token → se falhar, limpa o estado de auth e redireciona pro login.
  - `403` → não desloga; mostra mensagem de "você não tem permissão para isso" (o usuário está autenticado, só não pode fazer aquela ação — não confundir com 401).
  - `5xx` → mensagem genérica de erro com opção de tentar novamente; nunca exibir stacktrace ou payload cru do erro pro usuário.

### 1.2 Roteamento e proteção de rotas

- Rotas públicas: `/login`, `/cadastro`, `/confirmar-email`, `/recuperar-senha`.
- Rotas protegidas por autenticação: tudo dentro do layout principal (Agenda, Pacientes, Conversas, Configurações, Assinatura).
- Rotas protegidas por role: ex. `/configuracoes/assinatura` e `/configuracoes/equipe` só para `ADMIN`; dentista logado só vê a própria agenda por padrão (filtro pré-aplicado, não escondido só via CSS).
- Componente `RequireAuth` que verifica se há usuário autenticado (via contexto) antes de renderizar rota protegida; se não, redireciona pro login preservando a URL de destino para retornar após o login.
- Componente `RequireRole` que recebe as roles permitidas e redireciona (ou mostra tela de "sem permissão") se o usuário não corresponder.

### 1.3 Tratamento de erro e loading — padrão global

- Todo hook de dado (`useAppointments`, `usePatients` etc.) expõe `{ data, isLoading, isError, error }` do React Query direto — os componentes de tela decidem o que renderizar em cada estado, sem lógica de fetch duplicada.
- Componente `<EmptyState />` reutilizável para listas vazias — texto específico do contexto (ex: "Nenhum paciente cadastrado ainda" com botão de ação, não uma mensagem genérica).
- Componente `<ErrorState />` reutilizável com botão de "tentar novamente" que invalida a query.
- Toasts (ex: `sonner` ou `react-hot-toast`) para feedback de ações (agendamento criado, erro ao salvar) — nunca só um `alert()`.

**Entregável da Fase 1:** login funcional com refresh automático, roteamento protegido por autenticação e role, camada de API centralizada, padrão de loading/erro definido e reutilizável.

---

## Fase 2 — Telas core (Agenda, Pacientes)

Baseado nos componentes visuais já existentes em `clinica-design.jsx`.

### 2.1 Agenda

- `useAppointments({ date, professionalId })` via React Query, com `queryKey` incluindo os filtros (garante cache correto por dia/profissional).
- Filtro por profissional (chips já desenhados) e navegação de data (seta anterior/próxima) — atualiza a query, não refaz fetch manual.
- Criar agendamento: modal ou painel lateral com formulário (paciente — busca com autocomplete, profissional, data/hora, tipo de consulta). Validação Zod espelhando as regras do backend: duração mínima, horário dentro do expediente.
- **Tratamento de conflito de horário:** se o backend retornar erro de conflito (a constraint de exclusão do Postgres, ver prompt de backend), exibir mensagem clara ("Esse horário já está ocupado") e sugerir os horários livres mais próximos (reaproveitando `GET /api/appointments/availability`), não só um erro genérico.
- Cancelamento de consulta: chama a action nomeada (`POST /api/appointments/{id}/cancel`), com confirmação antes (modal simples), atualiza a UI otimisticamente e reconcilia com a resposta.
- Estado otimista: ao criar/cancelar, atualizar a UI antes da resposta do servidor confirmar, mas reverter com mensagem clara se o backend rejeitar (ex: conflito detectado só no servidor).

### 2.2 Pacientes

- Listagem paginada (`useInfiniteQuery` ou paginação tradicional com controles, dependendo do volume esperado — para MVP, paginação tradicional é mais simples de auditar).
- Busca com debounce (300ms) chamando o endpoint de busca do backend, não filtro client-side (a base pode crescer além do que cabe numa página só).
- Formulário de cadastro/edição de paciente com Zod: telefone validado em formato E.164 (mesma regra do backend), nome obrigatório.
- Tela de detalhe do paciente: dados cadastrais + histórico de consultas + status de consentimento LGPD (mostrar quando foi dado, com link pra revisar/revogar).
- Ação de exclusão de dados pessoais (LGPD) — fluxo com confirmação explícita, deixando claro que o histórico de consultas é preservado de forma anonimizada, não apagado por completo.

**Entregável da Fase 2:** Agenda e Pacientes funcionais end-to-end contra a API real, com tratamento de conflito, paginação/busca e consentimento LGPD visível.

---

## Fase 3 — Conversas WhatsApp

- Lista de conversas com polling leve (React Query `refetchInterval`, ex: 15s) ou, se o backend expuser, WebSocket/SSE para atualização em tempo real — prefira tempo real se disponível, já que é uma tela operacional (a secretária precisa ver mensagem nova sem dar refresh).
- Indicador visual de não lida (já no design) atualizado conforme chega mensagem nova.
- Botão "Assumir conversa" chama o endpoint que tira a conversa do fluxo automático do bot — desabilitar o botão e mostrar estado "Você assumiu esta conversa" após a ação, evitando duplo clique.
- Envio de mensagem manual (quando a secretária assumiu) — mostrar estado de "enviando" e erro se falhar (a API do WhatsApp pode falhar; nunca mostrar como "enviado" sem confirmação).
- Filtro por status da conversa (aguardando bot / transferida / concluída) para a secretária priorizar o que precisa de atenção humana.

**Entregável da Fase 3:** tela de Conversas funcional, com atualização em tempo real ou near-real-time, handoff bot→humano funcionando de ponta a ponta.

---

## Fase 4 — Onboarding, billing e configurações

### 4.1 Onboarding (clínica nova)

- Tela de cadastro público (`/cadastro`): nome da clínica, e-mail, telefone, senha — validação Zod espelhando backend (senha forte, e-mail válido).
- Tela de confirmação de e-mail (`/confirmar-email?token=`) — trata token inválido/expirado com mensagem clara e opção de reenviar.
- Wizard pós-confirmação (pode ser um componente de steps dentro do layout autenticado, não rotas separadas): cadastrar primeiro profissional + horário de expediente → conectar WhatsApp (mostrar QR code ou instrução de configuração da Z-API, dependendo do provedor escolhido no backend) → convidar equipe (formulário simples de e-mail + role).
- Não deixar o usuário preso no wizard — sempre com opção de "continuar depois" que leva pro dashboard vazio com checklist do que falta.

### 4.2 Billing

- Tela de assinatura: plano atual, próxima cobrança, histórico de faturas (lista simples, sem necessidade de paginação complexa no MVP).
- Fluxo de assinar/trocar de plano: redireciona pro checkout do gateway ou usa o SDK embutido, conforme o que o backend expõe — não implemente lógica de cálculo de preço no frontend, sempre confie no que a API retorna.
- Estado de "trial expirando" (banner discreto quando faltam poucos dias) e "conta suspensa" (bloqueio visual claro de ações de escrita, com CTA pra reativar) — reflete o `clinic.status` que o backend já controla.

### 4.3 Configurações e equipe

- Gestão de profissionais e horários (CRUD simples, reaproveitando padrões da Fase 2).
- Gestão de equipe: convidar por e-mail, listar usuários da clínica com role, revogar acesso — visível só para `ADMIN` (`RequireRole`).

**Entregável da Fase 4:** fluxo completo desde cadastro da clínica até assinatura ativa e equipe configurada.

---

## Fase 5 — Polimento, acessibilidade e performance

1. **Responsividade:** todas as telas usáveis em tablet (secretária de clínica frequentemente usa tablet na recepção) — sidebar colapsável abaixo de um breakpoint definido.
2. **Acessibilidade:** foco visível em todos os elementos interativos (o design já usa cores discretas — garanta contraste mínimo AA nos textos secundários sobre fundo colorido, ex: texto sobre `accentSoft`); labels associados a inputs; navegação por teclado testada no fluxo de agendamento.
3. **Performance:** code-splitting por rota (`React.lazy` + `Suspense`); evitar re-render desnecessário nas listas grandes (memoização onde fizer diferença real, não por precaução genérica); imagens/ícones otimizados.
4. **Tratamento de rede instável:** indicador de "reconectando" se o polling/WebSocket da tela de Conversas cair; retry automático com backoff.
5. **Build e deploy:** variáveis de ambiente por ambiente (dev/staging/produção) via `.env`, nunca hardcoded; verificação de que o build de produção não inclui nenhum token/segredo.

---

## Instruções gerais para o Cursor

- Reaproveite os componentes visuais de `clinica-design.jsx` como base real (extraia `Sidebar`, `PageHeader`, `StatusBadge`, `PrimaryButton` para `components/` compartilhados) em vez de recriar do zero.
- Sempre que uma tela depender de uma regra de negócio que existe no backend (conflito de agenda, limite de plano, permissão por role), trate o erro retornado da API — não duplique a regra de negócio no frontend além da validação de formato/UX.
- Componentes de tela ficam enxutos: busca de dado em hook, lógica de formulário em hook, componente só orquestra e renderiza.
- Ao final de cada fase, resuma o que foi implementado e o que ficou pendente/simplificado, para eu revisar antes de avançar.

Comece pela **Fase 1**. Ao concluir, aguarde revisão antes de avançar para a Fase 2.
