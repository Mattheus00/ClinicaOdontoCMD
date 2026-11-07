# Primeira rodada de UX — Clínica Odonto CMD

Data: 31/10/2026. Entrega local para revisão, sem publicação.
Branch: `experimentos/auditoria-ux-2026-10-31`.
Base do clone: `03d408e3afbd6716edcda5b507a24821a4f234f2` (auditoria já existente).

## Abrir o ambiente

Pasta: `frontend`, dentro deste repositório. Node utilizado: 22.22.1.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run build:ux
npm run preview:ux
```

Abrir <http://127.0.0.1:4173/>. A barra superior dá acesso à home, paciente e recepção, restauração e cenários normal/vazio/erro/conflito. Para desenvolvimento: `npm run dev:ux` (Vite, porta 5173 por padrão).

- Trata-se de **simulação local identificada**, sem backend. Não usar dados reais.
- O adaptador HTTP local responde às chamadas previstas e recusa as demais, sem fallback de rede. Não envia e-mails, mensagens ou pagamentos.
- Fixtures operacionais ficam em `sessionStorage`, somente na aba. Recarregar preserva alterações; restaurar ou fechar a aba encerra esse cenário. Outras abas não constituem teste de concorrência ou de banco.
- A autenticação normal não foi alterada. Somente o ponto de entrada `src/demo/main.tsx`, selecionado pelo modo `ux-demo`, instala respostas simuladas. O token propositalmente inválido não é uma credencial de acesso a qualquer servidor.
- O servidor de preview atende apenas em loopback, serve `dist-ux-demo` com gzip, não possui proxy de API e envia `noindex, nofollow`. O ponto de entrada recusa execução fora de localhost. Não é servidor de produção.
- No build normal, a home usa `VITE_PUBLIC_BOOKING_SLUG` quando configurado pela clínica; sem ele, abre `/agendar` com orientação para obter o link, sem inventar um endereço válido. O slug fictício só é usado no modo de testes.

## Isolamento e escopo

O diretório pai tinha documentos, sem repositório Git. Foi feito clone novo diretamente da branch solicitada; estado inicial limpo, remoto conferido. A main não foi usada nem alterada. Nenhum merge, force push, provisionamento ou deploy foi realizado.

Foram lidos `agents.md` e `PLANEJAMENTO-SGC.md` locais e a auditoria versionada. Não há AGENTS adicional no clone. A base React/Vite + Java/Spring foi mantida; `package-lock.json` preservado, sem segundo lockfile ou dependência de produto nova.

Configuração conferida: API normal `/api`, proxy local para `localhost:8080`; backend padrão H2 em arquivo, segredo JWT exigido e console desabilitado por padrão. Não havia `.env` real neste clone. Nenhuma configuração Supabase/produção foi ativada ou copiada. O backend exige Java 21; o Java disponível é 17. A tentativa de `gradlew.bat test --offline` falhou antes dos testes porque o ambiente não permitiu criar o lock na pasta Gradle externa. Não foi iniciado servidor Java nem validado banco.

## Identidade preservada

- PNG original `public/brand/maria-alice-logo.png` intacto. A variante WebP foi gerada sem perdas, com `exact=True`; todos os pixels RGBA são idênticos, 256 × 256, sem recorte, recoloração ou deformação. Tamanho: 6.654 bytes.
- Dourado decorativo `#a68b5b`, dourado de texto/controle `#755a25`, preto, branco e neutros quentes. Nenhum filtro de cor aplicado à marca.
- Mantidas Inter e Playfair Display. As variantes latinas WOFF2 agora são locais: 48.256 + 38.404 = 86.660 bytes. Licenças OFL incluídas ao lado dos arquivos; `font-display: swap`.
- A barra de ferramentas de teste usa fonte do sistema para não deslocar o aplicativo durante a carga das fontes da clínica.

## Mudanças nas três telas

### Home pública

Mensagem e ação “Agendar avaliação” antes do painel de marca no celular. Acesso da equipe separado e indisponibilidade do portal autenticado do paciente informada. Navegação móvel inline, fechável com Escape e retorno de foco; link para pular ao conteúdo.

Retiradas alegações sem verificação (experiência, credenciais, resultados e tecnologia), fotos remotas de origem/licença não comprovada, contatos/endereço não verificados, botões sem ação e links legais vazios. A antiga galeria de casos foi substituída pela explicação do fluxo, com classes coerentes e sem alegar resultados clínicos. Informações legais incompletas estão identificadas como pendentes, não como páginas publicadas.

