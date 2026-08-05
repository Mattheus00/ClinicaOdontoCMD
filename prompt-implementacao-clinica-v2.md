# Prompt de Implementação — Sistema de Gestão de Clínicas Odontológicas (SaaS)

Cole este prompt no Cursor para iniciar a implementação. Está dividido em fases sequenciais — execute uma fase por vez, revise o output, só então avance. Não peça pro Cursor gerar tudo de uma vez: isso produz código difícil de auditar, principalmente nas partes de segurança.

---

## Contexto do projeto

Você vai implementar um **SaaS multi-tenant** de gestão de clínicas odontológicas com agendamento automatizado via bot de WhatsApp. Cada clínica é um tenant isolado, pagando por assinatura. O sistema lida com dados sensíveis de pacientes (LGPD) e precisa aguentar múltiplas clínicas operando simultaneamente sem uma vazar dado ou degradar a performance da outra.

**Stack:**
- Backend: Java 21 + Spring Boot 3.x + Spring Security + Spring Data JPA
- Banco: PostgreSQL 15+, migrações versionadas com **Flyway**
- Frontend: React + Vite
- Bot WhatsApp: Z-API ou Twilio (API oficial do WhatsApp Business)
- Jobs assíncronos: Spring `@Scheduled` inicialmente; considerar RabbitMQ se o volume de mensagens justificar
- Billing: Stripe (internacional) ou Pagar.me/Asaas (nacional, PIX/boleto — geralmente melhor pra clínica brasileira pequena)
- Deploy: Docker; backend em Render/Railway; frontend em Vercel; banco gerenciado (Render Postgres, Supabase ou RDS)

**Schema de banco já definido** (anexo `schema_clinica.sql`) — use como ponto de partida, mas adapte para Flyway (ver Fase 1) e sinalize qualquer ajuste de normalização que fizer sentido.

**Convenções gerais para todo o projeto:**
- Pacotes Java organizados por feature (`com.dentic.appointments`, `com.dentic.patients`, `com.dentic.billing`), não por camada técnica (`controller`, `service`, `repository` genéricos espalhados).
- DTOs de request/response separados das entidades JPA — nunca expor entidade diretamente na API.
- Toda constante de negócio (ex: duração padrão de consulta, janela de lembrete) em `application.yml`, não hardcoded.
- Commits pequenos e descritivos por sub-tarefa, não um commit gigante por fase.

---

## Fase 0 — Onboarding da clínica e billing

Esta fase define como uma clínica entra no sistema e paga por ele. Sem isso, não existe SaaS, só um sistema interno.

### 0.1 Fluxo de cadastro (self-service)

1. Tela pública de cadastro: nome da clínica, e-mail do responsável, telefone, senha.
2. Ao cadastrar, criar `clinic` com `plan = 'trial'` e `trial_ends_at = now() + 14 dias`.
3. Criar automaticamente o primeiro `user` com role `ADMIN`.
4. Disparar e-mail de boas-vindas com link de confirmação (endpoint `POST /api/auth/confirm-email?token=...`) — conta não deve ficar 100% ativa sem confirmar e-mail (mitiga cadastro com e-mail falso/spam).
5. Wizard de onboarding pós-confirmação (pode ser telas no frontend, não precisa ser tudo backend):
   - Passo 1: cadastrar primeiro profissional + `working_hours`.
   - Passo 2: conectar número de WhatsApp (ver Fase 3 — gerar o número/QR ou configurar webhook da Z-API).
   - Passo 3: convidar equipe (secretária) por e-mail com link de convite expirável.

### 0.2 Planos e billing

1. Modelagem de planos (tabela `plans`: id, nome, preço, limites — ex: nº de profissionais, nº de agendamentos/mês, se inclui bot de WhatsApp).
2. Integração com gateway de pagamento (Pagar.me ou Asaas para BR):
   - Endpoint `POST /api/billing/subscribe` — cria assinatura recorrente vinculada à `clinic`.
   - Webhook do gateway (`POST /api/webhooks/billing`) para receber eventos de pagamento confirmado/falhado/cancelado — **valide a assinatura do webhook do gateway também**, mesmo cuidado que o webhook do WhatsApp.
   - Ao fim do trial sem assinatura ativa, mover `clinic.status` para `suspended` — bloquear escrita (mas não leitura) via um filtro/aspect que verifica status antes de qualquer `POST/PUT/DELETE`.
