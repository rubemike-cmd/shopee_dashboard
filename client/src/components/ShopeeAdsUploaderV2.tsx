import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ShopeeAdsUploaderV2Props {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function ShopeeAdsUploaderV2({ onSuccess, onError }: ShopeeAdsUploaderV2Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.shopeeAdsV2.uploadReport.useMutation();

  const handleFileRead = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setStatusMessage('Por favor, selecione um arquivo CSV');
      onError?.('Arquivo deve ser CSV');
      return;
    }

    setIsLoading(true);
    setUploadStatus('idle');

    try {
      const content = await file.text();

      const result = await uploadMutation.mutateAsync({
        filename: file.name,
        content,
        fileSize: file.size,
      });

      if (result.success && result.data) {
        setUploadStatus('success');
        setStatusMessage(`✓ Upload bem-sucedido! ${result.data.totalAds} anúncios carregados.`);
        onSuccess?.(result.data);
      } else {
        setUploadStatus('error');
        const errorMsg = result.errors?.[0] || 'Erro ao processar arquivo';
        setStatusMessage(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      setUploadStatus('error');
      const errorMsg = `Erro: ${String(error)}`;
      setStatusMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : uploadStatus === 'success'
              ? 'border-green-500 bg-green-50'
              : uploadStatus === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Processando arquivo...</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">{statusMessage}</p>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm font-medium text-red-700">{statusMessage}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Arraste seu arquivo CSV aqui
                </p>
                <p className="text-xs text-gray-500 mt-1">ou clique para selecionar</p>
              </div>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          Selecionar arquivo
        </Button>
      </Card>

      {statusMessage && uploadStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{statusMessage}</p>
        </div>
      )}
    </div>
  );
}
