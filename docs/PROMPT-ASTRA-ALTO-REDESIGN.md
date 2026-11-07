# Prompt para o Astra Alto · Redesign da Clínica Odonto CMD

Você é responsável por design de produto e engenharia frontend na Clínica Odonto CMD. Faça uma investigação extensa e implemente um redesign de alto impacto da home, do agendamento público e da agenda da equipe. Quero uma mudança perceptível na composição, na hierarquia e na qualidade de uso. Entregue uma versão executável e verificada, acompanhada das decisões e evidências.

## Prepare a base

1. Leia as instruções do workspace, `PLANEJAMENTO-SGC.md`, `docs/REFERENCIAS-DE-DESIGN.md` e os relatórios de UX disponíveis. Inspecione o estado do Git e preserve alterações de terceiros.
2. Atualize as referências remotas e compare `origin/main` com `origin/experimentos/auditoria-ux-2026-10-31`. Use uma branch própria para o redesign. Identifique diferenças de comportamento antes de adaptar trechos. Em especial, examine o calendário em português, os cartões móveis, a agenda e o cache por sessão da main. Confirme a compatibilidade dos fluxos e os contratos da API antes de aproveitar código.
3. Rode a versão atual e capture desktop e celular. Use dados fictícios. Registre capturas, dimensões, estados da interface, gargalos e uma linha de base de desempenho. Use a simulação isolada se não houver backend de teste disponível.

## Pesquise e escolha uma direção

Consulte todas as referências abaixo. Para cada uma, registre um exemplo concreto, o princípio que ele demonstra, como ele se adapta à clínica e qual risco ou limitação deve ser considerado. Compare pelo menos duas direções visuais e escolha uma com critérios de marca, leitura, acessibilidade, velocidade e clareza das tarefas.

- [Impeccable](https://impeccable.style/) · audite hierarquia, contraste, espaçamento, consistência e caráter visual. Use a skill local quando disponível.
- [shadcn/ui Skills](https://ui.shadcn.com/docs/skills) · compare formulários, diálogos, calendário e filtros com os componentes existentes. Adote componentes pontualmente se houver benefício verificável.
- [Hallmark](https://www.usehallmark.com/) e [TasteSkill](https://www.tasteskill.dev/) · explore duas direções visuais, por exemplo editorial acolhedora e precisão clínica. Separe a linguagem pública da densidade operacional da agenda.
- [Rebrand Gallery](https://www.rebrand.gallery/) e [Minimal Gallery](https://minimal.gallery/) · encontre referências de aplicação de marca, ritmo entre seções, composição editorial e simplificação de navegação.
- [Khroma](https://www.khroma.co/) · explore neutros, dourados e cores semânticas para os temas claro e escuro. Confirme contraste no resultado real.
- [Design Spells](https://designspells.com/) · escolha microinterações que comuniquem seleção, carregamento ou transição. Inclua alternativa com movimento reduzido.
- [CTA Gallery](https://www.cta.gallery/) · estude hierarquia e redação de ações, principalmente “Agendar avaliação”.
- [UNCUT](https://uncut.wtf/) · compare tipografias considerando português, licença, legibilidade em tamanhos pequenos e peso. Troque as fontes apenas se a comparação justificar.

As skills externas da conversa anterior podem estar ausentes na máquina do Matheus porque `.agents/` é ignorada pelo Git. Consulte os sites oficiais e leia as instruções antes de rodar qualquer script externo. Preserve autoria e licença de recursos. Se uma referência estiver indisponível, registre a limitação e prossiga.

## Implemente o redesign

- **Sistema visual.** Defina tokens de cor, tipografia, espaçamento, foco e estados. Preserve o logo Maria Alice e dê a ele um fundo legível. Compare claro e escuro em telas reais, mantenha o tema escolhido após recarregar e garanta contraste sobre fotos e superfícies translúcidas. Use a transparência como tratamento pontual, com fundo alternativo legível.
- **Home.** Reestruture cabeçalho, hero, explicação da avaliação, etapas, FAQ e rodapé. Trabalhe com composição editorial, fotografia aprovada ou identificada como ilustrativa e uma ação dominante. Preserve a largura total do hero, os pontos e setas, a troca a cada 5 segundos, a pausa por mouse e teclado e o início pausado com movimento reduzido. Garanta acesso ao texto, CTA e controles nas telas testadas, inclusive 768 × 600. Em telas muito baixas ou com zoom, permita rolagem natural para preservar a leitura.
- **Agendamento público.** Reorganize serviço, profissional, data, horário, identificação e revisão para tornar o próximo passo evidente. Mostre resumo do horário escolhido e deixe claro que o envio aguarda aceite. Teste calendário nativo e calendário em português por toque e teclado. Trate disponibilidade vazia, carregamento, falha, conflito e tentativa novamente. Preserve os dados após erro, leve o foco ao aviso e ofereça “Escolher outro horário”. Valide a edição de cada etapa sem perda de contexto.
- **Agenda da equipe.** Projete primeiro para a rotina móvel. Destaque data, período e primeira consulta, agrupe filtros e mostre seleções ativas. Preserve filtros ao recarregar e navegar. Trate lista e grade de forma coerente, diferencie estados com texto e cor, ofereça ações de remarcação operáveis pelo teclado e confira contenção e retorno de foco nos diálogos. Preserve permissões e regras existentes.

Faça mudanças fortes de layout, navegação e sistema visual dentro dessas três áreas. Separe propostas que ampliem funcionalidades, coleta de dados ou integrações para aprovação. Use o stack do repositório e justifique qualquer dependência nova. Não use dados reais em demonstrações. Mantenha a distinção entre aceite, confirmação de presença e atendimento. Preserve as regras de acesso, o fuso da clínica e os contratos existentes.

## Verifique e entregue

1. Verifique 320, 375, 768, 1024 e 1440 px, uma tela baixa e uma em paisagem. Teste toque, teclado, foco, texto a 200%, movimento reduzido, contraste e estados vazios, de erro e sucesso. Identifique navegador, tamanho e o que foi simulado.
2. Meça recursos transferidos e desempenho antes/depois em condições equivalentes. Use build de produção, cache frio e rede móvel limitada. Registre mediana de pelo menos três execuções e diferencie resultados de laboratório de métricas reais. Confira os orçamentos de imagens, fontes, JS e CSS do projeto.
3. Execute build, tipos, lint e testes aplicáveis. Teste especificamente pausa do hero, conflito de horário, preservação do formulário, filtros e retorno de foco. Capture antes/depois das três áreas em desktop e celular. Indique o que exige validação com usuários, leitor de tela ou backend real.
4. Entregue a branch, instruções para rodar, decisões justificadas, comparação das duas direções, resumo das referências, evidências e pendências. Deixe o trabalho pronto para revisão. Mantenha o merge e a publicação como passos separados.
