import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PdfUpload({ value, onChange, onRemove, disabled, className }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Solo file PDF sono consentiti");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("Il file non può superare i 10MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante l'upload");
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, [disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    onRemove?.();
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Se c'è già un file caricato
  if (value) {
    const fileName = value.split("/").pop() || "documento.pdf";
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{fileName}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Caricato con successo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Visualizza
            </a>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all",
          isDragging && "border-blue-500 bg-blue-50",
          !isDragging && !error && "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          error && "border-red-300 bg-red-50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Caricamento in corso...</p>
          </>
        ) : (
          <>
            <Upload className={cn(
              "w-10 h-10 mb-2",
              isDragging ? "text-blue-500" : "text-gray-400"
            )} />
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isDragging ? "Rilascia il file qui" : "Trascina un PDF qui"}
            </p>
            <p className="text-xs text-gray-500">
              oppure <span className="text-blue-600 hover:underline">sfoglia</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">PDF, max 10MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}
