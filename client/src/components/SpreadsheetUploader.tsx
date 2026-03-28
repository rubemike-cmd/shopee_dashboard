import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrdersContext';
import type { Order } from '@/hooks/useOrdersAnalysis';

interface UploadHistory {
  filename: string;
  uploadedAt: string;
  totalOrders: number;
}

export default function SpreadsheetUploader() {
  const { setOrders, setLastUpload, lastUpload, resetToDefault } = useOrders();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadStatus('error');
        setErrorMessage('Apenas arquivos .xlsx e .xls são aceitos.');
        return;
      }

      setIsUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/spreadsheet', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao processar arquivo');
        }

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

        setUploadHistory(prev => [
          { filename: result.filename, uploadedAt: new Date().toISOString(), totalOrders: result.totalOrders },
          ...prev.slice(0, 4),
        ]);

        setUploadStatus('success');
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
        {lastUpload && (
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
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            }
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Processando planilha...</p>
                  <p className="text-sm text-muted-foreground mt-1">Aguarde enquanto os dados são carregados</p>
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

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Planilha carregada com sucesso! O dashboard foi atualizado com os novos dados.
            </p>
            <button onClick={() => setUploadStatus('idle')} className="ml-auto text-green-600 hover:text-green-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{errorMessage}</p>
            <button onClick={() => setUploadStatus('idle')} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
