# Auditoria inicial e plano de evolução — Clínica Odonto CMD

Data: 31/10/2026. Etapa: planejamento e revisão; sem implementação de mudanças no aplicativo.
Base examinada: commit `d8bb6e366ddd46c0c1e90950571b486af8b86fde`.
Branch de trabalho: `experimentos/auditoria-ux-2026-10-31`.

## 1. Conclusão

Há uma identidade visual aproveitável e componentes de operação já escritos. A prioridade é alinhar o produto ao MVP, tornar o agendamento central e verificar a experiência real antes de ampliar a interface. Não é necessário substituir toda a identidade.

A base atual diverge do AGENTS.md fornecido: React/Vite e Java/Spring, em vez de Next.js e Supabase Auth/RLS. Esta auditoria registra a divergência; não migra a aplicação nem considera código existente automaticamente aprovado para o MVP.

## 2. Evidências e limites

- Leitura da árvore do repositório e dos arquivos de aplicação, tema, navegação, agendamento público, agenda móvel, autenticação, integração HTTP e manifestos.
- Inspeção visual de quatro imagens de protótipos versionadas: landing_page_maria_alice_cl_nica, landing_page_maria_alice_professional, agenda_cl_nica_professional e dashboard_administrativo_professional, em `stitch_maria_alice_dental_system/stitch_maria_alice_dental_system/`.
- Imagens de protótipos são evidência de intenção visual, não screenshots da aplicação executada. As capturas de agenda/dashboard estão incompletas ou cortadas; não comprovam defeitos da aplicação atual.
- URL indicada pelo repositório: https://clinica-odonto-cmd.vercel.app/ . No acesso desta auditoria, exibiu 503 SERVICE_UNAVAILABLE / DEPLOYMENT_PAUSED.
- Os três arquivos Figma enviados recusaram sessão no conector por permissão. A tentativa pública do Appointment Calendar não forneceu uma tela utilizável. Seus layouts, componentes, licenças e comportamento móvel não foram verificados.
- A clonagem local falhou por resolução de DNS para github.com; a leitura foi realizada pelo conector GitHub. Não há clone local pronto para execução.
- Não foram executados build, lint, testes de aplicação, Lighthouse, fluxos autenticados, testes de banco, dispositivos reais ou matriz de navegadores.
- Os contrastes abaixo foram calculados pela fórmula de luminância relativa sRGB a partir das cores do CSS. Não constituem auditoria completa de cores computadas no navegador.
- A branch foi criada a partir da main. Nenhum arquivo de aplicação foi alterado; nenhuma conta, serviço pago, integração ou nova coleta foi ativada.

## 3. O que preservar

- Identidade clara com fundo quente, preto e dourado; serifa editorial na apresentação pública.
- Tokens reutilizáveis de cores, espaçamento e tipografia já existem.
- Rotas divididas com React.lazy/Suspense.
- Agenda móvel específica (`AgendaMobileList.tsx`), em vez de depender exclusivamente da grade semanal.
- Componentes de vazio, carregamento e erro, etiquetas textuais de situação e regras de foco no CSS.
- Elementos úteis de acessibilidade já escritos, como idioma pt-BR e nomes acessíveis do botão de menu.
- Separação de funcionalidades e arquivos de testes existentes. Existência não significa que foram executados ou aprovados.

## 4. Achados prioritários

Referências de linha correspondem ao commit-base, não a futuras revisões.

