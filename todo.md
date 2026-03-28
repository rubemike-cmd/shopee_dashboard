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
