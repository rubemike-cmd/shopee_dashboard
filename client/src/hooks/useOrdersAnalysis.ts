import { useMemo } from 'react';
import { orders as defaultOrdersData } from '@/data/orders';

export interface Order {
  'Número do Pedido': number;
  'Número do Pedido no Canal': string;
  'Cliente': string;
  'Email do Cliente': string | null;
  'Telefone do Cliente': string;
  'Endereço do Cliente': string;
  'Cidade do Cliente': string;
  'Estado do Cliente': string;
  'CEP do Cliente': string;
  'Canal': string;
  'Empresa': string;
  'Status': string;
  'Custo Total': number;
  'valor da venda': number;
  'Líquido Total': number;
  'Modo de Logística': string;
  'Produtos': string;
  'Data de Criação': string;
  'Data de Atualização': string;
}

export interface FilterOptions {
  status?: string[];
  estado?: string[];
  logistica?: string[];
  dataInicio?: string;
  dataFim?: string;
}

export function useOrdersAnalysis(filters: FilterOptions = {}, externalOrders?: Order[]) {
  const ordersData = externalOrders ?? (defaultOrdersData as Order[]);

  // Normalize state names: "S\u00c3O PAULO" → "SP", "RIO DE JANEIRO" → "RJ", etc.
  const STATE_NORMALIZE: Record<string, string> = {
    'S\u00c3O PAULO': 'SP',
    'SAO PAULO': 'SP',
    'RIO DE JANEIRO': 'RJ',
    'MINAS GERAIS': 'MG',
    'BAHIA': 'BA',
    'PARAN\u00c1': 'PR',
    'PARANA': 'PR',
    'RIO GRANDE DO SUL': 'RS',
    'SANTA CATARINA': 'SC',
    'PERNAMBUCO': 'PE',
    'CEAR\u00c1': 'CE',
    'CEARA': 'CE',
    'GOIS': 'GO',
    'GOI\u00c1S': 'GO',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'ESP\u00cdRITO SANTO': 'ES',
    'ESPIRITO SANTO': 'ES',
    'AMAZONAS': 'AM',
    'PAR\u00c1': 'PA',
    'PARA': 'PA',
    'MARANH\u00c3O': 'MA',
    'MARANHAO': 'MA',
    'PIAU\u00cd': 'PI',
    'PIAUI': 'PI',
    'RIO GRANDE DO NORTE': 'RN',
    'PARA\u00cdBA': 'PB',
    'PARAIBA': 'PB',
    'ALAGOAS': 'AL',
    'SERGIPE': 'SE',
    'ROND\u00d4NIA': 'RO',
    'RONDONIA': 'RO',
    'ACRE': 'AC',
    'RORAIMA': 'RR',
    'AMAP\u00c1': 'AP',
    'AMAPA': 'AP',
    'TOCANTINS': 'TO',
    'DISTRITO FEDERAL': 'DF',
  };

  const normalizeState = (s: string) => {
    const upper = s.trim().toUpperCase();
    return STATE_NORMALIZE[upper] ?? s.trim();
  };

  const filteredOrders = useMemo(() => {
    let orders = [...ordersData] as Order[];

    if (filters.status && filters.status.length > 0) {
      orders = orders.filter(o => filters.status!.includes(o.Status));
    }

    if (filters.estado && filters.estado.length > 0) {
      orders = orders.filter(o => filters.estado!.includes(normalizeState(o['Estado do Cliente'])));
    }

    if (filters.logistica && filters.logistica.length > 0) {
      orders = orders.filter(o => filters.logistica!.includes(o['Modo de Logística']));
    }

    if (filters.dataInicio) {
      orders = orders.filter(o => o['Data de Criação'] >= filters.dataInicio!);
    }

    if (filters.dataFim) {
      orders = orders.filter(o => o['Data de Criação'] <= filters.dataFim!);
    }

    return orders;
  }, [filters]);

  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o['valor da venda'], 0);
    const totalCost = filteredOrders.reduce((sum, o) => sum + o['Custo Total'], 0);
    const totalProfit = filteredOrders.reduce((sum, o) => sum + o['Líquido Total'], 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      avgOrderValue,
      profitMargin,
    };
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredOrders.forEach(order => {
      distribution[order.Status] = (distribution[order.Status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: (count / filteredOrders.length) * 100,
    }));
  }, [filteredOrders]);

  const stateDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const state = normalizeState(order['Estado do Cliente']);
      distribution[state] = (distribution[state] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([state, count]) => ({
        name: state,
        value: count,
        percentage: (count / filteredOrders.length) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const logisticsDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredOrders.forEach(order => {
      distribution[order['Modo de Logística']] = (distribution[order['Modo de Logística']] || 0) + 1;
    });
    return Object.entries(distribution).map(([logistics, count]) => ({
      name: logistics,
      value: count,
      percentage: (count / filteredOrders.length) * 100,
    }));
  }, [filteredOrders]);

  const revenueByDate = useMemo(() => {
    const byDate: Record<string, { revenue: number; profit: number; count: number }> = {};
    filteredOrders.forEach(order => {
      const date = order['Data de Criação'];
      if (!byDate[date]) {
        byDate[date] = { revenue: 0, profit: 0, count: 0 };
      }
      byDate[date].revenue += order['valor da venda'];
      byDate[date].profit += order['Líquido Total'];
      byDate[date].count += 1;
    });

    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        profit: data.profit,
        orders: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const products: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const productList = order['Produtos'].split(',');
      productList.forEach(product => {
        const cleanProduct = product.trim().split(' (')[0];
        products[cleanProduct] = (products[cleanProduct] || 0) + 1;
      });
    });

    return Object.entries(products)
      .map(([product, count]) => ({
        name: product,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredOrders]);

  const productProfitability = useMemo(() => {
    const products: Record<string, { totalProfit: number; totalRevenue: number; count: number }> = {};
    
    filteredOrders.forEach(order => {
      const productList = order['Produtos'].split(',');
      const liquidProfit = order['Líquido Total'];
      const revenue = order['valor da venda'];
      const numProducts = productList.length || 1;
      
      productList.forEach(product => {
        const cleanProduct = product.trim();
        if (!products[cleanProduct]) {
          products[cleanProduct] = { totalProfit: 0, totalRevenue: 0, count: 0 };
        }
        // Distribute revenue/profit proportionally among products in the same order
        products[cleanProduct].totalProfit += liquidProfit / numProducts;
        products[cleanProduct].totalRevenue += revenue / numProducts;
        products[cleanProduct].count += 1;
      });
    });

    return Object.entries(products)
      .map(([name, data]) => ({
        name: name.split(' (')[0].substring(0, 40),
        totalProfit: data.totalProfit,
        totalRevenue: data.totalRevenue,
        avgProfit: data.totalProfit / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 12);
  }, [filteredOrders]);

  const uniqueStates = useMemo(() => {
    const states = new Set((ordersData as Order[]).map(o => normalizeState(o['Estado do Cliente'])));
    return Array.from(states).sort();
  }, []);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set((ordersData as Order[]).map(o => o.Status));
    return Array.from(statuses).sort();
  }, []);

  const uniqueLogistics = useMemo(() => {
    const logistics = new Set((ordersData as Order[]).map(o => o['Modo de Logística']));
    return Array.from(logistics).sort();
  }, []);

  return {
    filteredOrders,
    metrics,
    statusDistribution,
    stateDistribution,
    logisticsDistribution,
    revenueByDate,
    topProducts,
    productProfitability,
    uniqueStates,
    uniqueStatuses,
    uniqueLogistics,
  };
}