3. Nunca processar lógica de negócio crítica (liberar/bloquear acesso) só com base no retorno síncrono do checkout — sempre confirmar via webhook, que é a fonte de verdade do gateway.
4. Página de "minha assinatura" no frontend: plano atual, próxima cobrança, histórico de faturas, botão de cancelar (que deve manter acesso até o fim do período já pago, não cortar na hora).

### 0.3 Consentimento LGPD

1. No fluxo de agendamento (seja pelo bot ou manual), capturar consentimento explícito do paciente para:
   - Armazenamento de dados pessoais e de saúde básicos (nome, telefone, histórico de consulta).
   - Recebimento de mensagens automáticas via WhatsApp (lembretes, confirmações).
2. Adicionar campo `consent_given_at` e `consent_version` na tabela `patients` (versionar o texto de consentimento, porque ele pode mudar).
3. Primeira mensagem do bot para um paciente novo deve incluir um resumo curto do que será feito com os dados + opção de recusar (se recusar, não prosseguir com coleta de dados além do mínimo pra responder à dúvida).
4. Endpoint `DELETE /api/patients/{id}/personal-data` — atende ao direito de exclusão da LGPD: anonimiza nome/telefone/e-mail mas preserva o registro de `appointments` (para a clínica manter histórico financeiro/legal), removendo o vínculo identificável.
5. Documentar (README ou doc separado) a base legal de cada tratamento de dado (consentimento para marketing/lembretes; execução de contrato para o agendamento em si).

**Entregável da Fase 0:** clínica consegue se cadastrar, confirmar e-mail, passar pelo wizard, assinar um plano (mesmo que em sandbox do gateway), e o fluxo de consentimento do paciente está registrado no banco.

---

## Fase 1 — Fundação de segurança, multi-tenant e migrações

### 1.1 Migrações versionadas

- Configure Flyway desde o commit inicial. **Nunca** deixe o Hibernate criar/alterar schema automaticamente em produção (`ddl-auto: validate`, nunca `update` ou `create`).
- Converta o `schema_clinica.sql` em migrações incrementais: `V1__init_schema.sql`, `V2__add_plans_billing.sql`, `V3__add_consent_fields.sql`, etc. — cada mudança de schema depois disso é uma nova migração, nunca edição de uma já aplicada.
- Ambiente de teste deve rodar as migrações do zero a cada suíte (Testcontainers com Postgres real, não H2 — comportamento de constraints/JSONB difere).

### 1.2 Isolamento multi-tenant (crítico)

- Todo endpoint autenticado resolve `clinic_id` a partir do JWT — **nunca** aceitar `clinic_id` vindo do client (body/query/path) para decidir o que retornar ou alterar.
- Implemente um `TenantContext` (request-scoped bean) populado por um `Filter`/`Interceptor` do Spring Security logo após a autenticação.
- Use o filtro do Hibernate (`@FilterDef`/`@Filter` com `clinic_id`) habilitado automaticamente em cada `EntityManager` aberto, ou um `Repository` base que injeta a cláusula `WHERE clinic_id = :tenantId` em toda query — escolha uma abordagem e aplique consistentemente, não misture.
- **Teste obrigatório:** para cada entidade tenant-scoped, escreva um teste de integração que cria dados na Clínica A, autentica como usuário da Clínica B, e confirma 404 (não 403 — não revele nem a existência do recurso).

### 1.3 Autenticação e autorização

