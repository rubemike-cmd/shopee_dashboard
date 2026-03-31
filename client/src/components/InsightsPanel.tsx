import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MentorChat } from './MentorChat';
import {
  Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target,
  RefreshCw, ChevronDown, ChevronUp, Star, Zap, MessageSquare
} from 'lucide-react';

type InsightData = {
  summary: string;
  strengths: Array<{ title: string; detail: string; metric: string }>;
  alerts: Array<{ title: string; detail: string; severity: 'alta' | 'media' | 'baixa'; metric: string }>;
  opportunities: Array<{ title: string; detail: string; potential: string }>;
  topRecommendation: { action: string; why: string; howTo: string };
  mentorNote: string;
};

type InsightInput = {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; count: number; totalProfit: number }>;
  statusDistribution: Array<{ name: string; value: number; percentage: number }>;
  stateDistribution: Array<{ name: string; value: number }>;
  logisticsDistribution: Array<{ name: string; value: number }>;
  periodDays?: number;
  dateRange?: { start: string; end: string };
};

interface InsightsPanelProps {
  data: InsightInput;
}

const severityConfig = {
  alta: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  media: { label: 'Atenção', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  baixa: { label: 'Observar', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400' },
};

function ExpandableCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="cursor-pointer" onClick={() => setExpanded(v => !v)}>
        {/* The first child is the header */}
        {Array.isArray(children) ? children[0] : children}
        {Array.isArray(children) && (
          <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {expanded && Array.isArray(children) && children.slice(1)}
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-3/5" />
      </div>
    </div>
  );
}

export default function InsightsPanel({ data }: InsightsPanelProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateMutation = trpc.insights.generate.useMutation({
    onSuccess: (result) => {
      setInsights(result);
      setHasGenerated(true);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate(data);
  };

  if (!hasGenerated && !generateMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        {/* Mentor avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
            <span className="text-4xl">👨‍💼</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">Análise do Mentor</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vou analisar os dados da sua loja e trazer insights práticos sobre pontos fortes,
            alertas, oportunidades e a ação mais importante que você deve tomar agora.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
            <Star className="w-3 h-3 text-yellow-500" /> Pontos fortes
          </span>
          <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-red-500" /> Alertas críticos
          </span>
          <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
            <Lightbulb className="w-3 h-3 text-blue-500" /> Oportunidades
          </span>
          <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-primary" /> Recomendação #1
          </span>
        </div>

        <Button onClick={handleGenerate} size="lg" className="gap-2 px-8">
          <Sparkles className="w-4 h-4" />
          Gerar Análise do Mentor
        </Button>

        <p className="text-xs text-muted-foreground">
          Baseado em {data.totalOrders} pedidos · R$ {data.totalRevenue.toFixed(2)} em vendas
        </p>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">👨‍💼</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>O mentor está analisando seus dados...</span>
          </div>
        </div>
        <InsightSkeleton />
      </div>
    );
  }

  if (generateMutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-muted-foreground text-center">
          Erro ao gerar análise. Verifique sua conexão e tente novamente.
        </p>
        <Button variant="outline" onClick={handleGenerate} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <span className="text-xl">👨‍💼</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Análise do Mentor</h3>
            <p className="text-xs text-muted-foreground">
              Baseado em {data.totalOrders} pedidos · R$ {data.totalRevenue.toFixed(2)} em vendas
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Reanalisar
        </Button>
      </div>

      {/* Summary card */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>
        </div>
      </Card>

      {/* Strengths */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-500" />
          <h4 className="font-semibold text-sm">Pontos Fortes</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.strengths.map((s, i) => (
            <Card key={i} className="p-4 border-green-200 bg-green-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-green-800">{s.title}</span>
                <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
              </div>
              <p className="text-xs text-green-700 leading-relaxed">{s.detail}</p>
              <div className="pt-1 border-t border-green-200">
                <span className="text-xs font-semibold text-green-600">{s.metric}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h4 className="font-semibold text-sm">Alertas</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.alerts.map((a, i) => {
            const cfg = severityConfig[a.severity];
            return (
              <Card key={i} className={`p-4 border space-y-2 ${cfg.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm ${cfg.color}`}>{a.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${cfg.color} opacity-90`}>{a.detail}</p>
                <div className={`pt-1 border-t ${cfg.bg.includes('red') ? 'border-red-200' : cfg.bg.includes('yellow') ? 'border-yellow-200' : 'border-blue-200'}`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-semibold ${cfg.color}`}>{a.metric}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          <h4 className="font-semibold text-sm">Oportunidades</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.opportunities.map((o, i) => (
            <Card key={i} className="p-4 border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-blue-800">{o.title}</span>
                <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">{o.detail}</p>
              <div className="pt-1 border-t border-blue-200">
                <span className="text-xs font-semibold text-blue-600">{o.potential}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Recommendation */}
      <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/8 to-primary/3">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Recomendação #1 — Faça isso agora</h4>
            <p className="text-xs text-muted-foreground mt-0.5">A ação mais impactante para o seu negócio hoje</p>
          </div>
        </div>
        <div className="space-y-3 ml-11">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">O que fazer</span>
            <p className="text-sm mt-1 font-medium">{insights.topRecommendation.action}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por que agora</span>
            <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{insights.topRecommendation.why}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Como executar</span>
            <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{insights.topRecommendation.howTo}</p>
          </div>
        </div>
      </Card>

      {/* Mentor note */}
      <Card className="p-5 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-lg">👨‍💼</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nota do Mentor</span>
            <p className="text-sm mt-1 leading-relaxed italic text-foreground/80">"{insights.mentorNote}"</p>
          </div>
        </div>
      </Card>

      {/* Chat com o Mentor */}
      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Converse com o Mentor</h4>
        </div>
        <div className="h-96">
          <MentorChat dashboardData={data} />
        </div>
      </Card>
    </div>
  );
}
