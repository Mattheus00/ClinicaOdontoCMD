# Relatório de inspeção de segurança — SaaS Odonto

## Escopo e método

- Inventário local: 254 arquivos fora de `.git`, incluindo frontend React/Vite, backend Spring Boot, recursos públicos, banco H2 e logs.
- Revisão estática focada em autenticação, autorização, JWT/cookies, multi-tenancy, webhooks, dados pessoais/clínicos/financeiros, XSS, configuração e segredos.
- Validação: `backend/.\gradlew.bat test --no-daemon` concluído com sucesso.
- `npm audit` não pôde consultar o registry por restrição de rede.
- `npm run build` concluído com sucesso após tipar corretamente o formulário da agenda (`frontend/src/pages/dashboard/AgendaPage.tsx`).
- A varredura formal do plugin Codex Security não foi finalizada: o workspace falhou por ausência de `scripts/workbench_db.py`. Este relatório é uma revisão manual assistida, não uma certificação de cobertura total.

## Achados prioritários

### 1. Segredo JWT previsível como fallback — Alto, condicional

Evidência: `backend/src/main/resources/application.properties:10` define uma chave conhecida quando `DENTIC_JWT_SECRET` não está configurada. Essa chave assina tokens em `backend/src/main/java/com/dentic/api/security/JwtProvider.java:17-43`, e as claims `clinic_id` e `role` são confiadas pelo filtro em `JwtAuthenticationFilter.java:24-35`.

Impacto: em qualquer ambiente que suba sem a variável, um atacante pode forjar tokens administrativos e acessar ou alterar dados de clínicas.

Correção: falhar o startup se o segredo não existir; usar segredo aleatório fora do repositório, com rotação e gestão por secret manager.

### 2. Senhas em texto claro no log local — Alto

Evidência: `backend/dev-server.log:820` e `:827` registram o `LoginRequest` completo, incluindo o campo de senha. O log não está coberto pelo `.gitignore` do backend.

Impacto: qualquer pessoa com acesso ao workspace, backup ou coleta de logs pode recuperar credenciais. A credencial registrada deve ser considerada exposta e rotacionada.

Correção: remover logs de request body em produção, configurar níveis sem `DEBUG`, adicionar `*.log` ao ignore e revogar/remover o arquivo já criado após preservar apenas evidências redigidas.

### 3. Webhooks aceitam eventos falsificados — Alto, condicional

Evidências: `SecurityConfig.java:42-43` libera `/api/webhooks/**`; `WhatsappWebhookController.java:18-29` aceita assinatura ausente e não calcula HMAC; `BillingController.java:26-30` aceita payload de cobrança sem assinatura.

Impacto: qualquer origem pode injetar eventos. Os handlers atuais são mocks, reduzindo o impacto atual, mas a falha se torna crítica quando disparar mensagens, pagamentos ou alterações persistentes.

Correção: exigir assinatura, comparar com `MessageDigest.isEqual`, rejeitar ausência/invalidade, validar timestamp/nonce e aplicar idempotência; usar segredo separado por provedor.

### 4. Autorização excessiva para SECRETARY — Médio

Evidências: `PatientController.java:67-72` e `ProcedureController.java:29-34` bloqueiam apenas `DENTIST`; os métodos de escrita de pacientes (`:123-140`) e de procedimentos (`ProcedureController.java:45-67`) não exigem `ADMIN`.

Impacto: qualquer usuário com papel `SECRETARY` pode alterar pacientes e criar, editar ou excluir procedimentos, caso esse papel seja emitido em produção.

Correção: definir uma matriz explícita de permissões por endpoint e usar autorização positiva (`requireAdmin` ou authorities específicas), com testes por papel.

### 5. Confirmação de agendamento cria pagamento sem exigir ADMIN — Médio

Evidência: `AppointmentController.java:137-170` não chama `SecurityUtils.requireAdmin()` antes de criar `PatientPayment` e marcar o atendimento como `COMPLETED`.

Impacto: dentistas e secretários autenticados podem confirmar atendimentos e gerar registros financeiros. O dentista é limitado ao próprio profissional, mas o secretário não tem restrição equivalente.

Correção: separar permissão de confirmar atendimento da permissão de registrar pagamento; exigir papel e escopo explícitos, além de auditoria.

### 6. Dados sensíveis retornados integralmente — Médio

Evidências: `PatientController.java:509-530` retorna CPF, RG, endereço e contatos; `:599-603` retorna `cardNumber` do convênio sem mascaramento.

Impacto: uma conta autenticada com acesso à clínica recebe mais dados do que precisa para cada tela, aumentando impacto de comprometimento e risco de exposição interna.