- JWT assinado com chave assimétrica (RS256), não HS256 — facilita rotação de chave e validação por outros serviços no futuro sem compartilhar segredo simétrico.
- Access token: 15 min de validade, claims mínimas (`sub`, `clinic_id`, `role`, `exp`) — nunca inclua dado sensível no payload (JWT não é criptografado, só assinado).
- Refresh token: 7 dias, armazenado como cookie httpOnly + `Secure` + `SameSite=Strict`, com rotação a cada uso (refresh token antigo invalidado ao gerar um novo — mitiga replay se um refresh token vazar).
- Tabela `refresh_tokens` no banco (hash do token, não o valor puro) para permitir revogação (logout remoto, "sair de todos os dispositivos").
- Roles: `ADMIN` (tudo na clínica), `SECRETARY` (agenda, pacientes, conversas — não billing/configurações), `DENTIST` (só a própria agenda e pacientes que atendeu). Modele isso com `@PreAuthorize` nos controllers, testado explicitamente por role.
- Rate limiting no login: 5 tentativas / 15 min por combinação IP+e-mail (Bucket4j ou implementação simples com Redis/cache local). Resposta genérica ("credenciais inválidas") tanto para e-mail inexistente quanto senha errada — não vaze qual dos dois está errado.
- Senhas: BCrypt custo 12. Endpoint de troca de senha exige senha atual.

### 1.4 Validação de entrada

- Bean Validation em 100% dos DTOs de request (`@NotBlank`, `@Email`, `@Pattern` para telefone em E.164, `@Size` em campos de texto livre para evitar payloads absurdos).
- `@ControllerAdvice` global para converter erros de validação em resposta padronizada (não vazar stacktrace nem detalhes internos em produção).
- Sanitize qualquer campo que será renderizado depois (ex: `notes` de paciente) contra XSS armazenado, mesmo que o front use React (que escapa por padrão) — defesa em profundidade, porque o dado pode ser consumido por outro client no futuro.

### 1.5 Dados sensíveis e logging seguro

- Configure o logger (Logback) com um `MaskingPatternLayout` ou similar para nunca gravar nome/telefone/e-mail de paciente em texto plano nos logs de aplicação — logue IDs, não PII.
- Desative log de SQL com bind parameters em produção (`show-sql: false`, ou se precisar, use `logging.level` restrito a DEBUG local).
- Segredos (chave JWT, credenciais de gateway, token da Z-API) **nunca** no `application.yml` commitado — variáveis de ambiente ou secret manager do provedor de deploy.

**Entregável da Fase 1:** projeto rodando com Flyway aplicando migrações, autenticação completa (login, refresh, logout com revogação), isolamento multi-tenant coberto por testes, e um endpoint de health-check (`/actuator/health`) exposto sem autenticação para o provedor de deploy monitorar.

---

## Fase 2 — CRUD core (clínica, profissionais, pacientes, agendamentos)

### 2.1 Endpoints

- `PATCH /api/clinics/me` — editar dados da própria clínica (só `ADMIN`).
- `GET/POST/PUT/DELETE /api/professionals` + `POST /api/professionals/{id}/working-hours` — gestão de profissionais e disponibilidade.
- `GET/POST/PUT/DELETE /api/patients` — CRUD com paginação (`Pageable`, máximo 50 por página) e busca por nome/telefone (`ILIKE` com índice, ou `pg_trgm` se a base crescer muito).
- `GET/POST/PUT /api/appointments` + `POST /api/appointments/{id}/cancel` (cancelamento como ação nomeada, não `PUT` genérico mudando status — deixa a intenção explícita e permite side-effects como notificar o paciente).
- `GET /api/appointments/availability?professionalId=&date=` — endpoint dedicado que calcula horários livres cruzando `working_hours` com `appointments` existentes; é o endpoint mais chamado pelo bot, então merece cache de curto prazo (ex: 30s) se o volume justificar.

### 2.2 Regras de negócio críticas

- **Conflito de agenda:** nunca dois agendamentos sobrepostos para o mesmo profissional. Implemente com constraint de exclusão do Postgres (`EXCLUDE USING gist` com `tsrange`) além da validação em código — a constraint de banco é a garantia real sob concorrência, a validação em código é só pra dar erro amigável antes de bater no banco.
- Validar que o horário do agendamento cai dentro do `working_hours` do profissional no dia da semana correspondente.
- Todo endpoint de escrita relevante (criar agendamento) aceita um header `Idempotency-Key` — se o mesmo key chegar de novo (ex: bot reenviando por timeout), retornar o resultado já processado em vez de duplicar.

### 2.3 Escalabilidade

