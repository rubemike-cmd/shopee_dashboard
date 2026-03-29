import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { ShopeeAdsUploader } from "./ShopeeAdsUploader";
import { useShopeeAdsAnalysis, getAdPerformanceCategory, getACOSStatus, ShopeeAd } from "@/hooks/useShopeeAdsAnalysis";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { ShopeeAdsInsights } from "./ShopeeAdsInsights";

export function ShopeeAdsDashboard() {
  const [ads, setAds] = useState<ShopeeAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch latest ads data
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch("/api/trpc/shopeeAds.getLatestAdsData", {
          credentials: "include",
        });
        const result = await response.json();
        if (result.result?.data) {
          setAds(result.result.data);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setIsLoading(false);
      }
    };

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
      name: ad.adName.substring(0, 30),
      roas: ad.roas || 0,
      acos: ad.acos || 0,
      spend: ad.spend || 0,
    }));

  const statusData = [
    { name: "Em Andamento", value: metrics.activeAds, color: "#10b981" },
    { name: "Pausado", value: metrics.pausedAds, color: "#6b7280" },
  ];

  const roasDistribution = filteredAds
    .reduce((acc, ad) => {
      const category = getAdPerformanceCategory(ad.roas || 0);
      const existing = acc.find((item) => item.name === category);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: category, value: 1 });
      }
      return acc;
    }, [] as Array<{ name: string; value: number }>);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ads">Anúncios</TabsTrigger>
          <TabsTrigger value="insights">✦ Insights</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Anúncios</p>
                  <p className="text-2xl font-bold">{metrics.totalAds}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.activeAds} ativos, {metrics.pausedAds} pausados
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impressões</p>
                  <p className="text-2xl font-bold">{(metrics.totalImpressions / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-gray-500 mt-1">
                    CTR: {metrics.avgCTR.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <p className="text-2xl font-bold">R$ {metrics.totalSpend.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ACOS Médio: {metrics.avgACOS.toFixed(1)}%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ROAS Médio</p>
                  <p className="text-2xl font-bold">{metrics.avgROAS.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    GMV: R$ {metrics.totalGMV.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Status dos Anúncios</h3>
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Distribuição de Performance (ROAS)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roasDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roasDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Top 10 Anúncios por ROAS</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="roas" fill="#3b82f6" name="ROAS" />
                <Bar yAxisId="right" dataKey="acos" fill="#ef4444" name="ACOS (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar anúncio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-right">Impressões</th>
                    <th className="px-4 py-2 text-right">Cliques</th>
                    <th className="px-4 py-2 text-right">CTR</th>
                    <th className="px-4 py-2 text-right">Conversões</th>
                    <th className="px-4 py-2 text-right">Gasto</th>
                    <th className="px-4 py-2 text-right">ROAS</th>
                    <th className="px-4 py-2 text-right">ACOS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{ad.adName.substring(0, 40)}</td>
                      <td className="px-4 py-2 text-right">{ad.impressions}</td>
                      <td className="px-4 py-2 text-right">{ad.clicks}</td>
                      <td className="px-4 py-2 text-right">{ad.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-2 text-right">{ad.conversions}</td>
                      <td className="px-4 py-2 text-right">R$ {ad.spend.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${
                        ad.roas >= 3 ? "text-green-600" : ad.roas >= 1 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {ad.roas.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-right font-semibold ${
                        ad.acos <= 35 ? "text-green-600" : ad.acos <= 50 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {ad.acos.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <ShopeeAdsInsights metrics={metrics} />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Carregar Relatório de Shopee Ads</h3>
            <ShopeeAdsUploader
              onUploadSuccess={() => {
                // Refresh ads data
                window.location.reload();
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
