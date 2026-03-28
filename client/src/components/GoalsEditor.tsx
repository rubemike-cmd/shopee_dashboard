import { useState, useEffect, useCallback } from 'react';
import { Settings2, Save, X, Target, TrendingUp, Calendar, RefreshCw, Link2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface GoalsEditorProps {
  /** Margem de lucro real do período selecionado (0–100) */
  profitMargin?: number;
  onGoalsUpdated?: (goals: {
    weeklyRevenue: number;
    weeklyProfit: number;
    monthlyRevenue: number;
    monthlyProfit: number;
  }) => void;
}

type Field = 'weeklyRevenue' | 'weeklyProfit' | 'monthlyRevenue' | 'monthlyProfit';

export default function GoalsEditor({ profitMargin = 0, onGoalsUpdated }: GoalsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Record<Field, string>>({
    weeklyRevenue: '',
    weeklyProfit: '',
    monthlyRevenue: '',
    monthlyProfit: '',
  });

  const margin = profitMargin / 100; // 0.072 for 7.2%

  const { data: savedGoals, isLoading, refetch } = trpc.goals.get.useQuery();
  const saveMutation = trpc.goals.save.useMutation({
    onSuccess: (data) => {
      toast.success('Metas salvas com sucesso!');
      setIsOpen(false);
      refetch();
      onGoalsUpdated?.(data.goals);
    },
    onError: (err) => {
      toast.error(`Erro ao salvar metas: ${err.message}`);
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (savedGoals) {
      setForm({
        weeklyRevenue: savedGoals.weeklyRevenue.toString(),
        weeklyProfit: savedGoals.weeklyProfit.toString(),
        monthlyRevenue: savedGoals.monthlyRevenue.toString(),
        monthlyProfit: savedGoals.monthlyProfit.toString(),
      });
    }
  }, [savedGoals]);

  /**
   * Derives all four fields from a single changed value:
   * - weekly × 4 = monthly (and vice-versa)
   * - revenue × margin = profit (and vice-versa)
   */
  const handleChange = useCallback((field: Field, raw: string) => {
    const val = parseFloat(raw);
    if (raw === '' || isNaN(val)) {
      setForm(f => ({ ...f, [field]: raw }));
      return;
    }

    const fmt = (n: number) => (n > 0 ? n.toFixed(2) : '');

    let wRev = parseFloat(form.weeklyRevenue) || 0;
    let wPro = parseFloat(form.weeklyProfit) || 0;
    let mRev = parseFloat(form.monthlyRevenue) || 0;
    let mPro = parseFloat(form.monthlyProfit) || 0;

    if (field === 'weeklyRevenue') {
      wRev = val;
      mRev = val * 4;
      if (margin > 0) { wPro = val * margin; mPro = wPro * 4; }
    } else if (field === 'weeklyProfit') {
      wPro = val;
      mPro = val * 4;
      if (margin > 0) { wRev = val / margin; mRev = wRev * 4; }
    } else if (field === 'monthlyRevenue') {
      mRev = val;
      wRev = val / 4;
      if (margin > 0) { mPro = val * margin; wPro = mPro / 4; }
    } else if (field === 'monthlyProfit') {
      mPro = val;
      wPro = val / 4;
      if (margin > 0) { mRev = val / margin; wRev = mRev / 4; }
    }

    setForm({
      weeklyRevenue: fmt(wRev),
      weeklyProfit: fmt(wPro),
      monthlyRevenue: fmt(mRev),
      monthlyProfit: fmt(mPro),
    });
  }, [form, margin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      weeklyRevenue: parseFloat(form.weeklyRevenue) || 0,
      weeklyProfit: parseFloat(form.weeklyProfit) || 0,
      monthlyRevenue: parseFloat(form.monthlyRevenue) || 0,
      monthlyProfit: parseFloat(form.monthlyProfit) || 0,
    };
    saveMutation.mutate(parsed);
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-sm"
      >
        <Settings2 className="w-4 h-4" />
        Definir Metas
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Personalizar Metas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Altere qualquer campo — os demais são calculados automaticamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Margin info banner */}
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {margin > 0
                        ? <>Margem atual do período: <strong>{profitMargin.toFixed(1)}%</strong>. Ao digitar faturamento, o lucro é calculado automaticamente e vice-versa. Metas semanais × 4 = mensais.</>
                        : <>Nenhum dado com margem disponível no período selecionado. Preencha os campos manualmente; o vínculo semanal × 4 = mensal ainda se aplica.</>
                      }
                    </p>
                  </div>

                  {/* Weekly Goals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold">Metas Semanais</h3>
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="w-3 h-3" /> vinculado às mensais
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Faturamento Semanal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.weeklyRevenue}
                          onChange={e => handleChange('weeklyRevenue', e.target.value)}
                          placeholder="Ex: 500.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Lucro Semanal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.weeklyProfit}
                          onChange={e => handleChange('weeklyProfit', e.target.value)}
                          placeholder="Ex: 36.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Goals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <h3 className="text-sm font-semibold">Metas Mensais</h3>
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="w-3 h-3" /> vinculado às semanais
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Faturamento Mensal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monthlyRevenue}
                          onChange={e => handleChange('monthlyRevenue', e.target.value)}
                          placeholder="Ex: 2000.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Lucro Mensal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monthlyProfit}
                          onChange={e => handleChange('monthlyProfit', e.target.value)}
                          placeholder="Ex: 144.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview row */}
                  {(parseFloat(form.weeklyRevenue) > 0 || parseFloat(form.monthlyRevenue) > 0) && (
                    <div className="rounded-lg bg-secondary/40 px-3 py-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Semanal:</span>{' '}
                        <strong>{formatCurrency(parseFloat(form.weeklyRevenue) || 0)}</strong>{' '}
                        <span className="text-muted-foreground">fat. /</span>{' '}
                        <strong>{formatCurrency(parseFloat(form.weeklyProfit) || 0)}</strong>{' '}
                        <span className="text-muted-foreground">lucro</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mensal:</span>{' '}
                        <strong>{formatCurrency(parseFloat(form.monthlyRevenue) || 0)}</strong>{' '}
                        <span className="text-muted-foreground">fat. /</span>{' '}
                        <strong>{formatCurrency(parseFloat(form.monthlyProfit) || 0)}</strong>{' '}
                        <span className="text-muted-foreground">lucro</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || isLoading} className="flex-1 gap-2">
                  {saveMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Metas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
