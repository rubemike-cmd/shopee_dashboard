import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, RefreshCw } from "lucide-react";
import { ShopeeAdsUploaderV2 } from "./ShopeeAdsUploaderV2";
import { useShopeeAdsAnalysis, getAdPerformanceCategory, getACOSStatus, ShopeeAd } from "@/hooks/useShopeeAdsAnalysis";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { ShopeeAdsInsights } from "./ShopeeAdsInsights";

export function ShopeeAdsDashboard() {
  const [ads, setAds] = useState<ShopeeAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to fetch ads data
  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/shopeeAds.getLatestAdsData", {
        credentials: "include",
      });
      const result = await response.json();
      let adsData = result?.result?.data;
      
      // Handle superjson serialization from tRPC
      if (adsData && typeof adsData === 'object' && 'json' in adsData && Array.isArray(adsData.json)) {
        adsData = adsData.json;
      }
      
      if (Array.isArray(adsData)) {
        setAds(adsData);
      } else {
        console.warn("Invalid ads data format:", adsData);
        setAds([]);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest ads data on mount
  useEffect(() => {
    fetchAds();
  }, []);

  const metrics = useShopeeAdsAnalysis(ads);
  const filteredAds = ads.filter((ad) =>
    ad.adName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare chart data
  const performanceData = filteredAds
    .sort((a, b) => (b.roas || 0) - (a.roas || 0))
    .slice(0, 10)
    .map((ad) => ({
      name: ad.adName.substring(0, 20),
      roas: ad.roas || 0,
      acos: ad.acos || 0,
    }));

  const roasAcosData = filteredAds
    .map((ad) => ({
      name: ad.adName.substring(0, 15),
      roas: ad.roas || 0,
      acos: ad.acos || 0,
    }))
    .slice(0, 8);

  const spendRevenueData = filteredAds
    .reduce(
      (acc, ad) => {
        const existing = acc.find((item) => item.date === ad.adName);
        const revenue = (ad.spend || 0) * (ad.roas || 0);
        if (existing) {
          existing.spend = (existing.spend || 0) + (ad.spend || 0);
          existing.revenue = (existing.revenue || 0) + revenue;
        } else {
          acc.push({
            date: ad.adName.substring(0, 15),
            spend: ad.spend || 0,
            revenue: revenue,
          });
        }
        return acc;
      },
      [] as Array<{ date: string; spend: number; revenue: number }>
    );

  const statusData = [
    {
      name: "Ativo",
      value: filteredAds.filter((ad) => ad.status === "active").length,
    },
    {
      name: "Pausado",
      value: filteredAds.filter((ad) => ad.status === "paused").length,
    },
    {
      name: "Encerrado",
      value: filteredAds.filter((ad) => ad.status === "ended").length,
    },
  ];

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shopee Ads Dashboard</h2>
        <Button
          onClick={fetchAds}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights">✦ Insights</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impressões</p>
                  <p className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString()}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cliques</p>
                  <p className="text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ROAS Médio</p>
                  <p className="text-2xl font-bold">{metrics.avgROAS.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className={`p-6 ${
              metrics.avgACOS > 50
                ? "bg-red-50 border-2 border-red-300"
                : ""
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ACOS Médio</p>
                  <p className={`text-2xl font-bold ${
                    metrics.avgACOS > 50 ? "text-red-600" : ""
                  }`}>{metrics.avgACOS.toFixed(1)}%</p>
                  {metrics.avgACOS > 50 && (
                    <p className="text-xs text-red-600 mt-2">⚠️ ACOS acima do limite</p>
                  )}
                </div>
                <TrendingDown className={`w-8 h-8 ${
                  metrics.avgACOS > 50 ? "text-red-600" : "text-red-500"
                }`} />
              </div>
            </Card>
          </div>

          {/* Critical Alerts Section */}
          {filteredAds.some((ad) => (ad.acos || 0) > 75 || (ad.roas || 0) < 0.5) && (
            <Card className="p-6 bg-orange-50 border-2 border-orange-300">
              <h3 className="font-semibold mb-4 text-orange-900">🚨 Anúncios Críticos</h3>
              <div className="space-y-3">
                {filteredAds
                  .filter((ad) => (ad.acos || 0) > 75 || (ad.roas || 0) < 0.5)
                  .slice(0, 5)
                  .map((ad) => (
                    <div key={ad.id} className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ad.adName}</p>
                          <div className="flex gap-4 mt-2 text-xs">
                            {(ad.acos || 0) > 75 && (
                              <span className="text-red-600">ACOS: {ad.acos.toFixed(1)}% ⚠️</span>
                            )}
                            {(ad.roas || 0) < 0.5 && (
                              <span className="text-red-600">ROAS: {ad.roas.toFixed(2)} ⚠️</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Performance por Anúncio (Top 10)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="roas" fill="#10b981" name="ROAS" />
                  <Bar dataKey="acos" fill="#ef4444" name="ACOS" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Distribuição de Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* ROAS vs ACOS */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">ROAS vs ACOS</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={roasAcosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="roas" stroke="#10b981" name="ROAS" />
                  <Line type="monotone" dataKey="acos" stroke="#ef4444" name="ACOS" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Spend vs Revenue */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Gastos vs Receita</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#ef4444" name="Gastos" />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Receita" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
            <ShopeeAdsInsights metrics={metrics} />
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table">
          <Card className="p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome de anúncio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Anúncio</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Impressões</th>
                    <th className="px-4 py-2 text-right">Cliques</th>
                    <th className="px-4 py-2 text-right">CTR</th>
                    <th className="px-4 py-2 text-right">Conversões</th>
                    <th className="px-4 py-2 text-right">Gastos</th>
                    <th className="px-4 py-2 text-right">Receita</th>
                    <th className="px-4 py-2 text-right">ROAS</th>
                    <th className="px-4 py-2 text-right">ACOS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        Nenhum anúncio encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((ad) => (
                      <tr key={ad.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{ad.adName}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              ad.status === "active"
                                ? "bg-green-100 text-green-800"
                                : ad.status === "paused"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ad.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{ad.impressions.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{ad.clicks.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">{ad.ctr.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right">{ad.conversions.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">R$ {ad.spend.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">R$ {((ad.spend || 0) * (ad.roas || 0)).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={ad.roas >= 1 ? "text-green-600" : "text-red-600"}>
                            {ad.roas.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={ad.acos <= 50 ? "text-green-600" : "text-red-600"}>
                            {ad.acos.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Carregar Relatório de Shopee Ads</h3>
            <ShopeeAdsUploaderV2
              onSuccess={() => {
                // Refresh ads data without reloading page
                fetchAds();
              }}
              onError={(error) => {
                console.error("Upload error:", error);
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
