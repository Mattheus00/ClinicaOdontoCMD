# Proposta de rodapé, identidade visual e usabilidade

Data: 31/10/2026. Branch: `experimentos/auditoria-ux-2026-10-31`.

> Atualização posterior: os responsáveis autorizaram implementar as melhorias pertinentes e usar imagens de banco. A execução, os itens atendidos e as pendências estão em [ENTREGA-VISUAL-RODAPE-2026-10-31.md](ENTREGA-VISUAL-RODAPE-2026-10-31.md). Este documento conserva a análise anterior; números de linha e situações abaixo retratam o momento da proposta.

Pedido: avaliar o rodapé da Honda enviado como referência e propor melhorias estéticas e de uso para a clínica e seu WebApp.

Esta entrega é uma pesquisa e uma proposta para revisão. Não altera telas, regras, integrações ou dados. As sugestões abaixo estão **pendentes de validação**; a preferência pelo rodapé inspirado na referência já foi expressa, mas seus canais e conteúdo ainda precisam ser definidos. As prioridades deste documento indicam ordem de trabalho, não novas etapas P1/P2 do planejamento.

## 1. Recomendação principal

Criar um rodapé público de quatro grupos curtos, precedido por uma seção de dúvidas frequentes. Aproveitar da referência a organização por assunto, o espaço entre grupos e a separação das informações legais. Preservar logo, dourado, Inter e Playfair Display da clínica.

O catálogo extenso da Honda atende a outro volume de conteúdo. Na clínica, contato e agendamento devem ser fáceis de encontrar sem atravessar dezenas de links. Não há motivo demonstrado para busca global, newsletter ou nove redes sociais nesta etapa.

