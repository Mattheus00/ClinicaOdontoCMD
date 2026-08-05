# Supabase/PostgreSQL

Este backend continua responsável por autenticação, autorização e isolamento por clínica. O Supabase será usado como PostgreSQL gerenciado; o frontend não deve receber `service_role`, senha do banco ou acesso direto às tabelas clínicas.

## Configuração

1. Crie ou selecione um projeto Supabase.
2. Em **Connect**, copie a string do **Session Pooler** (porta `5432`), apropriada para este backend Spring persistente. Use SSL.
3. Copie `backend/.env.supabase.example` para um cofre de segredos ou variáveis do ambiente e preencha os valores reais.
4. Na primeira inicialização deste projeto, mantenha `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`: o schema foi aplicado via MCP e o Flyway registrará o baseline 13 sem reaplicar V1â€“V13. Para novos ambientes sem schema prévio, remova essa variável para que o Flyway aplique todas as migrações normalmente. O Hibernate apenas validará o schema.

Não use o Transaction Pooler (porta `6543`) neste backend sem configurar o driver para não usar prepared statements. Reserve a conexão direta para migrações administrativas e backup.

## Proteção dos dados

A migração `V12__supabase_data_api_lockdown.sql` revoga acesso de `anon` e `authenticated` e ativa RLS nas tabelas clínicas. Isso é intencional: todos os acessos passam pela API Spring usando a conexão privada do banco. Não crie políticas permissivas para `authenticated` sem uma regra de clínica e de papel explícita.

## Validação após conectar

Execute o backend com o profile `supabase`, confirme que o Flyway alcançou a versão 12 e faça login pela aplicação. Em seguida, rode os Database Advisors no Dashboard/MCP e corrija qualquer alerta antes de liberar produção.
