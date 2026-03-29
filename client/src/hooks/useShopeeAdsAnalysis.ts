import { useMemo } from "react";

export interface ShopeeAd {
  id: number;
  uploadId: number;
  adNumber: number;
  adName: string;
  status: string;
  adType: string;
  productId: string;
  bidMethod: string;
  placement: string;
  keyword: string;
  combinationType: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  directConversions: number;
  conversionRate: number;
  directConversionRate: number;
  costPerConversion: number;
  costPerDirectConversion: number;
  itemsSold: number;
  directItemsSold: number;
  gmv: number;
  directRevenue: number;
  spend: number;
  roas: number;
  directRoas: number;
  acos: number;
  directAcos: number;
  createdAt: Date;
}

export interface ShopeeAdsMetrics {
  totalAds: number;
  activeAds: number;
  pausedAds: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  totalConversions: number;
  totalDirectConversions: number;
  avgConversionRate: number;
  totalSpend: number;
  totalGMV: number;
  totalDirectRevenue: number;
  avgROAS: number;
  avgDirectROAS: number;
  avgACOS: number;
  avgDirectACOS: number;
  totalItemsSold: number;
  topPerformingAd: ShopeeAd | null;
  worstPerformingAd: ShopeeAd | null;
}

export function useShopeeAdsAnalysis(ads: ShopeeAd[]): ShopeeAdsMetrics {
  return useMemo(() => {
    if (!ads || ads.length === 0) {
      return {
        totalAds: 0,
        activeAds: 0,
        pausedAds: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCTR: 0,
        totalConversions: 0,
        totalDirectConversions: 0,
        avgConversionRate: 0,
        totalSpend: 0,
        totalGMV: 0,
        totalDirectRevenue: 0,
        avgROAS: 0,
        avgDirectROAS: 0,
        avgACOS: 0,
        avgDirectACOS: 0,
        totalItemsSold: 0,
        topPerformingAd: null,
        worstPerformingAd: null,
      };
    }

    const metrics: ShopeeAdsMetrics = {
      totalAds: ads.length,
      activeAds: ads.filter((ad) => ad.status === "Em Andamento").length,
      pausedAds: ads.filter((ad) => ad.status === "Pausado").length,
      totalImpressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
      totalClicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
      avgCTR: ads.reduce((sum, ad) => sum + (ad.ctr || 0), 0) / ads.length,
      totalConversions: ads.reduce((sum, ad) => sum + (ad.conversions || 0), 0),
      totalDirectConversions: ads.reduce((sum, ad) => sum + (ad.directConversions || 0), 0),
      avgConversionRate: ads.reduce((sum, ad) => sum + (ad.conversionRate || 0), 0) / ads.length,
      totalSpend: ads.reduce((sum, ad) => sum + (ad.spend || 0), 0),
      totalGMV: ads.reduce((sum, ad) => sum + (ad.gmv || 0), 0),
      totalDirectRevenue: ads.reduce((sum, ad) => sum + (ad.directRevenue || 0), 0),
      avgROAS: ads.reduce((sum, ad) => sum + (ad.roas || 0), 0) / ads.length,
      avgDirectROAS: ads.reduce((sum, ad) => sum + (ad.directRoas || 0), 0) / ads.length,
      avgACOS: ads.reduce((sum, ad) => sum + (ad.acos || 0), 0) / ads.length,
      avgDirectACOS: ads.reduce((sum, ad) => sum + (ad.directAcos || 0), 0) / ads.length,
      totalItemsSold: ads.reduce((sum, ad) => sum + (ad.itemsSold || 0), 0),
      topPerformingAd: ads.reduce((top, ad) => {
        const topROAS = top?.roas || 0;
        return (ad.roas || 0) > topROAS ? ad : top;
      }, null as ShopeeAd | null),
      worstPerformingAd: ads.reduce((worst, ad) => {
        const worstROAS = worst?.roas || Infinity;
        return (ad.roas || Infinity) < worstROAS ? ad : worst;
      }, null as ShopeeAd | null),
    };

    return metrics;
  }, [ads]);
}

export function getAdPerformanceCategory(roas: number): string {
  if (roas >= 5) return "Excelente";
  if (roas >= 3) return "Muito Bom";
  if (roas >= 2) return "Bom";
  if (roas >= 1) return "Aceitável";
  return "Precisa Melhorar";
}

export function getACOSStatus(acos: number): string {
  if (acos <= 20) return "Excelente";
  if (acos <= 35) return "Muito Bom";
  if (acos <= 50) return "Bom";
  if (acos <= 75) return "Aceitável";
  return "Crítico";
}
