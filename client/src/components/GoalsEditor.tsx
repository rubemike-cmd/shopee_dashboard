import { useState, useEffect } from 'react';
import { Settings2, Save, X, Target, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface GoalsEditorProps {
  onGoalsUpdated?: (goals: {
    weeklyRevenue: number;
    weeklyProfit: number;
    monthlyRevenue: number;
    monthlyProfit: number;
  }) => void;
}

export default function GoalsEditor({ onGoalsUpdated }: GoalsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    weeklyRevenue: '',
    weeklyProfit: '',
    monthlyRevenue: '',
    monthlyProfit: '',
  });

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

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Personalizar Metas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Defina suas metas de receita e lucro
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

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Weekly Goals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-foreground">Metas Semanais</h3>
                      {savedGoals && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Atual: {formatCurrency(savedGoals.weeklyRevenue)} / {formatCurrency(savedGoals.weeklyProfit)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Receita Semanal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.weeklyRevenue}
                          onChange={e => setForm(f => ({ ...f, weeklyRevenue: e.target.value }))}
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
                          onChange={e => setForm(f => ({ ...f, weeklyProfit: e.target.value }))}
                          placeholder="Ex: 50.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Goals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <h3 className="text-sm font-semibold text-foreground">Metas Mensais</h3>
                      {savedGoals && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Atual: {formatCurrency(savedGoals.monthlyRevenue)} / {formatCurrency(savedGoals.monthlyProfit)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Receita Mensal (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monthlyRevenue}
                          onChange={e => setForm(f => ({ ...f, monthlyRevenue: e.target.value }))}
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
                          onChange={e => setForm(f => ({ ...f, monthlyProfit: e.target.value }))}
                          placeholder="Ex: 200.00"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tip */}
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                    As metas são salvas automaticamente e ficam disponíveis em todas as sessões.
                    Os indicadores de progresso na aba "Metas" serão atualizados imediatamente.
                  </p>
                </>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || isLoading}
                  className="flex-1 gap-2"
                >
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
