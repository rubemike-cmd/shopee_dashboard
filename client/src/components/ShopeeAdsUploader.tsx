import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  foundColumns: string[];
  missingColumns: string[];
}

interface UploadResponse {
  success: boolean;
  validation?: ValidationResult;
  data?: {
    uploadId: number;
    totalAds: number;
    periodStart: string;
    periodEnd: string;
  };
}

interface ShopeeAdsUploaderProps {
  onUploadSuccess?: (data: UploadResponse["data"]) => void;
}

export function ShopeeAdsUploader({ onUploadSuccess }: ShopeeAdsUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, envie um arquivo CSV válido");
      return;
    }

    setIsLoading(true);
    try {
      const content = await file.text();
      const fileSize = file.size;

      const response = await fetch("/api/upload/shopee-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content,
          fileSize,
        }),
        credentials: "include",
      });

      const result: UploadResponse = await response.json();
      setUploadResult(result);

      if (result.success && result.data) {
        toast.success(`${result.data.totalAds} anúncios carregados com sucesso!`);
        onUploadSuccess?.(result.data);
      } else if (!result.success && result.validation?.errors.length) {
        toast.error(`Erro na validação: ${result.validation.errors[0]}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload do arquivo");
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
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
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
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-900">
              {isLoading ? "Processando arquivo..." : "Arraste o arquivo CSV aqui"}
            </p>
            <p className="text-sm text-gray-500">ou clique para selecionar</p>
          </div>
        </div>
      </Card>

      {/* Validation Result */}
      {uploadResult && (
        <Card className="p-4">
          {uploadResult.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Upload realizado com sucesso!</span>
              </div>
              {uploadResult.data && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✓ Total de anúncios: <strong>{uploadResult.data.totalAds}</strong></p>
                  {uploadResult.data.periodStart && (
                    <p>✓ Período: <strong>{uploadResult.data.periodStart} a {uploadResult.data.periodEnd}</strong></p>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadResult(null)}
              >
                Carregar outro arquivo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Erro na validação</p>
                  {uploadResult.validation?.errors.map((error, i) => (
                    <p key={i} className="text-sm">{error}</p>
                  ))}
                </div>
              </div>

              {uploadResult.validation?.missingColumns.length ? (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    Colunas ausentes ({uploadResult.validation.missingColumns.length})
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 space-y-1">
                    {uploadResult.validation.missingColumns.map((col, i) => (
                      <p key={i}>• {col}</p>
                    ))}
                  </div>
                </details>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadResult(null)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
