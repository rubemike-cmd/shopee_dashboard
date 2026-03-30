# Shopee Dashboard - TODO

## Filtros Otimizados
- [x] Redesenhar barra de filtros com layout compacto e visual moderno
- [x] Adicionar seletor de intervalo de datas (data início / data fim) com calendário
- [x] Adicionar botão "Limpar filtros" que reseta todos os filtros de uma vez
- [x] Exibir contador de pedidos filtrados vs total na barra de filtros
- [x] Mostrar chips/tags dos filtros ativos para fácil visualização

## Metas Personalizáveis
- [x] Criar tabela `goals` no banco de dados para persistir metas
- [x] Criar endpoint tRPC para salvar e buscar metas
- [x] Criar modal/painel de edição de metas com campos de receita e lucro (semanal e mensal)
- [x] Atualizar aba "Metas" para usar metas salvas no banco
- [x] Exibir indicador de metas personalizadas vs padrão

## Relatório PDF
- [x] Instalar biblioteca de geração de PDF (jsPDF + html2canvas)
- [x] Criar hook usePdfReport com layout otimizado para impressão
- [x] Incluir métricas principais, gráficos e tabela de top produtos no PDF
- [x] Adicionar botão "Exportar PDF" visível no cabeçalho do dashboard
- [x] Incluir filtros ativos e período no cabeçalho do relatório

## Aba de Insights com Mentor IA
- [x] Criar endpoint tRPC `insights.generate` que recebe métricas resumidas e chama LLM
- [x] Criar prompt de sistema com persona de mentor experiente em e-commerce
- [x] Criar componente `InsightsPanel.tsx` com layout de mentor (avatar, cards de insights, categorias)
- [x] Adicionar aba "Insights" no Dashboard com botão de regenerar análise
- [x] Exibir insights categorizados: pontos fortes, alertas, oportunidades e recomendações
- [x] Mostrar estado de carregamento com skeleton durante geração
- [x] Escrever testes para o endpoint de insights

## Melhorias de Visualização e Metas
- [x] Substituir pizza de "Distribuição por Status" por pizza de "Rentabilidade por Produto" na Visão Geral
- [x] Pizza de rentabilidade: cada fatia = faturamento do produto; tooltip mostra faturamento + lucro acumulado
- [x] Manter seção "Rentabilidade por Produto (Top 12)" com barras horizontais
- [x] Aba Metas: vincular meta semanal × 4 = meta mensal (e vice-versa) automaticamente
- [x] Aba Metas: ao digitar lucro, calcular faturamento automaticamente pela margem real do período
- [x] Aba Metas: ao digitar faturamento, calcular lucro automaticamente pela margem real do período
- [x] Exibir margem atual (%) usada como base para os cálculos automáticos

## Melhorias de Gráficos, Dados e Busca
- [x] Normalizar "SÃO PAULO" → "SP" no hook useOrdersAnalysis para unificar estados
- [x] Adicionar campo de busca por produto na aba Pedidos (filtro em tempo real)
- [x] Gráfico Receita por Data: toggle entre visualização diária e acumulada
- [x] Gráfico Receita por Data: adicionar calendário interativo para selecionar intervalo de datas diretamente no gráfico


## Seção Completa de Shopee Ads
- [x] Criar schema de banco para armazenar dados de Shopee Ads
- [x] Criar router de upload e processamento de CSV de Shopee Ads
- [x] Criar componente de upload com validação de colunas
- [x] Implementar KPIs principais: Impressões, Cliques, CTR, Conversões, ROAS, ACOS
- [x] Criar gráficos: Performance por anúncio, CTR vs Conversão, ROAS vs ACOS, Gastos vs Receita
- [x] Implementar tabela de anúncios com filtros e ordenação
- [x] Criar endpoint de insights de Shopee Ads com LLM
- [x] Integrar aba de Shopee Ads ao dashboard com todas as funcionalidades
- [x] Escrever testes para routers e validações de Shopee Ads

## Bug Fixes - Shopee Ads Upload
- [x] Corrigir bug: dados de Shopee Ads não eram persistidos no banco após upload bem-sucedido
- [x] Implementar persistência no shopeeAdsRouterV2: inserir em shopee_ads_uploads e shopee_ads_data
- [x] Garantir que fetchAds() recupera dados do banco após upload (sem necessidade de reload)
- [x] Adicionar testes para shopeeAdsRouterV2 com persistência
- [x] Validar fluxo completo com arquivo CSV real do usuário

## Melhorias Sugeridas - Shopee Ads
- [x] Adicionar alertas ACOS: destacar anúncios com ACOS acima de um limite configurável
- [x] Implementar histórico de uploads: mostrar data/hora de cada upload e permitir comparação
- [ ] Adicionar comparação de períodos: visualizar mudanças de ROAS/ACOS entre uploads
- [ ] Criar dashboard de tendências: gráfico de evolução de ROAS e ACOS ao longo do tempo
- [ ] Implementar recomendações automáticas: pausar anúncios com ACOS muito alto