Correção: DTOs mínimos por tela/papel, mascarar cartão e identificadores, restringir campos clínicos/financeiros e registrar acessos sensíveis.

### 7. Sessão não é revalidada após alteração de usuário — Médio

Evidências: `JwtProvider.java:22-35` coloca papel e clínica no token; `JwtProvider.java:40-43` e `JwtAuthenticationFilter.java:24-35` validam somente assinatura/expiração, sem consultar o usuário atual. O TTL é de 900 segundos.

Impacto: remoção, downgrade de papel ou mudança de clínica só deixa de valer para o access token após a expiração; o refresh é revogado, mas o bearer token atual permanece aceito.

Correção: incluir `sessionVersion`/revocation id consultável ou introspecção curta; invalidar imediatamente tokens em remoção e alteração de privilégio.

### 8. Cookie de refresh e CSRF incompletos — Médio/condicional

Evidências: `SecurityConfig.java:28-30` desabilita CSRF globalmente; `AuthController.java:215-219` define apenas `HttpOnly`, sem `Secure` e `SameSite` explícitos.

Impacto: a segurança dos endpoints que usam cookie depende de defaults do navegador e da infraestrutura. Em implantação HTTPS, a ausência de `Secure`/política explícita aumenta risco de envio indevido e torna o comportamento frágil.

Correção: usar `Secure`, `SameSite=Lax/Strict` conforme o fluxo, domínio restrito e proteção CSRF quando houver autenticação por cookie; manter refresh fora de respostas cross-site.

### 9. Configuração H2 de desenvolvimento exposta como padrão — Médio, condicional

Evidências: `application.properties:2-8` usa H2 persistente em arquivo, usuário `sa` sem senha, `spring.h2.console.enabled=true` e `ddl-auto=update`.

Impacto: se promovida para produção, a aplicação pode expor console/banco local e permitir alterações de schema não controladas. A configuração também deixa dados clínicos em `backend/data`.

Correção: separar profiles `dev`/`prod`, usar PostgreSQL com credenciais gerenciadas, migrations obrigatórias, console desligado e `ddl-auto=validate`.

### 10. Tokens em URL e mensagens cross-origin sem validação — Baixo/Médio

Evidências: convite usa `/convite/:token` (`frontend/src/App.tsx:67-68`), confirmação lê token da query string (`ConfirmEmailPage.tsx:5`), e o odontograma usa `postMessage(..., '*')` e aceita mensagens sem validar `event.origin`/`event.source` (`OdontogramVisual.tsx:19-43`, `public/odontogram/viewer.html:43,63-72`).

Impacto: tokens podem aparecer em histórico, logs e referências; mensagens de qualquer origem podem alterar o estado local do odontograma. Não foi demonstrada exfiltração direta no código atual.

Correção: usar fragmento ou fluxo de uso único sem token em URL persistente, definir `Referrer-Policy`, restringir `targetOrigin` e validar origem e janela de origem.

## Pontos positivos observados

- Access token fica em memória; não foi encontrado armazenamento em `localStorage`/`sessionStorage`.
- Refresh token é armazenado com hash no banco e rotacionado no refresh.
- Não foram encontrados `eval`, `dangerouslySetInnerHTML` ou sinks diretos de XSS.
- Os endpoints de pacientes, agendamentos, procedimentos e profissionais revisados fazem verificações explícitas de clínica; não foi confirmado IDOR nesses fluxos.
- Os testes do backend passaram.

## Próximas ações recomendadas

1. Rotacionar a credencial que apareceu no log removido e verificar backups/coletadores externos.
2. Definir o fluxo de confirmação de e-mail com token de uso único, expiração e envio.
3. Definir allowlist de URLs externas de cobrança e aplicar rate limiting nos endpoints públicos.
4. Executar `npm audit` em ambiente com acesso ao registry.

## Status da remediação

Aplicadas correções para os itens 1–8 e para as partes configuracionais dos itens 9–10: fallback JWT removido, cookies endurecidos, sessão revalidada contra o usuário atual, webhooks fechados com HMAC obrigatório, permissões de pacientes/procedimentos/pagamentos restringidas, cartão mascarado, logs locais removidos/ignorados, H2/DDL seguros por padrão e `postMessage`/transporte de API endurecidos. A configuração local passou a exigir `DENTIC_JWT_SECRET`; veja `backend/.env.example`.

O item de confirmação de e-mail continua pendente porque exige definir o fluxo de emissão, armazenamento, expiração e envio do token. O uso de tokens em URLs ainda requer migração para fragmento/fluxo de uso único. A validação de URLs externas de cobrança e rate limiting também permanecem como hardening posterior.
