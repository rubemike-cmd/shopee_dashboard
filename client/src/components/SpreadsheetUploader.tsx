import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X,
  Clock, RefreshCw, AlertTriangle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrdersContext';
import type { Order } from '@/hooks/useOrdersAnalysis';

interface ValidationResult {
  valid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  unrecognized: string[];
  columnMapping: Record<string, string>;
  warnings: string[];
}

interface UploadHistory {
  filename: string;
  uploadedAt: string;
  totalOrders: number;
  hadWarnings: boolean;
}

export default function SpreadsheetUploader() {
  const { setOrders, setLastUpload, lastUpload, resetToDefault } = useOrders();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadStatus('error');
        setErrorMessage('Apenas arquivos .xlsx e .xls são aceitos.');
        setValidation(null);
        return;
      }

      setIsUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');
      setValidation(null);
      setShowValidationDetails(false);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/spreadsheet', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        // Handle validation errors (422 = colunas ausentes)
        if (response.status === 422) {
          setValidation(result.validation as ValidationResult);
          setUploadStatus('error');
          setErrorMessage(result.error || 'Planilha inválida: colunas obrigatórias ausentes.');
          setShowValidationDetails(true);
          return;
        }

        if (!response.ok) {
          setUploadStatus('error');
          setErrorMessage(result.error || 'Erro ao processar arquivo');
          return;
        }

        // Save validation result (may have warnings even on success)
        const validationResult = result.validation as ValidationResult | undefined;
        setValidation(validationResult ?? null);

        // Map the raw data to Order type
        const mappedOrders = (result.data as Record<string, unknown>[]).map(row => ({
          'Número do Pedido': row['Número do Pedido'] ?? row['Numero do Pedido'] ?? 0,
          'Número do Pedido no Canal': String(row['Número do Pedido no Canal'] ?? row['Numero do Pedido no Canal'] ?? ''),
          'Cliente': String(row['Cliente'] ?? ''),
          'Email do Cliente': row['Email do Cliente'] ? String(row['Email do Cliente']) : null,
          'Telefone do Cliente': String(row['Telefone do Cliente'] ?? ''),
          'Endereço do Cliente': String(row['Endereço do Cliente'] ?? row['Endereco do Cliente'] ?? ''),
          'Cidade do Cliente': String(row['Cidade do Cliente'] ?? ''),
          'Estado do Cliente': String(row['Estado do Cliente'] ?? ''),
          'CEP do Cliente': String(row['CEP do Cliente'] ?? ''),
          'Canal': String(row['Canal'] ?? ''),
          'Empresa': String(row['Empresa'] ?? ''),
          'Status': String(row['Status'] ?? ''),
          'Custo Total': Number(row['Custo Total'] ?? 0),
          'valor da venda': Number(row['valor da venda'] ?? row['Valor da Venda'] ?? row['Valor Total'] ?? 0),
          'Líquido Total': Number(row['Líquido Total'] ?? row['Liquido Total'] ?? row['Lucro Total'] ?? 0),
          'Modo de Logística': String(row['Modo de Logística'] ?? row['Modo de Logistica'] ?? ''),
          'Produtos': String(row['Produtos'] ?? ''),
          'Data de Criação': row['Data de Criação']
            ? (row['Data de Criação'] instanceof Date
                ? (row['Data de Criação'] as Date).toISOString()
                : String(row['Data de Criação']))
            : String(row['Data de Criacao'] ?? ''),
          'Data de Atualização': row['Data de Atualização']
            ? (row['Data de Atualização'] instanceof Date
                ? (row['Data de Atualização'] as Date).toISOString()
                : String(row['Data de Atualização']))
            : String(row['Data de Atualizacao'] ?? ''),
        })) as Order[];

        setOrders(mappedOrders);
        setLastUpload({
          filename: result.filename,
          uploadedAt: new Date(),
          totalOrders: result.totalOrders,
        });

        const hadWarnings = !!(validationResult?.warnings?.length || validationResult?.missingOptional?.length);
        setUploadHistory(prev => [
          { filename: result.filename, uploadedAt: new Date().toISOString(), totalOrders: result.totalOrders, hadWarnings },
          ...prev.slice(0, 4),
        ]);

        setUploadStatus(hadWarnings ? 'warning' : 'success');
      } catch (err: unknown) {
        setUploadStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Erro desconhecido ao processar arquivo');
      } finally {
        setIsUploading(false);
      }
    },
    [setOrders, setLastUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const dismiss = () => {
    setUploadStatus('idle');
    setValidation(null);
    setShowValidationDetails(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h3 className="text-heading">Atualizar Dados</h3>
          </div>
          {lastUpload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Restaurar dados originais
            </Button>
          )}
        </div>

        {/* Current data info */}
        {lastUpload && uploadStatus === 'idle' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-green-800">{lastUpload.filename}</span>
              <span className="text-green-600 ml-2">
                — {lastUpload.totalOrders} pedidos carregados em{' '}
                {lastUpload.uploadedAt.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Processando planilha...</p>
                  <p className="text-sm text-muted-foreground mt-1">Validando colunas e carregando dados</p>
                </div>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : 'bg-secondary'}`}>
                  <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {isDragging ? 'Solte o arquivo aqui' : 'Arraste a planilha ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Suporta arquivos <strong>.xlsx</strong> e <strong>.xls</strong> — máximo 20 MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SUCCESS ── */}
        {uploadStatus === 'success' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-green-800">Planilha carregada com sucesso!</p>
              <p className="text-green-700 mt-0.5">Todas as colunas obrigatórias foram encontradas. O dashboard foi atualizado.</p>
            </div>
            <button onClick={dismiss} className="text-green-600 hover:text-green-800 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── WARNING (success with missing optional columns) ── */}
        {uploadStatus === 'warning' && (
          <div className="mt-3 border border-amber-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-amber-50 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-amber-800">Planilha carregada com avisos</p>
                <p className="text-amber-700 mt-0.5">Os dados foram importados, mas algumas colunas opcionais estão ausentes.</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowValidationDetails(v => !v)}
                  className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-xs font-medium"
                >
                  {showValidationDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showValidationDetails ? 'Ocultar' : 'Ver detalhes'}
                </button>
                <button onClick={dismiss} className="text-amber-600 hover:text-amber-800 ml-1"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {showValidationDetails && validation && (
              <div className="p-3 bg-amber-50/50 border-t border-amber-100 space-y-2">
                {validation.missingOptional.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Colunas opcionais ausentes:</p>
                    <div className="flex flex-wrap gap-1">
                      {validation.missingOptional.map(col => (
                        <span key={col} className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-mono">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {validation.unrecognized.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Colunas não reconhecidas (serão ignoradas):</p>
                    <div className="flex flex-wrap gap-1">
                      {validation.unrecognized.map(col => (
                        <span key={col} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ERROR (missing required columns or other errors) ── */}
        {uploadStatus === 'error' && (
          <div className="mt-3 border border-red-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-red-50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-red-800">Erro ao carregar planilha</p>
                <p className="text-red-700 mt-0.5">{errorMessage}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {validation && validation.missingRequired.length > 0 && (
                  <button
                    onClick={() => setShowValidationDetails(v => !v)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs font-medium"
                  >
                    {showValidationDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showValidationDetails ? 'Ocultar' : 'Ver detalhes'}
                  </button>
                )}
                <button onClick={dismiss} className="text-red-600 hover:text-red-800 ml-1"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Validation details panel */}
            {showValidationDetails && validation && (
              <div className="p-4 bg-red-50/50 border-t border-red-100 space-y-4">
                {/* Missing required */}
                {validation.missingRequired.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Colunas obrigatórias ausentes ({validation.missingRequired.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {validation.missingRequired.map(col => (
                        <span key={col} className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-xs font-mono font-semibold border border-red-200">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Found columns */}
                {Object.keys(validation.columnMapping).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Colunas encontradas ({Object.keys(validation.columnMapping).length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(validation.columnMapping).map(col => (
                        <span key={col} className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-mono border border-green-200">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help tip */}
                <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Verifique se os nomes das colunas na sua planilha correspondem exatamente aos nomes esperados.
                    O sistema aceita variações como acentos e capitalização diferente.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Required columns reference */}
        <details className="mt-4 group">
          <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            <Info className="w-3.5 h-3.5" />
            <span>Ver colunas obrigatórias esperadas</span>
            <ChevronDown className="w-3 h-3 ml-auto group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">As seguintes colunas são obrigatórias na planilha:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Número do Pedido', 'Status', 'valor da venda',
                'Líquido Total', 'Custo Total', 'Estado do Cliente',
                'Modo de Logística', 'Data de Criação', 'Produtos'
              ].map(col => (
                <span key={col} className="inline-flex items-center px-2 py-0.5 rounded bg-background border border-border text-xs font-mono text-foreground">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </details>
      </Card>

      {/* Upload History */}
      {uploadHistory.length > 0 && (
        <Card className="chart-container">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Histórico desta sessão ({uploadHistory.length})
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{showHistory ? '▲' : '▼'}</span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {uploadHistory.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium truncate flex-1">{item.filename}</span>
                  {item.hadWarnings && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label="Carregado com avisos" />
                  )}
                  <span className="text-muted-foreground shrink-0">{item.totalOrders} pedidos</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(item.uploadedAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