| Prioridade | Evidência | Consequência | Alteração proposta |
| --- | --- | --- | --- |
| P0 | LandingPage.tsx:172–181 apresenta “Ver tratamentos exclusivos” e “Nossa tecnologia”; cabeçalho leva a contato/login | A tarefa principal não tem entrada direta na home | Destacar “Agendar avaliação”, com destino real, e “Acessar meu portal”; deixar acesso da equipe identificável |
| P0 | LandingPage.tsx:350–353 usa href="#" para privacidade e termos | Páginas exigidas não são acessíveis por esses links | Criar rotas públicas e textos coerentes com a implementação e responsáveis reais pela coleta |
| P0 | LandingPage.tsx:262 e 288 traz 15 anos, credenciais e resultados comprovados; rodapé traz endereço e contatos sem verificação nesta auditoria | O case pode parecer uma clínica real com alegações não comprovadas | Validar conteúdo com os responsáveis; sinalizar demonstração e retirar alegações não verificadas |
| P0 | PublicBookingPage.tsx:87–109 mostra solicitação pendente de aceite e possível confirmação por WhatsApp | Diverge da reserva imediata prevista no planejamento | Resolver explicitamente o conflito de regra antes do redesign; não alterar só a mensagem |
| P0 | App.tsx e AuthContext.tsx modelam ADMIN, SECRETARY e DENTIST | Não evidenciam o portal autenticado do paciente exigido pelo MVP | Mapear e completar a jornada do paciente e papéis explícitos, incluindo recuperação de acesso |
| P0 | PublicBookingPage.tsx exige WhatsApp e aceita motivo livre da consulta | Finalidade de contato obrigatório está pendente; texto livre pode coletar dados de saúde | Definir minimização: justificar contato e remover/restringir observações sem uso operacional aprovado |
| P0 | PublicBookingPage.tsx:270 usa listbox contendo botões sem estado selecionado acessível correspondente | Seleção do horário pode ficar ambígua para tecnologia assistiva | Preferir grupo de radios nativos ou implementar integralmente semântica e teclado do padrão escolhido |
| P1 | LandingPage.tsx define gallery-item--hero/tall; CSS espera landing-gallery-item--hero/tall | Regras de posicionamento não encontram as classes produzidas | Unificar nomes e conferir grid em todas as larguras |
| P1 | Cards de tratamento apresentam CTA em span por hover; botão “Ver todos os casos” não possui ação no componente lido | Elementos parecem acionáveis sem realizar tarefa | Converter apenas ações do escopo em links reais; remover falsas affordances |
| P1 | Tema define botões de 40px, pequenos de 32px e menu móvel de 40px | Abaixo do alvo de projeto de 44 × 44px | Aumentar áreas de toque sem tornar toda a interface visualmente volumosa |
| P1 | Navegação móvel de equipe pode ter seis destinos e texto de 10px | Densidade alta, abreviações e risco de truncamento | Prototipar 3–4 tarefas principais e acesso secundário às demais, sem perder ações por perfil |
| P1 | CSS público reordena imagem do hero acima do texto abaixo de 1024px | Pode empurrar mensagem e agendamento para baixo no celular | Testar texto e CTA antes da imagem; encurtar hero móvel |
| P1 | overflow-x:hidden em html/body/root | Pode esconder estouros em vez de corrigi-los | Investigar largura real dos componentes, sem tratar ocultação como prova de responsividade |
| P1 | index.html contém root vazio, título/descrição globais e fontes externas | Conteúdo depende de JS; SEO por rota não está demonstrado | Na base Next.js prevista, renderizar conteúdo público no servidor e definir metadados por rota |
| P1 | AgendaMobileList e formatConfirmationDate usam formatação sem timeZone explícito | Horários podem variar com fuso do dispositivo | Padronizar America/Sao_Paulo nas exibições e testar dispositivos com fuso diferente |

Não foi realizado teste de exploração de segurança. Guardas de rota no cliente não comprovam autorização no backend. Revisão de papéis, RLS, isolamento por registro, concorrência e remarcação atômica permanece obrigatória.

### Contraste calculado

| Combinação do CSS | Razão aproximada | Avaliação |
| --- | --- | --- |
| Dourado #a68b5b sobre branco | 3,25:1 | Insuficiente para texto pequeno; também afeta branco sobre esse dourado no hover |
| Dourado #a68b5b sobre #f9f8f6 | 3,06:1 | Insuficiente para texto pequeno |
| Cinza #747878 sobre #f5f3f3 | 4,04:1 | Insuficiente para texto comum, inclusive cabeçalhos pequenos de tabela |
| Cinza #747878 sobre branco | 4,47:1 | Abaixo de 4,5:1; não arredondar como aprovação |
| Dourado escuro #755a25 sobre branco | 6,47:1 | Candidato para texto; verificar demais fundos e estados |

## 5. Direção visual proposta — pendente de validação

Manter a marca fornecida e explorar uma direção editorial acolhedora na home, com uma interface mais sóbria nas áreas operacionais.