O USWDS recomenda selecionar links úteis e manter apenas redes sociais efetivamente utilizadas. Essa orientação sustenta a seleção enxuta; a composição abaixo é uma decisão específica para este projeto, não uma exigência do sistema de design. [Fonte: USWDS — Footer](https://designsystem.digital.gov/components/footer/).

### Estrutura proposta para o site público

| Bloco | Conteúdo proposto | Condição para entrar |
| --- | --- | --- |
| Marca | Logo original, nome da clínica e indicação curta de demonstração | Já disponíveis; preservar o arquivo e a identidade |
| A clínica | A avaliação, Como funciona, Sobre o projeto | Âncoras reais; serviços/equipe apenas após conteúdo validado |
| Agendamento e dúvidas | Agendar avaliação, Dúvidas frequentes, Acesso da equipe | Destinos funcionais; não oferecer portal do paciente inexistente |
| Contato | Canal principal, horário de resposta e redes oficiais | Informações verificadas e responsável pelo atendimento |
| Faixa inferior | Política de Privacidade, Termos de Serviço, condição de demonstração | Links somente para páginas existentes e textos revisados |

```text
Dúvidas frequentes
Perguntas e respostas curtas sobre o fluxo realmente disponível

Logo / nome       A clínica       Agendamento e dúvidas       Contato
Demonstração      A avaliação     Agendar avaliação           Canal validado
                 Como funciona   Dúvidas frequentes           Horário validado
                 Sobre o projeto Acesso da equipe            Redes oficiais

───────────────────────────────────────────────────────────────────────────
Projeto demonstrativo                Privacidade · Termos de Serviço
```

O desenho representa a estrutura desejada. Não publicar os rótulos de conteúdo pendente como links vazios. Enquanto não houver contato validado, omitir seus botões e informar de forma breve que a demonstração não oferece atendimento real.

Desktop: quatro grupos alinhados à esquerda dentro da mesma largura do conteúdo. Tablet: duas colunas conforme espaço. Celular: grupos empilhados, sem esconder contato e agendamento. Com poucos links, listas abertas são mais simples que menus expansíveis. Usar contraste, foco visível e alvos de toque de 44 × 44 px como critérios do projeto.

No formulário de agendamento, usar uma versão compacta com ajuda e informações legais, evitando multiplicar saídas durante o preenchimento. Na agenda e demais áreas internas, manter navegação de trabalho e ajuda em posição previsível; o rodapé institucional completo não precisa ocupar todas as telas. A W3C orienta consistência na posição relativa de mecanismos de ajuda repetidos em um conjunto de páginas. [Fonte: WCAG 2.2 — Consistent Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html).

## 2. Quais canais fazem sentido

Todas as opções desta tabela estão pendentes. “Não recomendado agora” é recomendação da análise, não rejeição já feita pelos responsáveis.

| Opção | Problema e benefício | Impacto no escopo | Dependências e custos conhecidos | Recomendação |
| --- | --- | --- | --- | --- |
| Telefone e e-mail | Falta de caminho para dúvidas; permite contato direto | Conteúdo e links do site público | Canal real, responsável e horário; custos do canal não verificados | Prioridade alta quando houver operação/canal válido |
| WhatsApp por link | Facilita contato a quem utiliza o aplicativo | Destino externo; não exige automação nem API no site | Número autorizado, capacidade de atendimento e revisão de privacidade; não estimado | Candidato a canal principal, sujeito à decisão operacional |
| Instagram | Apresentação institucional e comunicação visual | Link externo simples | Perfil oficial ativo e responsável editorial; custo de manutenção não estimado | Primeira rede a avaliar, sem presumir que o público já a usa |
| Facebook | Alternativa se já fizer parte da comunicação da clínica | Link externo simples | Perfil oficial ativo e evidência de uso pelo público | Incluir somente se houver utilidade real |
| YouTube | Conteúdo explicativo existente | Link externo; vídeos incorporados exigem revisão própria | Canal e conteúdo aprovado, manutenção e orçamento de mídia | Opcional; não criar vídeos só para preencher o rodapé |
| TikTok, X, Threads, Pinterest, LinkedIn | Mais canais, sem necessidade demonstrada no fluxo atual | Mais conteúdo e manutenção | Estratégia editorial e perfis oficiais | Não recomendado agora |
| Localização / Como chegar | Ajuda a planejar a visita | Conteúdo público e eventual link de mapa | Endereço verificado; demonstração não pode apontar para terceiros | Importante para operação real; pendente no case |
| Formulário de contato | Centraliza pedidos | Novo fluxo de coleta, armazenamento e atendimento | Destino, retenção, proteção contra abuso e tratamento dos pedidos | Adiar; avaliar primeiro os canais diretos |
| Newsletter, chatbot e busca global | Não resolvem uma necessidade demonstrada desta versão | Novos fluxos, integrações ou indexação | Custos, manutenção e possível coleta adicional não avaliados | Não recomendado agora |

Para redes aprovadas: ícone acompanhado do nome, destino real e nome acessível. Preferir links simples a feeds, botões de compartilhamento com SDK e mapas incorporados. Não colocar nome, telefone ou informação de saúde do paciente em mensagens pré-preenchidas ou parâmetros de URL. Não há instalação ou contratação proposta nesta entrega.

## 3. Dúvidas frequentes propostas

Usar o título “Dúvidas frequentes”, mais explícito que apenas “FAQ”. Começar com seis respostas breves, sem uma nova central de atendimento. Para esse volume, prefiro perguntas e respostas visíveis; avaliar acordeões apenas se o conteúdo crescer e os testes mostrarem benefício. Informações decisivas para enviar o pedido continuam junto do formulário. O GOV.UK alerta que acordeões escondem conteúdo e não devem guardar informação que todos precisam ler. [Fonte: Accordion](https://design-system.service.gov.uk/components/accordion/).

Rascunhos coerentes com a simulação atual, ainda sujeitos à revisão editorial:

1. **Como solicito uma avaliação?** Escolha o serviço, profissional, data e horário disponíveis. Preencha a identificação, revise e envie a solicitação.
2. **O horário fica confirmado ao enviar?** Não. Nesta versão, a solicitação fica aguardando aceite da equipe. O envio não confirma o atendimento.
3. **Posso acompanhar meu pedido pelo site?** Esta demonstração ainda não oferece uma área do paciente para acompanhar solicitações. Não prometer aviso por WhatsApp ou e-mail.
4. **Existe pagamento pelo site?** Esta demonstração não realiza cobranças nem pagamentos online. Não apresentar preço final ou avaliação gratuita sem aprovação.
5. **Posso cancelar ou remarcar?** Nesta demonstração, a recepção pode testar essas ações na agenda. Não há autoatendimento do paciente; a política de prazos ainda precisa ser definida antes de uso real.
6. **Este site oferece atendimento real?** Não. É uma clínica fictícia para demonstração. Use somente dados fictícios, sem informações de saúde.

“Como entrar em contato?” entra como pergunta adicional somente quando existir um canal válido. Não inventar telefone, prazo de resposta, endereço, convênio aceito ou profissional responsável.

## 4. Melhorias verificadas no projeto

Revisão de código e das capturas existentes de home, formulário e agenda, produzidas na rodada anterior. Os caminhos e linhas a seguir são da árvore de trabalho atual; não representam um novo teste de navegador.

| Evidência | Problema | Proposta e benefício |
| --- | --- | --- |
| `frontend/src/pages/landing/LandingPage.tsx:24` | “Acompanhe o aceite” sugere um caminho de acompanhamento que o paciente não tem | Trocar por “Aguarde o aceite da equipe” e explicar a limitação no FAQ; alinha expectativa ao fluxo |
| `frontend/src/pages/landing/LandingPage.tsx:206` | Rodapé concentra acessos e avisos, sem ajuda organizada | Aplicar os grupos propostos e FAQ; permite encontrar respostas ao final da página |
| `frontend/src/pages/landing/LandingPage.css:275` | Painel de marca ocupa ao menos 400 px no desktop e repete o logo | Reduzir a área decorativa e melhorar a proporção com o texto; preservar a marca e dar mais espaço ao conteúdo útil |
| `frontend/src/styles/maria-alice-theme.css:12` e `frontend/src/pages/landing/LandingPage.css:105` | Ação principal preta no aplicativo e dourada na home | Definir um padrão compartilhado: dourado escuro para ação principal, contorno para secundária, vermelho para ação destrutiva; conferir estados antes de aplicar |
| `frontend/src/pages/dashboard/AgendaPage.tsx:374` e `:415` | Dois botões “Semana” controlam período e visualização | Mostrar “Período: Dia / Semana” e “Visualização: Lista / Grade”; informar que a grade mostra a semana |
| `frontend/src/pages/public/PublicBookingPage.tsx:368` | “Editar escolhas” retorna à etapa inteira | Oferecer “Alterar horário” e “Alterar dados”, levando foco à seção correta e preservando o restante |
| `frontend/src/pages/public/PublicBookingPage.tsx:382` | Falhas de envio têm mensagem geral; o formulário usa validação nativa de campos | Associar erros de campo retornados pelo servidor ao controle correspondente; resumo com links quando houver vários erros |
| `frontend/src/components/Sidebar.tsx:69` | “Link da bio” depende do vocabulário de redes sociais | Usar “Link de agendamento”; objetivo mais claro para a recepção |
| `frontend/src/components/Sidebar.tsx:93` | Recepção aparece como “Portal de gestão” | Identificar a área pelo papel efetivo, sem sugerir poderes que o usuário não possui |
| `frontend/src/pages/auth/LoginPage.tsx:166` | “Cadastre sua clínica” sugere plataforma para várias clínicas | Revisar o acesso como equipe de uma única unidade; não alterar cadastro/convites sem conferir o contrato |
| `frontend/src/pages/dashboard/PatientsPage.tsx:63` | Busca possui placeholder, mas não rótulo explícito ou `aria-label` | Adicionar “Buscar paciente” como rótulo persistente; melhora identificação quando o campo está preenchido |
| `frontend/src/pages/dashboard/PatientsPage.tsx:55` e `:150` | Texto promete prontuário completo e formulário inclui CPF/data de nascimento | Revisar aderência ao MVP e justificar cada campo; não ampliar a coleta só por já existir no legado |

Na revisão, usar padrões para conferir e alterar respostas sem repetir todo o preenchimento. Em erros de validação, mensagens junto do campo e um resumo navegável ajudam a localizar o problema. [GOV.UK — Check answers](https://design-system.service.gov.uk/patterns/check-answers/), [Error summary](https://design-system.service.gov.uk/components/error-summary/).

### Direção estética

- Manter Inter nos controles, textos e dados; Playfair nos títulos institucionais. Evitar títulos decorativos nos controles da agenda.
- Reutilizar branco `#ffffff`, fundo `#f9f8f6`, texto `#1b1c1c`, secundário `#515353`, dourado funcional `#755a25` e dourado decorativo `#a68b5b`. A paleta é proposta de consistência; todas as combinações e estados precisam ser verificados na implementação.
- Não recolorir o logo para corrigir o contraste dos demais elementos. Legibilidade dos controles é uma responsabilidade separada.
- Hierarquia de espaçamento em múltiplos de 4/8 px; menos intervalos decorativos em telas operacionais. Títulos, campos e botões com alinhamentos repetíveis.
- No rodapé, fundo claro, divisores discretos e títulos de grupo em Inter. A faixa legal pode usar o grafite já existente; evitar outra grande seção escura imediatamente após a atual seção institucional escura.
- Se houver foto futura, usar material aprovado ou ilustração claramente demonstrativa. Não simular equipe real, depoimentos ou resultados. Foto não é dependência para esta melhoria.
- Preservar recursos já presentes: revisão antes do envio, lista móvel, foco visível, radios nativos, estados de erro/vazio e fontes locais. Não refazer o que já atende à tarefa.

## 5. Melhorias por perfil e ordem recomendada

Todos os itens abaixo: **pendentes de validação**. Não são promessas de funcionalidade disponível. Ajustes fora das três telas iniciais exigem escolha da próxima etapa; analisar todos os perfis não autoriza implementar todo o backlog.

| Ordem / público | Problema → benefício | Escopo | Dependências e custos |
| --- | --- | --- | --- |
| 1 — Todos | Nomes, botões e seções inconsistentes → reconhecimento entre telas | Ajustes visuais/editoriais, rodapé e FAQ nas telas atuais | Revisão de conteúdo e QA; sem novo serviço externo previsto |
| 1 — Visitante/paciente | Falta de canal e regras publicadas → sabe como pedir ajuda e o que acontecerá | Informações públicas, termos e privacidade já exigidos no MVP | Responsável, contatos, política e textos aprovados; revisão não orçada |
| 1 — Recepção | “Semana” duplicado e papel pouco claro → distingue filtros, formato e permissões | Rótulos e agrupamento da agenda e navegação | Sem mudança de banco para os rótulos; testar teclado e celular |
| 2 — Paciente | Alterar um detalhe exige voltar à etapa inteira → correção localizada | Navegação dentro do formulário atual | Sem nova coleta ou API; preservar respostas e gerir foco |
| 2 — Paciente | Mensagens gerais nem sempre indicam o campo → recuperação mais direta | Validação e apresentação de erros | Contrato de erros do servidor; não inventar causa nem expor detalhes internos |
| 2 — Recepção | Filtros somem ao sair/voltar → retoma o trabalho com o mesmo contexto | Preservar data, período, profissional e situação | Usar parâmetros não sensíveis ou estado da navegação; não colocar nomes/contatos de pacientes em URL |
| 2 — Recepção | Cancelamento/remarcação podem ser confundidos → revisão contextual antes da ação | Melhorar os diálogos existentes com paciente, data e horário anterior/novo | Manter transação e autorização reais; não prometer desfazer sem suporte no servidor |
| 3 — Dentista | Visão precisa acompanhar seu trabalho → agenda própria e ações do atendimento por situação | Fluxo já previsto no MVP, fora da rodada visual inicial | Alinhar estados e permissões no backend; “iniciar/concluir” não é só desenhar botões |
| 3 — Gestor | Visão deve orientar a operação → período visível, fórmulas e dados verificáveis | Dashboard operacional previsto; não expandir financeiro | Integração com registros persistidos; mostrar “sem dados” quando necessário |
| 3 — Paciente | Não existe acompanhamento autenticado → consulta os próprios pedidos | Lacuna funcional do MVP, fora desta proposta de rodapé | Autenticação, autorização, persistência e política de cancelamento/remarcação; trabalho não estimado |
| 3 — Todos | Legado de cadastro e módulos diverge do planejamento → navegação coerente com uma clínica | Revisão das telas adicionais antes de expandir o teste | Decisão de etapa e revisão de contratos; não remover módulos preexistentes silenciosamente |

Ponto crítico: `backend/src/main/java/com/dentic/api/appointment/web/AppointmentController.java:175` expõe `/confirm`; o código cria pagamento `PAID` e conclui atendimento. Não reutilizar essa ação como “Confirmar presença”. Esse conflito já estava documentado na entrega anterior e exige ajuste funcional separado. Uma melhoria visual não resolve a diferença de regras.

## 6. Como verificar a próxima implementação

1. Visitante encontra avaliação, dúvida sobre confirmação e acesso da equipe sem orientação externa.
2. Paciente identifica que o pedido está pendente, corrige só o horário e recupera uma falha sem redigitar os demais dados.
3. Recepção distingue período de visualização, filtra pedidos e revisa o horário antigo/novo antes de remarcar.
4. Quando as respectivas áreas forem implementadas, dentista acessa apenas sua agenda autorizada e gestor interpreta ocupação sem confundir agendamentos com receita.
5. Verificar 320, 375, 768, 1024 e 1440 px e intermediários, teclado, leitor de tela, foco, zoom/texto 200%, toque e contraste. Testar navegador/dispositivo real quando disponível e registrar limites.
6. Repetir medições nas rotas alteradas, três execuções equivalentes, build de produção e cache frio. Manter os orçamentos já definidos; sem feeds de terceiros na abertura.
7. Realizar sessões com representantes dos perfis, usando dados fictícios: registrar conclusão das tarefas, erros, dúvidas e ajuda necessária. A pesquisa aqui é uma avaliação fundamentada, não prova de intuitividade nem teste com usuários.

## 7. Base e limites da pesquisa

Foram consultados a imagem da Honda enviada pelo usuário, código local, planejamento e relatório/capturas da entrega anterior. Referências externas: USWDS Footer, W3C Consistent Help, GOV.UK Accordion, Check answers e Error summary, além das [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), consultadas em 31/10/2026. As recomendações específicas para canais, estética e prioridades são inferências de projeto, não dados de preferência do público.

A referência Honda foi analisada como imagem, sem afirmar auditoria do site da empresa. Não foram feitos novos testes de aplicação, medição de performance, pesquisa com pacientes ou validação jurídica nesta rodada. Nenhum SDK foi adicionado e nenhuma coleta ou integração foi ativada. Documento conferido por leitura, consistência com o código e referências. Não houve publicação, commit ou push.
