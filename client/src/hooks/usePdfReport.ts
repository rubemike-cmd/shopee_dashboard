import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { FilterOptions } from './useOrdersAnalysis';

interface ReportMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
}

interface TopProduct {
  name: string;
  count: number;
  totalRevenue: number;
  totalProfit: number;
}

interface PdfReportOptions {
  metrics: ReportMetrics;
  filteredCount: number;
  totalCount: number;
  filters: FilterOptions;
  topProducts: TopProduct[];
  chartElementIds: string[];
}

export function usePdfReport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async (options: PdfReportOptions) => {
    const { metrics, filteredCount, totalCount, filters, topProducts, chartElementIds } = options;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Helpers ──────────────────────────────────────────────────────────
      const addPage = () => {
        pdf.addPage();
        y = margin;
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageH - margin) addPage();
      };

      const formatCurrency = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const formatDate = (d: Date) =>
        d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── Header ────────────────────────────────────────────────────────────
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, 0, pageW, 38, 'F');

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Relatório de Pedidos Shopee', margin, y + 8);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Gerado em ${formatDate(new Date())}`, margin, y + 15);

      // Active filters summary
      const activeFilters: string[] = [];
      if (filters.status?.length) activeFilters.push(`Status: ${filters.status.join(', ')}`);
      if (filters.estado?.length) activeFilters.push(`Estados: ${filters.estado.join(', ')}`);
      if (filters.logistica?.length) activeFilters.push(`Logística: ${filters.logistica.join(', ')}`);
      if (filters.dataInicio || filters.dataFim) {
        const from = filters.dataInicio ? new Date(filters.dataInicio).toLocaleDateString('pt-BR') : '—';
        const to = filters.dataFim ? new Date(filters.dataFim).toLocaleDateString('pt-BR') : '—';
        activeFilters.push(`Período: ${from} → ${to}`);
      }

      if (activeFilters.length > 0) {
        pdf.text(`Filtros ativos: ${activeFilters.join(' | ')}`, margin, y + 21);
      }

      if (filteredCount < totalCount) {
        pdf.text(`Exibindo ${filteredCount} de ${totalCount} pedidos`, margin, y + 27);
      } else {
        pdf.text(`Total: ${totalCount} pedidos`, margin, y + 27);
      }

      y = 44;

      // ── Metrics Cards ─────────────────────────────────────────────────────
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Métricas Principais', margin, y);
      y += 6;

      const cardW = (contentW - 6) / 4;
      const cards = [
        { label: 'Total de Pedidos', value: String(metrics.totalOrders), color: [59, 130, 246] as [number, number, number] },
        { label: 'Valor da Venda', value: formatCurrency(metrics.totalRevenue), color: [16, 185, 129] as [number, number, number] },
        { label: 'Lucro Líquido', value: formatCurrency(metrics.totalProfit), color: [16, 185, 129] as [number, number, number] },
        { label: 'Margem', value: `${metrics.profitMargin.toFixed(1)}%`, color: [139, 92, 246] as [number, number, number] },
      ];

      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 2);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, cardW, 20, 2, 2, 'F');
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(x, y, cardW, 20, 2, 2, 'S');

        // Color accent bar
        pdf.setFillColor(...card.color);
        pdf.roundedRect(x, y, 3, 20, 1, 1, 'F');

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text(card.label.toUpperCase(), x + 6, y + 7);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(17, 24, 39);
        pdf.text(card.value, x + 6, y + 15);
      });

      y += 26;

      // ── Charts from DOM ───────────────────────────────────────────────────
      for (const elementId of chartElementIds) {
        const el = document.getElementById(elementId);
        if (!el) continue;

        checkPageBreak(90);

        try {
          const canvas = await html2canvas(el, {
            scale: 1.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const aspectRatio = canvas.width / canvas.height;
          const imgW = contentW;
          const imgH = imgW / aspectRatio;

          checkPageBreak(imgH * 0.264 + 6);
          pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH * 0.264);
          y += imgH * 0.264 + 6;
        } catch {
          // Skip chart if capture fails
        }
      }

      // ── Top Products Table ────────────────────────────────────────────────
      checkPageBreak(60);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Top Produtos por Lucro', margin, y);
      y += 6;

      // Table header
      const colWidths = [contentW * 0.55, contentW * 0.15, contentW * 0.15, contentW * 0.15];
      const headers = ['Produto', 'Qtd', 'Receita', 'Lucro'];
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, y, contentW, 7, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99);
      let xPos = margin + 2;
      headers.forEach((h, i) => {
        pdf.text(h, xPos, y + 5);
        xPos += colWidths[i];
      });
      y += 7;

      // Table rows
      const displayProducts = topProducts.slice(0, 12);
      displayProducts.forEach((product, idx) => {
        checkPageBreak(8);
        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, y, contentW, 7, 'F');
        }
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(17, 24, 39);

        xPos = margin + 2;
        const truncName = product.name.length > 55 ? product.name.substring(0, 52) + '...' : product.name;
        pdf.text(truncName, xPos, y + 5);
        xPos += colWidths[0];
        pdf.text(String(product.count), xPos, y + 5);
        xPos += colWidths[1];
        pdf.text(formatCurrency(product.totalRevenue), xPos, y + 5);
        xPos += colWidths[2];

        // Color profit based on value
        pdf.setTextColor(product.totalProfit >= 0 ? 16 : 239, product.totalProfit >= 0 ? 185 : 68, product.totalProfit >= 0 ? 129 : 68);
        pdf.text(formatCurrency(product.totalProfit), xPos, y + 5);
        pdf.setTextColor(17, 24, 39);

        y += 7;
      });

      // ── Footer ────────────────────────────────────────────────────────────
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(156, 163, 175);
        pdf.text(
          `Shopee Dashboard  •  Página ${i} de ${totalPages}`,
          pageW / 2,
          pageH - 8,
          { align: 'center' }
        );
      }

      // Save
      const filename = `relatorio-shopee-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePdf, isGenerating };
}