- Home: nome e propósito claros, CTA de avaliação, serviços aprovados, equipe identificada, funcionamento/localização e políticas. Reduzir slogans abstratos e promessas de resultado.
- Agendamento: avaliação/profissional → data e horário → identificação necessária → revisão e confirmação. Preservar escolhas quando houver erro ou disputa pelo horário.
- Agenda da recepção: data, Hoje, filtros e Novo agendamento próximos; consultas com horário, paciente, profissional e situação. Confirmar presença separadamente de chegou/em atendimento/concluído.
- Dentista: agenda própria com início e conclusão do atendimento; não expor prontuário completo no P0.
- Gestão: indicadores operacionais com período e fórmulas; valores sem amostra exibem “sem dados”. Financeiro não entra automaticamente.
- Tipografia operacional: sans-serif legível, preferencialmente 14–16px nos dados e controles; campos móveis em 16px como ponto inicial de teste. Serifa reservada a títulos públicos.
- Evitar transformar cada informação em um card. Usar tabelas/listas/agenda conforme a tarefa.
- Não copiar credenciais, números, fotos de pacientes, depoimentos ou conteúdo de outros projetos.

### Tipografia para comparar

| Opção | Uso proposto | Dependências |
| --- | --- | --- |
| Inter + Playfair Display existentes | Menor mudança; manter Inter nas áreas de trabalho e reduzir uso decorativo da serifa | Verificar pesos efetivamente usados e licenças dos arquivos |
| Source Sans 3 + Source Serif 4 | Alternativa Adobe para interface e títulos editoriais | Famílias abertas; conservar licença e otimizar WOFF2 |
| Somente Source Sans 3 ou Inter no portal | Consistência, leitura de horários e menor carga tipográfica | Testar acentos, números tabulares, nomes longos e zoom |

Não é preciso assinar Adobe para usar as famílias Source pelos seus repositórios abertos. A licença de cada fonte deve ser verificada; acesso a uma fonte em aplicativo Adobe não é autorização genérica para redistribuir qualquer arquivo na web.