### Agendamento

Consulta/profissional → data/horário → identificação → revisão → envio. Radios nativos com seleção acessível e setas do teclado; fieldset/legend e indicação explícita do fuso. Mensagens de carregamento, vazio, erro, conflito e solicitação enviada. Retry de disponibilidade e preservação dos dados em falhas. Revisão recebe foco e permite editar.

Mantido o contrato de solicitação pendente de aceite. Não há promessa de confirmação imediata, reserva garantida ou comunicação por WhatsApp. Telefone continua obrigatório por compatibilidade com o contrato atual; não se decidiu silenciosamente sua obrigatoriedade futura. Campo livre de motivo/observações retirado para não solicitar dados de saúde; nenhum novo dado pessoal foi acrescentado.

### Agenda da recepção

Dia como visualização inicial, lista utilizável no celular, alternância de período diário/semanal e grade opcional em telas maiores. Data direta, Hoje, anterior/próximo, profissional e situação próximos. Horário, paciente, profissional, serviço e situação com rótulos legíveis.

Grade com região identificada e rolagem localizada por teclado. Consultas acionáveis por Enter; remarcação também disponível no diálogo, sem exigir arrastar. Novo agendamento utiliza data/hora nativa e preserva formulário em erro. O formulário e suas dependências de validação são carregados apenas ao abrir o diálogo, conforme diagnóstico de performance. Navegação móvel normal apresenta duas tarefas e “Mais”, preservando os demais destinos existentes. Diálogos mantêm foco durante edição e o devolvem ao fechar.

Exibições e agrupamento de consultas usam explicitamente `America/Sao_Paulo`. O contrato legado sem offset continua sendo enviado como horário local da clínica. Respostas com offset/UTC são convertidas; testes incluem fuso do dispositivo diferente e virada de dia em UTC.

A simulação não oferece prontuário, financeiro ou notificações. Não foram adicionados nem ampliados esses módulos preexistentes da base normal.

## Validações

- `npm run build` e `npm run build:ux`: TypeScript e builds aprovados.
- `npm run lint`: sem erros; três avisos de Fast Refresh já existentes (AuthContext, AgendaScheduleGrid e MaxillaCalibration).
- `npm test`: 15 testes em seis arquivos aprovados, incluindo dois casos novos de fuso/data.
- `scripts/ux-smoke.mjs`: matriz e fluxos em Chromium, dados fictícios, erro/conflito, sucesso pendente, aceite, cancelamento, remarcação bem-sucedida e falha preservando o horário anterior **na simulação**, criação manual, teclado/foco, menu e estados vazio/erro.
- Larguras CSS: 320, 375, 600, 768, 900, 1024, 1280 e 1440; paisagem 900 × 375; texto a 200%. Reflow equivalente a zoom 200%: 384 px CSS / 768 px físicos com escala 2. Não foi usado comando de zoom nativo do navegador.
- Chromium com fuso Asia/Tokyo; WebKit emulado a 375 px com fuso America/Los_Angeles. WebKit não equivale a Safari/iPhone real. Sem teste em Firefox, Edge/Safari nativos, leitor de tela ou aparelhos reais. A simulação mantém suas barras em fluxo para acomodar as ferramentas de teste; a disposição fixa da área autenticada normal ainda precisa ser conferida com sessão real de teste.
- `scripts/ux-week.mjs`: quatro verificações adicionais de grade, rolagem e foco por teclado a 1024 px.
- Contraste calculado sobre estilos computados, compondo fundos: estados normais, seleção/hover, erro e detalhes. Relatório em `evidencias/ux-2026-10-31/contrast.json`. Não é certificação WCAG nem auditoria integral de componentes legados. Marca/logotipo é preservada e não tratada como texto comum.
- Não há teste real de autorização, concorrência de reservas, transação de remarcação, persistência do backend ou RLS nesta entrega. Testes do adaptador não comprovam essas propriedades.

## Performance

Medição de laboratório em build de produção do modo isolado, incluindo a barra de testes. Não representa o backend normal nem tráfego real.

Navegador: Chromium `151.0.7922.34` via Playwright 1.62.1; Windows, Node 22.22.1. Build identificado pelo SHA-256 do HTML: `2240a249a6f94e510d9099a4b2b6d23799c789347ea793aebaafa405de7ed048`. Coleta em `2026-10-31T21:18:51.645Z` (UTC), em 31/10/2026 no fuso da clínica.

