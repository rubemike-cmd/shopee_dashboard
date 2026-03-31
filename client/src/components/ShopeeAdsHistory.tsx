import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface UploadHistory {
  id: number;
  uploadedAt: Date;
  avgROAS: number;
  avgACOS: number;
  totalAds: number;
  totalImpressions: number;
  totalClicks: number;
}

export function ShopeeAdsHistory() {
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: historyData, isLoading: queryLoading } = trpc.shopeeAdsInsights.getUploadHistory.useQuery();

  useEffect(() => {
    if (historyData && Array.isArray(historyData)) {
      setHistory(historyData as UploadHistory[]);
    }
    setIsLoading(queryLoading);
  }, [historyData, queryLoading]);

  // Prepare chart data
  const chartData = history
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((item) => ({
      date: new Date(item.uploadedAt).toLocaleDateString("pt-BR", {
        month: "short",
        day: "numeric",
      }),
      roas: item.avgROAS,
      acos: item.avgACOS,
      impressions: item.totalImpressions,
      clicks: item.totalClicks,
    }));

  // Calculate trends
  const latestUpload = history[history.length - 1];
  const previousUpload = history[history.length - 2];

  const roasTrend = latestUpload && previousUpload
    ? ((latestUpload.avgROAS - previousUpload.avgROAS) / previousUpload.avgROAS) * 100
    : 0;

  const acosTrend = latestUpload && previousUpload
    ? ((previousUpload.avgACOS - latestUpload.avgACOS) / previousUpload.avgACOS) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Trend Cards */}
      {history.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variação ROAS</p>
                <p className="text-2xl font-bold">{roasTrend.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {latestUpload?.avgROAS.toFixed(2)}x vs {previousUpload?.avgROAS.toFixed(2)}x
                </p>
              </div>
              {roasTrend >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variação ACOS</p>
                <p className="text-2xl font-bold">{acosTrend.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {latestUpload?.avgACOS.toFixed(1)}% vs {previousUpload?.avgACOS.toFixed(1)}%
                </p>
              </div>
              {acosTrend >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <Card className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <p>Carregando histórico...</p>
        </Card>
      ) : history.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-600">Nenhum histórico de upload disponível</p>
          <p className="text-sm text-gray-500 mt-2">Faça upload de dados de Shopee Ads para começar a rastrear tendências</p>
        </Card>
      ) : (
        <>
          {/* ROAS Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução do ROAS</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="roas"
                  stroke="#3b82f6"
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="ROAS"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* ACOS Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução do ACOS</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="acos"
                  stroke="#ef4444"
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="ACOS (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Upload History Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Histórico de Uploads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-right py-2 px-2">ROAS</th>
                    <th className="text-right py-2 px-2">ACOS</th>
                    <th className="text-right py-2 px-2">Impressões</th>
                    <th className="text-right py-2 px-2">Cliques</th>
                    <th className="text-right py-2 px-2">Anúncios</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          {new Date(item.uploadedAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="text-right py-2 px-2 font-semibold">
                          {item.avgROAS.toFixed(2)}x
                        </td>
                        <td className="text-right py-2 px-2 font-semibold">
                          {item.avgACOS.toFixed(1)}%
                        </td>
                        <td className="text-right py-2 px-2">
                          {item.totalImpressions.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-2">
                          {item.totalClicks.toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-2">
                          {item.totalAds}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