Fontes: [Source Sans 3](https://fonts.adobe.com/fonts/source-sans-3), [repositório Adobe Source Sans](https://github.com/adobe-fonts/source-sans), [Source Serif](https://github.com/adobe-fonts/source-serif), [Inter](https://rsms.me/inter/).

## 6. Referências e o que estudar

Curadoria de estudo, não certificação de acessibilidade ou desempenho.

| Referência | Aplicação no projeto | Limite |
| --- | --- | --- |
| [Spinosa — Behance](https://www.behance.net/gallery/178897825/Spinosa) | Case brasileiro de identidade odontológica; estudar integração da tipografia e marca | Texto do case consultado; não copiar identidade ou símbolo |
| [Dental Clinic — Branding & Website](https://www.behance.net/gallery/160051663/Dental-Clinic-Branding-Website) | Candidato a painel de referências para site e marca | Localizado na busca; página completa bloqueou acesso, análise visual pendente |
| [Tend](https://www.hellotend.com/site/home) | Clareza do caminho para reservar e organização de informação para paciente | Não transportar multiunidades, pagamentos ou modelo comercial para o MVP |
| [Typewolf](https://www.typewolf.com/) | Comparar fontes em contexto de páginas, em vez de escolher pelo nome | Licenças e custos pertencem a cada família |
| [Adobe Fonts](https://fonts.adobe.com/) | Explorar famílias, pesos e combinações com amostras em português | Verificar modalidade de licença para publicação |

### Arquivos Figma fornecidos

- [Doctor Appointments UI Kit](https://www.figma.com/design/FSJ5kvWcSupyypPcIOXN1i/Doctor-Appointments-UI-KIt--Community-?node-id=0-72): candidato a estudo do fluxo do paciente.
- [Appointment Calendar](https://www.figma.com/design/kgWIQQmgftyTOzVaVm7By2/Appointment-Calendar--Community-?node-id=102-2762): candidato a estudo da agenda.
- [DocSwift Dashboard](https://www.figma.com/design/4aVyBLRxWY8p9xbn5XQnJZ/DocSwift-Doctor-Appointment-Dashboard-Design--Community-?node-id=0-1): candidato a estudo da hierarquia gerencial.

A indicação de uso acima é uma hipótese baseada nos títulos, não avaliação dos layouts. Revisão pendente de acesso utilizável ou exportação das telas. Ser Community não dispensa a verificação da licença antes de reaproveitar assets/componentes.

## 7. Skills e ferramentas

Skills orientam o trabalho do agente; não são funcionalidades do webapp e não substituem testes. Não foram instaladas nesta auditoria.

| Recurso | Problema e benefício | Escopo, dependências e custos | Situação |
| --- | --- | --- | --- |
| [find-skills — Vercel Labs](https://github.com/vercel-labs/skills) | Encontrar orientações específicas sem instalar grandes pacotes às cegas | Ferramenta de desenvolvimento; revisar origem, comandos e permissões; nenhum plano pago ativado | Pendente |
| [web-design-guidelines](https://github.com/vercel-labs/agent-skills) | Revisão consistente de interface, acessibilidade e formulários | Complementa AGENTS.md; regras externas não ampliam escopo | Pendente |
| [vercel-react-best-practices](https://vercel.com/docs/agent-resources/skills) | Orientar carregamento, dados e renderização React/Next | Aplicar somente à versão e arquitetura efetivas; sem ganho de velocidade presumido | Pendente |
| [Supabase skills](https://supabase.com/docs/guides/ai-tools/ai-skills) | Apoiar esquema, SQL, Auth e RLS na etapa de banco | Revisão dos arquivos e testes de permissões obrigatórios; serviço tem custos próprios | Pendente |
| Integração Figma já disponível nesta sessão | Extrair referências e medidas quando houver acesso | Evitar copiar kits inteiros; não ativa plano ou créditos pagos | Uso de leitura tentado; acesso bloqueado |

Antes de adotar uma skill: conferir repositório original, licença, conteúdo de SKILL.md/scripts, permissões, telemetria e revisão utilizada. Popularidade não prova segurança. Evitar instalação global automática. Não adicionar bibliotecas de componentes ou calendário só porque aparecem numa referência.

## 8. Otimizações com relação direta ao projeto

- Preservar divisão por rota; medir os bundles para saber se dependências 3D entram em telas que não precisam delas. A presença de Three.js no manifesto não comprova carregamento inicial na home.
- O acervo contém PNGs publicados em public/odontogram de 1.588.028 e 2.408.726 bytes. São tamanhos dos arquivos versionados, não medições de transferência da home. Superam o limite individual do projeto se servidos assim.
- O logo usado pelo frontend tem 7.236 bytes; o PNG de 1.425.380 bytes na raiz não deve ser confundido com esse asset efetivamente referenciado.
- A home usa imagens remotas em googleusercontent sem variantes responsivas declaradas no JSX lido. Verificar licença, disponibilidade, formato e bytes; preferir assets controlados, WebP abaixo de 300.000 bytes e dimensões adequadas.
- Corrigir classes da galeria antes de avaliar seu layout.
- Fontes atuais usam Google Fonts com vários pesos. Selecionar somente os necessários, avaliar hospedagem local e manter fontes iniciais abaixo de 100 KB.
- Há regras de foco e adaptação; verificar a cascata completa e não presumir ausência de acessibilidade por encontrar um outline:none isolado.
- Reduzir animações quando solicitado pelo sistema; verificar o comportamento efetivo, não apenas existência de CSS.
- Nenhum analytics, gravador de sessão ou mensageria deve ser adicionado por esta revisão.
- Metas permanecem não medidas: total inicial 1,5 MB; JS comprimido 300 KB; CSS 100 KB; LCP 2,5s; CLS 0,1; INP 200ms; FCP 1,8s. Laboratório não comprova percentil 75 de usuários reais.

## 9. Isolamento de desenvolvimento e organização das contas

A branch criada contém a mesma base da main, com documentação de auditoria acrescentada separadamente. Ela isola código; não duplica banco, Auth, credenciais ou infraestrutura.

Recomendação: cada integrante usa sua conta individual. Organizar recursos dedicados ao projeto em organização/time quando o plano permitir. Se o produto for entregue a uma clínica real, definir titularidade e faturamento com ela.

| Camada | Testes | Produção futura |
| --- | --- | --- |
| GitHub | Branch de experimento e branches pequenas por tarefa | main, revisão por pull request |
| Vercel | Preview ligado à branch, após revisar configuração | Branch de produção conferida explicitamente |
| Supabase | Projeto de testes com dados fictícios e credenciais próprias | Projeto separado com credenciais próprias |
| Variáveis | Development/Preview apontam para testes | Production aponta somente para produção |
| Auth | Usuários de teste e URLs de retorno próprias | Usuários e URLs da operação real |

Não publicar um preview que herde as credenciais do banco existente sem verificar o destino. A configuração atual da Vercel usa serviços frontend/backend em containers; não foi migrada para Next.js. Não reativar a publicação pausada sem entender configuração e eventuais custos.

Contas novas com um login compartilhado não são necessárias para isolar o projeto. Um e-mail do projeto pode ser útil para contatos administrativos, desde que haja responsável pela recuperação. Convites e permissões devem ser concedidos explicitamente quando forem configurados.

### Condições consultadas em 31/10/2026

- Supabase Free: limite de dois projetos ativos, sujeito à quota dos integrantes Owner/Admin; pausa após uma semana sem atividade. Isso pode permitir testes e demonstração separados quando houver quota, sem promessa de disponibilidade permanente.
- Supabase Pro: página pública informa a partir de US$25/mês e projetos adicionais a partir de US$10/mês. Não é orçamento fechado.
- Supabase Branching tem consumo cobrado e branches não são cobertas pelo Spend Cap. Não ativar automaticamente para cada branch Git.
- Vercel Hobby é destinado a uso pessoal/não comercial. A documentação diferencia colaboração em repositórios públicos e privados; o repositório consultado é público.
- Vercel Pro aparece a US$20/mês na página pública; assentos e consumo precisam ser conferidos para a equipe e uso escolhidos.
- Nada foi contratado, nenhuma conta foi criada e nenhum banco foi provisionado.

Fontes oficiais: [Supabase billing](https://supabase.com/docs/guides/platform/billing-faq), [Supabase pricing](https://supabase.com/pricing), [Branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching), [Vercel environments](https://vercel.com/docs/deployments/environments), [Vercel variables](https://vercel.com/docs/environment-variables), [Vercel collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration), [Vercel terms](https://vercel.com/legal/terms), [Vercel pricing](https://vercel.com/pricing).

## 10. Sequência recomendada

1. Reconciliar documentação e código: stack aprovada, confirmação imediata versus aceite, identidade fictícia/real, dados obrigatórios e limites do MVP.
2. Preparar execução isolada e dados fictícios; confirmar que nenhuma URL de testes usa recursos reais.
3. Prototipar somente três telas de validação: home, agendamento do paciente e agenda da recepção, em 375 e 1440px. São parte de fluxos já previstos, não novas funcionalidades.
4. Definir tokens, estados e componentes compartilhados; revisar conteúdo e CTA antes de refinamentos decorativos.
5. Implementar por jornadas na branch, com persistência e autorização. Planejar a transição à stack definida sem reescrever tudo nesta etapa de auditoria.
6. Completar dentista e indicadores operacionais; excluir novas expansões não aprovadas do plano P0.
7. Validar 320/375/768/1024/1440px e intermediários, retrato/paisagem, teclado, foco, zoom de 200%, toque e contraste. Confirmar que tabelas/agenda tenham alternativa móvel utilizável.
8. Medir produção com três execuções equivalentes por rota (home, agendamento, agenda, dashboard), cache frio, CPU/rede limitadas e bytes por categoria. Registrar mediana, variação, navegador e build.
9. Só integrar à main após revisão e validações aplicáveis; não houve merge nesta auditoria.

## 11. Decisões pendentes

| Decisão | Problema/benefício | Impacto e dependências | Situação |
| --- | --- | --- | --- |
| Reconciliação da stack existente com Next.js/Supabase | Evitar duas arquiteturas concorrentes | Migração exige mapear dados, autenticação e contratos; esforço não estimado | Pendente de plano de execução |
| Identidade e conteúdo verificado | Preservar marca sem alegações inventadas | Responsáveis fornecem informações e direitos de imagens | Pendente |
| Confirmação imediata versus aceite | Unificar UX e regras do banco | Planejamento prevê imediata; código tem aceite; não trocar silenciosamente | Pendente de reconciliação |
| Regras de cancelamento/remarcação | Textos e validações consistentes | Decisão operacional dos responsáveis | Pendente |
| Contatos obrigatórios e observações | Minimizar coleta | Definir finalidade e retenção; não coletar conteúdo clínico no MVP | Pendente |
| Pares tipográficos e ajustes visuais | Melhorar leitura e consistência | Prototipagem e medição; sem compra aprovada | Pendente |
| Projetos/contas de infraestrutura dedicados | Isolar testes e organizar titularidade | Verificar quota, equipe, plano e faturamento antes de ativar | Pendente |
| Skills selecionadas | Tornar revisões repetíveis | Inspeção de conteúdo e instalação explícita | Pendente |

Financeiro, prontuário, odontograma, notificações, multiunidades e novas integrações continuam fora desta etapa. Sua presença no repositório é registrada, não removida nem ampliada por esta auditoria.
