# Segunda rodada — apresentação, rodapé e navegação

31/10/2026, branch `experimentos/auditoria-ux-2026-10-31`. Entrega local, sem commit, push ou publicação. Implementação autorizada após a proposta de rodapé e usabilidade. Mantidos React/Vite e Java/Spring, sem nova dependência de produto ou mudança no backend.

## Abrir

Preview: <http://127.0.0.1:4173/>. Atualizar a aba para carregar o novo build. Servidor Node em processo oculto separado, ligado apenas a `127.0.0.1`. Se for encerrado ou o computador reiniciar, executar `npm run preview:ux` dentro de `frontend`. A barra superior pertence exclusivamente à simulação e não à interface pública final.

## O que foi implementado

- **Home:** composição com fotografia, título amplo, proporções assimétricas, hierarquia de conteúdo e detalhes em dourado. Retirado o painel que repetia o logo em grande escala. Logo original, Inter e Playfair preservados.
- **Rodapé:** marca, navegação da clínica, agendamento/ajuda e contato/informações; quatro grupos no desktop, dois no tablet e uma coluna no celular. Âncoras reais, acesso à equipe, crédito das fotos e retorno ao topo.
- **FAQ:** seis perguntas com respostas visíveis, coerentes com solicitação pendente, ausência de acompanhamento do paciente, ausência de cobrança e condição de demonstração. Não há acordeão ou componente adicional para acessar as respostas.
- **Contato:** seção explicando que os canais ainda não foram definidos. Não foram criados telefone, endereço, perfil social ou links fictícios. O link de privacidade/termos leva ao aviso sobre sua preparação; não equivale à publicação das políticas finais.
- **Fotografias:** duas imagens de ambientes odontológicos, do fotógrafo Pavel Danilyuk/Pexels, identificadas como ilustrativas. Cinco variantes locais WebP, de 16.026 a 58.110 bytes. `srcset`, `sizes`, dimensões e alternativas textuais; foto inicial prioritária e foto secundária com carregamento preguiçoso. Sem SDK, feed, iframe ou hotlink.
- **Agendamento:** ações “Alterar consulta”, “Alterar horário” e “Alterar dados” levam o foco ao controle correspondente e preservam os demais valores. Ajuda abre o FAQ em nova aba, identificada no link, sem perder a revisão. A home resolve a âncora depois de carregar sua rota. Espaço reservado na carga e ajuda exibida após a resposta inicial evitam deslocamento durante o carregamento. Acrescentados nomes de campos e ajuste de correção ortográfica no e-mail.
- **Agenda:** “Período: Dia/Semana” separado de “Visualização: Lista/Grade semanal”. Data, período, visualização, profissional e situação ficam em parâmetros de navegação para sobreviver a reload e Voltar. Datas inválidas recebem fallback. Nenhum nome, telefone ou informação clínica é acrescentado à URL. Filtros não substituem autorização do servidor.
- **Consistência:** dourado escuro nas ações principais, hover mais escuro e identificação “Área da recepção” na navegação. “Link da bio” passou a “Link de agendamento”.
- **Ajustes editoriais pontuais fora das três telas:** login identifica acesso da equipe e configuração inicial; cadastro de pacientes recebe rótulo acessível de busca e deixa de prometer “prontuário completo”. Não foram alterados cadastro, convites, campos persistidos ou permissões desses módulos.

## Imagens e terceiros