- Todas as listagens paginadas, nunca retorno de lista completa sem limite.
- Confirme com `EXPLAIN ANALYZE` que a query de disponibilidade usa o índice `idx_appointments_prof_time`.
- Separe a fonte de dados de leitura pesada (relatórios) da transacional desde já com um `DataSource` nomeado, mesmo apontando pro mesmo banco por enquanto — facilita apontar para uma read replica sem refatorar depois.
- Cache de segundo nível (Caffeine) para dados que mudam pouco e são lidos muito, como `working_hours` — invalidar no `PUT`.

### 2.4 Estratégia de testes (definição explícita)

- **Unitário:** regras de negócio puras (cálculo de disponibilidade, validação de conflito) sem subir contexto Spring — rápido, roda em todo commit.
- **Integração:** endpoints completos com Testcontainers (Postgres real) — cobre autenticação, autorização por role, isolamento multi-tenant. Roda no CI a cada PR.
- **Contrato:** para os webhooks (WhatsApp e billing), teste com payloads reais capturados do sandbox de cada provedor — evita quebrar quando o provedor muda formato.
- Meta mínima: toda regra de negócio com mais de um caminho (if/else relevante) tem teste para cada caminho; todo endpoint tem pelo menos um teste de autorização negativa (usuário sem permissão / de outro tenant).

**Entregável da Fase 2:** API REST completa, testada nos três níveis acima, documentada em OpenAPI/Swagger (`/swagger-ui.html` protegido por perfil, não exposto em produção sem autenticação).

---

## Fase 3 — Bot de WhatsApp

### 3.1 Webhook de recebimento

- `POST /api/webhooks/whatsapp` — valida assinatura/token do provedor em **todo** request antes de processar qualquer coisa (Z-API e Twilio documentam como validar; normalmente é um header com HMAC do payload usando um secret configurado).
- Responda 200 ao webhook em menos de 5s — enfileire o processamento (`@Async` com thread pool dedicado, ou fila real se o volume crescer) em vez de processar tudo síncrono na request.
- Log de auditoria de todo payload recebido (sem PII em texto livre no log — referencie por ID de conversa).

### 3.2 Máquina de estados da conversa

Estados sugeridos (armazenados em `whatsapp_conversations.current_step`):

```
inicio
  → menu_principal (bot pergunta: agendar / remarcar / cancelar / falar com atendente)
    → agendar_escolhendo_profissional
      → agendar_escolhendo_horario
        → agendar_confirmando
          → agendar_concluido
    → remarcar_localizando_consulta
      → remarcar_escolhendo_horario
        → remarcar_confirmando
    → cancelar_confirmando
    → transferido_atendente (sai do fluxo automático, notifica secretária)
```

- `context_json` guarda dados temporários da conversa (ex: profissional escolhido, horário candidato) — sempre validado contra o banco antes de confirmar (nunca confiar que o `professional_id` guardado no contexto ainda é válido/disponível sem checar de novo no momento da confirmação).
- Timeout: se não houver resposta em 30 min, próxima mensagem do paciente reseta para `inicio` com uma mensagem tipo "Vamos recomeçar, tudo bem?".
- Fallback: mensagem fora do esperado no estado atual → reapresentar as opções do estado atual, no máximo 2 vezes, depois oferecer transferência para atendente humano (evita loop frustrante).
- Handoff para humano: quando `current_step = transferido_atendente`, o bot para de responder automaticamente àquele número até a secretária marcar como resolvido na tela de Conversas (o botão "Assumir conversa" do design que já fizemos).

### 3.3 Lembretes e notificações automáticas

- Job `@Scheduled` (a cada 15-30 min) busca `appointments` nas próximas 24h sem `notification` do tipo `reminder_24h` enviada, dispara mensagem, grava resultado em `notifications`.
- Retry com backoff exponencial (ex: 3 tentativas, 1min/5min/15min) se o envio falhar; após esgotar tentativas, marcar `status = failed` e sinalizar na tela da clínica (não falhar silenciosamente).
- Mensagens de confirmação/cancelamento disparadas por evento (não pelo job periódico) assim que o status do agendamento muda.

### 3.4 Segurança específica do bot

