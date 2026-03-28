import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Order } from '@/hooks/useOrdersAnalysis';

interface OrdersTableProps {
  orders: Order[];
}

const ITEMS_PER_PAGE = 10;

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, endIndex);

  const exportToCSV = () => {
    const headers = [
      'Número do Pedido',
      'Cliente',
      'Cidade',
      'Estado',
      'Status',
      'Valor da Venda',
      'Custo Total',
      'Lucro Líquido',
      'Logística',
      'Data de Criação',
    ];

    const rows = orders.map(order => [
      order['Número do Pedido'],
      order['Cliente'],
      order['Cidade do Cliente'],
      order['Estado do Cliente'],
      order['Status'],
      order['valor da venda'].toFixed(2),
      order['Custo Total'].toFixed(2),
      order['Líquido Total'].toFixed(2),
      order['Modo de Logística'],
      order['Data de Criação'],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      shipped: 'bg-green-100 text-green-800',
      wms: 'bg-blue-100 text-blue-800',
      picked: 'bg-yellow-100 text-yellow-800',
      packed: 'bg-purple-100 text-purple-800',
      waiting_expedition: 'bg-orange-100 text-orange-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading">Pedidos Detalhados</h3>
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Pedido</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cliente</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cidade</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Venda</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Custo</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Lucro</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Logística</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <tr key={index} className="border-b border-border hover:bg-secondary transition-colors">
                <td className="py-3 px-4 font-mono text-xs">{order['Número do Pedido']}</td>
                <td className="py-3 px-4 truncate">{order['Cliente']}</td>
                <td className="py-3 px-4">{order['Cidade do Cliente']}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order['Status'])}`}>
                    {order['Status']}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono">R$ {order['valor da venda'].toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-mono">R$ {order['Custo Total'].toFixed(2)}</td>
                <td className={`py-3 px-4 text-right font-mono font-semibold ${order['Líquido Total'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {order['Líquido Total'].toFixed(2)}
                </td>
                <td className="py-3 px-4 text-xs">{order['Modo de Logística']}</td>
                <td className="py-3 px-4 text-xs">{order['Data de Criação']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(endIndex, orders.length)} de {orders.length} pedidos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