Três execuções por rota/perfil, novo contexto e cache desabilitado em cada uma, sem interação opcional. HTTP local com gzip; sem outro teste de navegador em paralelo. Fuso America/Sao_Paulo. Perfil móvel: 375 × 812 CSS, CPU 4×, latência 150 ms, download 200.000 bytes/s (1,6 Mbit/s), upload 93.750 bytes/s. Desktop: 1440 × 900 CSS, CPU 1×, latência 20 ms, download 1.250.000 bytes/s e upload 625.000 bytes/s.

**Limite:** o adaptador de API usa 250 ms artificiais; chamadas simuladas não passam pela rede nem pela limitação de banda. Métricas são obtidas por PerformanceObserver/ResourceTiming e CDP, sem nota de Lighthouse, INP ou percentil 75 de campo.

| Perfil / rota | LCP mediana (mín–máx), s | FCP mediana (mín–máx), s | CLS mediana (mín–máx) |
| --- | --- | --- | --- |
| mobile / home | 2,132 (2,104–2,156) | 1,644 (1,632–1,656) | 0.00000 (0.00000–0.00000) |
| mobile / agendamento | 1,988 (1,984–2,004) | 1,660 (1,656–1,676) | 0.00375 (0.00375–0.00375) |
| mobile / agenda | 2,492 (2,492–2,500) | 1,684 (1,632–1,712) | 0.00000 (0.00000–0.00000) |
| desktop / home | 0,636 (0,624–0,668) | 0,336 (0,324–0,356) | 0.00000 (0.00000–0.00000) |
| desktop / agendamento | 0,596 (0,588–0,624) | 0,320 (0,316–0,340) | 0.00095 (0.00095–0.00095) |
| desktop / agenda | 0,924 (0,912–0,944) | 0,336 (0,316–0,348) | 0.00774 (0.00774–0.00774) |

Medianas dentro das metas de LCP/FCP/CLS nesta coleta. A agenda móvel chegou a 2,500 s e tem pouca margem: não se garante desempenho em aparelhos reais. INP: **não medido**; Core Web Vitals de campo: **sem amostra**. Dashboard fora das três telas autorizadas, não medido.

| Perfil / rota | Total transferido, KB | JS gzip, KB | CSS gzip, KB | Fontes, KB | Imagens, KB |
| --- | --- | --- | --- | --- | --- |
| mobile / home | 223,143 | 116,474 | 6,011 | 86,660 | 6,654 |
| mobile / agendamento | 225,539 | 118,203 | 5,778 | 86,660 | 6,654 |
| mobile / agenda | 232,596 | 123,162 | 7,276 | 86,660 | 6,654 |
| desktop / home | 223,143 | 116,474 | 6,011 | 86,660 | 6,654 |
| desktop / agendamento | 225,539 | 118,203 | 5,778 | 86,660 | 6,654 |
| desktop / agenda | 193,892 | 123,162 | 7,276 | 48,256 | 6,654 |

KB decimal (1.000 bytes). Total usa `transferSize` do navegador; categorias usam `encodedBodySize`. Tetos: total 1.500 KB, JS 300 KB, CSS 100 KB, fontes 100 KB e imagens da primeira tela 500 KB, além de menos de 300.000 bytes por imagem. As três rotas ficaram dentro desses tetos. Não houve transferência de módulos 3D, financeiro ou prontuário nas medições.

O diagnóstico anterior preservado em [performance-diagnostico-anterior.json](evidencias/ux-2026-10-31/performance-diagnostico-anterior.json) mostrou a agenda móvel com LCP mediano de 2,636 s e JS inicial de 152,807 KB. Separar o formulário retirou sua validação do caminho inicial; a coleta final tem 123,162 KB de JS na agenda. São duas coletas locais limitadas, não evidência de melhoria em usuários reais.

Dados completos em `evidencias/ux-2026-10-31/performance.json`; traços CDP locais em `frontend/test-results/performance/*-mobile-trace.json` (gerados, ignorados pelo Git). Scripts reproduzíveis em `frontend/scripts/ux-performance.mjs`.

## Revisão de terceiros e dados

Nenhum SDK, analytics, mensageria, serviço externo ou coleta nova introduzidos. As dependências existentes foram instaladas pelo lockfile; isso não representa auditoria completa de segurança do acervo. Prettier foi utilizado como ferramenta temporária de desenvolvimento, sem alteração do manifesto/lockfile.