Fontes e condições de uso registradas em `frontend/public/images/README.md`. A [licença Pexels](https://www.pexels.com/license/) permite uso/adaptação em sites, com restrições como não sugerir endosso de pessoas/marcas. Foram escolhidos ambientes sem pessoas identificadas como equipe/pacientes. Créditos mantidos nas legendas. Fotografias futuras da clínica deverão substituir essas variantes com autorização e nova verificação de formato/peso.

Não foi introduzido SDK ou serviço de execução. As imagens são servidas localmente; apenas o clique voluntário no crédito navega para o Pexels. O link de crédito usa política sem referência. Não foi ativado analytics, mensageria, mapa incorporado, cobrança ou armazenamento adicional de dados pessoais. Fontes locais continuam somando 86.660 bytes.

## Validação

- Builds normal e `ux-demo`, tipos e 15 testes unitários existentes aprovados. Lint sem erros; os mesmos três avisos preexistentes de Fast Refresh.
- 55 verificações de fluxo/responsividade e quatro da grade na rodada; 23 verificações adicionais no build final. Evidências em `evidencias/visual-2026-10-31`.
- Matriz de 320, 375, 600, 768, 900, 1024, 1280 e 1440 px, paisagem 900 × 375, teclado/menu/foco, erro/conflito, cancelamento e remarcação simulados, texto 200% e reflow equivalente a zoom 200%. Chromium com fuso diferente; WebKit emulado a 375 px. Emulação não equivale a aparelho real ou Safari nativo.
- Contraste calculado sobre estilos/fundos nos seis cenários examinados: 285 ocorrências, sem falhas. Não representa certificação WCAG nem auditoria completa de todos os módulos legados.
- Testes novos verificam destinos das âncoras, imagens WebP efetivamente servidas abaixo de 300 KB, carregamento das fotos, edição por seção, preservação de dados, ajuda em nova aba, filtros ao recarregar/voltar e tratamento de parâmetros inválidos.
- Inspeção visual de home desktop, rodapé móvel, revisão móvel e agenda desktop. Sem requisições externas ou erros JavaScript nos percursos automatizados.
- Não testados nesta rodada: backend real, persistência em banco, concorrência/autorização, fluxo funcional de login/cadastro, Firefox, Edge/Safari nativos, leitor de tela ou dispositivo físico. Os testes de agendamento continuam restritos ao adaptador local identificado.

## Performance

Resultados de laboratório e condições registrados em `evidencias/visual-2026-10-31/performance.json`. Três execuções frias por rota e perfil, build de produção da simulação, gzip local, Chromium; mobile 375 × 812 com CPU 4×, latência 150 ms e download 200.000 bytes/s; desktop 1440 × 900, CPU 1×, latência 20 ms e download 1.250.000 bytes/s. A API simulada adiciona 250 ms, sem tráfego para servidor real.

| Perfil / rota | LCP mediana (mín–máx), s | FCP mediana, s | CLS mediana | Total bytes |
| --- | --- | --- | --- | --- |
| mobile / home | 1.916 (1.908–1.996) | 1.544 | 0 | 257873 |
| mobile / agendamento | 1.836 (1.76–1.848) | 1.552 | 0.003 | 225469 |
| mobile / agenda | 2.328 (2.284–2.332) | 1.536 | 0 | 232362 |
| desktop / home | 0.612 (0.596–0.64) | 0.296 | 0 | 274749 |
| desktop / agendamento | 0.588 (0.58–0.588) | 0.3 | 0.0019 | 225469 |
| desktop / agenda | 0.892 (0.88–0.892) | 0.292 | 0.0077 | 193658 |

Coleta: 2026-11-01T00:17:15.982Z. Hash do build: `7683f8af99596ab460984a5aca8ada979f5654690cdca34e2772a1f6c46a547b`. INP e dados reais não medidos. Todos os orçamentos de transferência atendidos nesta coleta. Diagnóstico anterior de deslocamento preservado em `performance-diagnostico-cls.json`. A variante compartilhável posterior altera a identificação da demonstração e permite apenas seu hostname de hospedagem adicional; estas métricas correspondem ao build local identificado.

## Avisos de feriado — proposta pendente

**Recomendação:** uma área de avisos operacionais, exibindo o comunicado vigente, em vez de um feed genérico que precise ser alimentado continuamente.

| Aspecto | Proposta |
| --- | --- |
| Problema | Visitante não sabe que a clínica estará fechada ou terá expediente excepcional |
| Benefício | Informação visível no site e antes de solicitar avaliação |
| Conteúdo mínimo | Título curto, mensagem, data de início e fim da exibição; horário de retorno quando definido |
| Publicação | Gestor autorizado publica, revisa e encerra o aviso; histórico mínimo de autoria/alterações |
| Apresentação | Faixa discreta e acessível quando houver aviso vigente; sem espaço vazio quando não houver |
| Validade | Datas no fuso da clínica e expiração automática; não deixar aviso antigo aparecendo indefinidamente |
| Relação com agenda | Bloqueio de feriado continua sendo configuração da disponibilidade. Publicar aviso não cancela nem remarca consultas automaticamente |
| Escopo | Pequeno módulo administrativo novo; fora desta rodada de apresentação |
| Dependências | Persistência, autorização no servidor, validação de datas, publicação/expiração e decisões sobre consultas já marcadas |
| Custos | Não há serviço pago proposto; esforço e custos de operação não estimados. Reaproveitar a infraestrutura existente quando a etapa for aprovada |
| Situação | **Pendente de aprovação funcional**; nenhum feed, aviso fictício de fechamento, formulário administrativo, tabela ou envio foi implementado |

Não incluir paciente, profissional associado a consulta ou outro dado pessoal no aviso público. E-mail/WhatsApp/push e notícias editoriais não fazem parte dessa proposta mínima.

## Pendências preservadas

Contatos e redes oficiais; conteúdo final de privacidade/termos e canal real de solicitações; regras de cancelamento/remarcação; portal do paciente e acompanhamento; separação funcional de presença, chegada e atendimento. O endpoint legado `/confirm` não foi alterado nem reaproveitado como confirmação de presença.

As sugestões funcionais maiores do documento de proposta permanecem pendentes. Os itens implementados nesta rodada estão listados acima. A validação de erros específica por campo retornado pelo backend e alterações nas regras de atendimento exigem contrato real e não foram simuladas como prontas.

## Reprodução

Dentro de `frontend`: `npm run build`, `npm run build:ux`, `npm run lint`, `npm test`, `npm run preview:ux`.

Com o preview aberto e o Playwright já disponível no ambiente: `node scripts/ux-smoke.mjs`, `node scripts/ux-week.mjs`, `node scripts/ux-contrast.mjs`, `node scripts/ux-refresh.mjs`, `node scripts/ux-performance.mjs`. `PLAYWRIGHT_MODULE` pode apontar para o `index.mjs` do Playwright instalado no runtime; `PLAYWRIGHT_BROWSERS_PATH` aponta para os navegadores existentes. Nenhuma dependência foi adicionada ao manifesto para esses scripts. Medições de performance devem rodar sem outros testes de navegador concorrentes.

## Capturas para revisão

- [Home — primeira tela desktop](evidencias/visual-2026-10-31/home-desktop.webp)
- [Home — página completa desktop](evidencias/visual-2026-10-31/home-full-desktop.webp)
- [Home — celular](evidencias/visual-2026-10-31/home-mobile.webp)
- [Rodapé — desktop](evidencias/visual-2026-10-31/footer-desktop.webp)
- [Rodapé — celular](evidencias/visual-2026-10-31/footer-mobile.webp)
- [Revisão do agendamento — celular](evidencias/visual-2026-10-31/booking-review-mobile.webp)
- [Agenda — desktop](evidencias/visual-2026-10-31/agenda-desktop.webp)

Capturas somente com dados fictícios. Arquivos WebP individuais abaixo de 300.000 bytes, com dimensões e hashes em `screenshots.json`. Arquivos das fotografias registrados em `media.json`.

## Arquivos desta rodada

Interface: `frontend/src/pages/landing/LandingPage.tsx` e `.css`, `frontend/src/pages/public/PublicBookingPage.tsx` e `.css`, `frontend/src/pages/dashboard/AgendaPage.tsx` e `.css`, `frontend/src/components/Sidebar.tsx`, `frontend/src/styles/maria-alice-theme.css`. Ajustes pontuais: `frontend/src/pages/auth/LoginPage.tsx` e `frontend/src/pages/dashboard/PatientsPage.tsx`.

Assets: `frontend/public/images/README.md` e cinco variantes WebP. Verificação: `frontend/scripts/ux-refresh.mjs`, seletor atualizado em `frontend/scripts/ux-week.mjs`, evidências nesta pasta e este relatório. O documento de proposta recebeu nota de atualização. A árvore contém também as alterações da primeira rodada, ainda sem commit; backend, lockfile e logo PNG original não foram alterados nesta rodada.

## Publicação compartilhável — 01/11/2026

O responsável autorizou explicitamente acesso público pelo link. Publicada a versão 1 pelo plugin Sites em https://clinica-odonto-cmd-demo.gabri10-fernandes23.chatgpt.site . Implantação `appgdep_6ae74b311aa08191b202b9df74abfe8c`, status succeeded. Projeto `appgprj_6ae744d2d040819192e73040440dc86e`.

Cópia estática separada em `../shared-preview`; repositório de hospedagem separado, commit `58a83b23a4239456020003596152d9fd8616195d`. Não houve push no repositório GitHub original nem mudança na main dele. Sem backend, segredos ou dados reais. O hostname público é explicitamente permitido no build demonstrativo por `VITE_DEMO_HOST`; o build normal não instala o adaptador. Dados simulados permanecem em sessionStorage por aba. A hospedagem pública pode gerar registros técnicos de acesso; usar somente dados fictícios. Políticas definitivas permanecem pendentes para operação real.

Empacotamento oficial executado com Node 24 do runtime do aplicativo, após falha de cópia com Node 22 no Windows. Sem troca da versão ou dependências do projeto original.

Versão pública final: **2**, commit da cópia de hospedagem `d98b80c43e1847fd0f85bd9bb7b176fa7bcf89b0`, implantação `appgdep_6ae74bb07b3481918a2371219a8fda50`, succeeded. Configurado fallback de SPA para links diretos. Verificação anônima em Chromium: home, `/agendar/demonstracao` e `/agenda` responderam HTTP 200, renderizaram seus títulos e não registraram erros JavaScript. Não é validação de backend real.