- Rate limit por número de telefone (ex: máx. 20 mensagens processadas/hora) — evita abuso gerando custo de API pro dono da clínica.
- Sempre validar que o `patient_phone` da conversa corresponde ao `patient_id` sendo manipulado antes de qualquer leitura/escrita — nunca deixar o `context_json` sozinho decidir de qual paciente se trata.
- Números não reconhecidos (primeira mensagem) criam um `patient` novo só após capturar nome + consentimento (ver Fase 0.3) — não crie registro completo de agendamento sem esse passo.

**Entregável da Fase 3:** fluxo completo testado em sandbox — agendar, remarcar, cancelar via WhatsApp, lembrete automático disparando, e transferência para atendente humano funcionando na tela de Conversas.

---

## Fase 4 — Frontend

- Implemente as telas já desenhadas (`clinica-design.jsx`: Agenda, Pacientes, Conversas) consumindo a API real, mais as telas novas desta expansão: cadastro/onboarding (Fase 0.1), assinatura/billing (Fase 0.2).
- Auth: access token em memória (variável de estado, nunca `localStorage`/`sessionStorage` — vulnerável a XSS); refresh automático via cookie httpOnly gerenciado pelo backend, transparente pro usuário.
- Interceptor HTTP centralizado: 401 → tenta refresh uma vez → se falhar, desloga e redireciona; 403 → mensagem clara de permissão insuficiente, sem crash; 5xx → mensagem genérica de erro com opção de tentar de novo.
- Formulários com validação client-side espelhando as regras do backend (mas o backend é sempre a fonte de verdade — nunca confiar só na validação do client).
- Loading states e optimistic UI nas ações de agendamento, sempre reconciliando com a resposta real (se o backend rejeitar por conflito de horário, reverter o estado otimista com mensagem clara).

**Entregável da Fase 4:** frontend integrado, fluxo completo do onboarding de uma clínica nova até o dia a dia de uso (agenda, pacientes, conversas, assinatura).

---

## Fase 5 — Produção, observabilidade e escala

1. **Observabilidade:** logging estruturado (JSON) com correlation ID por request (propagado do frontend, se possível, até os logs do backend); métricas via Micrometer + Prometheus — nº de agendamentos criados, taxa de sucesso do bot, latência p95/p99 dos endpoints, taxa de erro do webhook.
2. **Testes de carga:** simule N clínicas × M pacientes concorrentes tentando agendar no mesmo horário exato — confirme que a constraint de exclusão do Postgres se comporta corretamente e que o erro retornado é amigável, não um 500 genérico.
3. **Backup e disaster recovery:** backup automático diário do Postgres com retenção de pelo menos 30 dias; teste de restore documentado e executado pelo menos uma vez antes de ir ao ar.
4. **CI/CD:** pipeline (GitHub Actions) rodando testes unitários + integração + lint + scan de dependências vulneráveis (`mvn dependency-check` ou Snyk/Dependabot) antes de cada deploy; deploy automático só a partir de `main` após pipeline verde.
5. **Headers e configuração de segurança:** CORS restrito aos domínios conhecidos do frontend (nunca `*` em produção), CSP configurado, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS — tudo via Spring Security, não middleware improvisado.
6. **Plano de rollback:** toda migração de banco (Flyway) deve ter, documentado, como reverter manualmente se necessário — Flyway não faz rollback automático por padrão.

---

## Instruções gerais para o Cursor

- Explique brevemente as decisões de arquitetura antes de gerar código extenso, especialmente qualquer trade-off de segurança/escala.
- Priorize código idiomático Spring Boot — não reinvente o que o framework já resolve bem (validação, serialização, transações).
- Toda função que lida com dado de paciente, autenticação ou pagamento vem acompanhada de teste (ver estratégia definida na Fase 2.4).
- Se identificar um trade-off relevante (ex: JWT stateless vs. sessão com Redis para revogação instantânea; Z-API vs. Twilio para o bot), pare e apresente as opções com prós/contras antes de decidir sozinho.
- Ao final de cada fase, gere um resumo do que foi implementado e o que ficou pendente/simplificado, para eu revisar antes de avançar.

Comece pela **Fase 0**. Ao concluir, aguarde revisão antes de avançar para a Fase 1.