| Recurso | Finalidade/origem/licença | Dados e destinos | Custos/limites/revisão |
| --- | --- | --- | --- |
| Inter, família existente | WOFF2 latino do Google Fonts, SIL OFL; licença local | Download apenas na preparação. No app, requisição ao próprio servidor; removidas chamadas Google Fonts/gstatic | Nenhum serviço pago ativado; 48.256 bytes; revisão limitada à origem, licença, tamanho e carga |
| Playfair Display, família existente | WOFF2 latino do Google Fonts, SIL OFL; licença local | Mesma regra; sem destino remoto no carregamento das três telas | 38.404 bytes; não é auditoria de toda a cadeia de fontes |
| Adaptador de simulação | Código local sem SDK adicional | Nome/telefone/e-mail fictícios e consultas no sessionStorage da aba | Sem backend ou comunicação; fechar/restaurar limpa o cenário |
| Vite/React/Axios/React Query e demais dependências | Versões do package-lock existente | Uso normal mantido; adapter intercepta HTTP no modo isolado | Sem migração/atualização incidental ou auditoria completa de fornecedores |

Fontes oficiais consultadas: [Vite — modos e variáveis](https://vite.dev/guide/env-and-mode), [React — controles nativos](https://react.dev/reference/react-dom/components/input), [Google Fonts](https://github.com/google/fonts). URLs de origem dos WOFF2 e licenças estão em `public/fonts/README.md`.

## Bloqueios e decisões pendentes

| Item | Evidência / encaminhamento | Situação |
| --- | --- | --- |
| Confirmação imediata ou aceite | Planejamento prevê reserva imediata; código `accept` muda PENDING para SCHEDULED. Mantido aceite, com mensagens coerentes; decidir antes de alterar servidor/banco | Pendente dos responsáveis |
| Presença e atendimento | Backend não tem confirmação de presença/chegada separadas. `POST /appointments/{id}/confirm` conclui e cria pagamento PAID. Interface informa a limitação; rótulo normal explicita conclusão legada. Simulação não chama esse endpoint | Bloqueio concreto para validar jornada P0 completa |
| Backend isolado | Java 21 indisponível; nenhum banco/servidor validado | Necessário ambiente de teste próprio para integração |
| Paciente autenticado | Base oferece ADMIN/SECRETARY/DENTIST; não há portal de paciente implementado | Não inventado ou ampliado nesta rodada |
| Contato e retenção | Telefone ainda exigido no contrato; finalidade operacional, retenção e exclusão definitivas precisam de validação | Pendente; usar só dados fictícios |
| Regras de cancelamento/remarcação e preços | Não inventadas multas, carências ou preços finais. Valor de avaliação da fixture é placeholder, não oferta “grátis” | Pendente |
| Conteúdo/identificação e páginas legais | Endereço, contatos responsáveis, equipe, direitos de fotos e textos legais não verificados | Pendente antes de coleta real/publicação |
| SEO de lançamento | Ambiente explicitamente noindex, sem canonical/sitemap de domínio inventado; SPA mantém conteúdo dependente de JS | Domínio, conteúdo legal e migração/SSR fora desta rodada |
| Mídia legada | Outras rotas ainda têm PNGs grandes/arquivos fora do orçamento já apontados na auditoria. Não são carregados nestas telas | Não se declara conformidade de todo o repositório |

Nenhum novo módulo ou sugestão de funcionalidade fora do escopo foi implementado.

## Evidências e arquivos

Capturas reais da aplicação executada, com dados fictícios, em `evidencias/ux-2026-10-31/`. São imagens de teste local, diferentes dos protótipos da auditoria anterior.

55 verificações no roteiro principal e quatro na grade; 15 testes de unidade. Resultados brutos: [interface](evidencias/ux-2026-10-31/ux-results.json), [grade](evidencias/ux-2026-10-31/ux-week.json), [contraste](evidencias/ux-2026-10-31/contrast.json), [performance](evidencias/ux-2026-10-31/performance.json).

| Tela | Celular 375 px | Desktop 1440 px |
| --- | --- | --- |
| Home | [Captura](evidencias/ux-2026-10-31/home-375.webp) | [Captura](evidencias/ux-2026-10-31/home-1440.webp) |
| Agendamento preenchido | [Captura](evidencias/ux-2026-10-31/booking-filled-375.webp) | [Captura](evidencias/ux-2026-10-31/booking-filled-1440.webp) |
| Recepção | [Captura](evidencias/ux-2026-10-31/agenda-375.webp) | [Captura](evidencias/ux-2026-10-31/agenda-1440.webp) |

[Solicitação enviada](evidencias/ux-2026-10-31/booking-success-375.webp). Dimensões, bytes e hashes em [imagens.json](evidencias/ux-2026-10-31/imagens.json). Todas as capturas entregues são WebP abaixo de 300.000 bytes; os PNGs brutos ficam apenas nos resultados locais ignorados pelo Git.

Para repetir a automação, usar Playwright 1.62.1 com Chromium e WebKit já instalados. Os scripts aceitam `PLAYWRIGHT_MODULE` como caminho absoluto ao `index.mjs` da instalação existente e `PLAYWRIGHT_BROWSERS_PATH` para seus navegadores. Alternativamente resolvem o pacote `playwright` já disponível no ambiente. Não foi adicionado Playwright ao manifesto do produto. Com o preview aberto:

```powershell
node scripts/ux-smoke.mjs
node scripts/ux-week.mjs
node scripts/ux-contrast.mjs
node scripts/ux-performance.mjs
```

Asserções de fluxo exercitam somente a simulação local; não substituir pelos mesmos testes em produção.

Arquivos alterados ou adicionados (incluindo evidências; lista também em `evidencias/ux-2026-10-31/arquivos-alterados.txt`):

- `.gitignore`
- `frontend/index.html`
- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/components/MobileTopbar.css`
- `frontend/src/components/MobileTopbar.tsx`
- `frontend/src/components/Modal.tsx`
- `frontend/src/components/Sidebar.css`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/schedule/AgendaMobileList.tsx`
- `frontend/src/components/schedule/AgendaScheduleGrid.tsx`
- `frontend/src/features/appointments/api.ts`
- `frontend/src/index.css`
- `frontend/src/pages/dashboard/AgendaPage.css`
- `frontend/src/pages/dashboard/AgendaPage.tsx`
- `frontend/src/pages/landing/LandingPage.css`
- `frontend/src/pages/landing/LandingPage.tsx`
- `frontend/src/pages/public/PublicBookingPage.css`
- `frontend/src/pages/public/PublicBookingPage.tsx`
- `frontend/src/styles/maria-alice-theme.css`
- `frontend/vite.config.ts`
- `docs/ENTREGA-UX-2026-10-31.md`
- `docs/evidencias/ux-2026-10-31/agenda-1440.webp`
- `docs/evidencias/ux-2026-10-31/agenda-375.webp`
- `docs/evidencias/ux-2026-10-31/booking-1440.webp`
- `docs/evidencias/ux-2026-10-31/booking-375.webp`
- `docs/evidencias/ux-2026-10-31/booking-filled-1440.webp`
- `docs/evidencias/ux-2026-10-31/booking-filled-375.webp`
- `docs/evidencias/ux-2026-10-31/booking-success-375.webp`
- `docs/evidencias/ux-2026-10-31/contrast.json`
- `docs/evidencias/ux-2026-10-31/home-1440.webp`
- `docs/evidencias/ux-2026-10-31/home-375.webp`
- `docs/evidencias/ux-2026-10-31/imagens.json`
- `docs/evidencias/ux-2026-10-31/performance-diagnostico-anterior.json`
- `docs/evidencias/ux-2026-10-31/performance.json`
- `docs/evidencias/ux-2026-10-31/ux-results.json`
- `docs/evidencias/ux-2026-10-31/ux-week.json`
- `frontend/public/brand/maria-alice-logo.webp`
- `frontend/public/fonts/Inter-OFL.txt`
- `frontend/public/fonts/Playfair-Display-OFL.txt`
- `frontend/public/fonts/README.md`
- `frontend/public/fonts/inter-latin.woff2`
- `frontend/public/fonts/playfair-display-latin.woff2`
- `frontend/scripts/serve-ux.mjs`
- `frontend/scripts/ux-contrast.mjs`
- `frontend/scripts/ux-performance.mjs`
- `frontend/scripts/ux-smoke.mjs`
- `frontend/scripts/ux-week.mjs`
- `frontend/src/demo/demo.css`
- `frontend/src/demo/main.tsx`
- `frontend/src/demo/mock-api.ts`
- `frontend/src/lib/clinic-time.test.ts`
- `frontend/src/lib/clinic-time.ts`
- `frontend/src/lib/experience.ts`
- `frontend/src/pages/dashboard/AppointmentCreateForm.tsx`

- `docs/evidencias/ux-2026-10-31/arquivos-alterados.txt`

Alterações locais sem commit/push, prontas para revisão na branch indicada. O relatório de auditoria original foi preservado.
