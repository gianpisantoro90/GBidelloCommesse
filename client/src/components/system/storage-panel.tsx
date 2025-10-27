import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StoragePanel() {
  const { toast } = useToast();

  const handleExportAllData = async () => {
    try {
      const response = await apiRequest("GET", "/api/export");
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `g2-backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export completato",
        description: "Tutti i dati sono stati esportati con successo",
      });
    } catch (error) {
      toast({
        title: "Errore nell'export",
        description: "Si è verificato un errore durante l'esportazione",
        variant: "destructive",
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await apiRequest("POST", "/api/import", data);
        updateStorageInfo();
        
        toast({
          title: "Import completato",
          description: "I dati sono stati importati con successo",
        });
      } catch (error) {
        toast({
          title: "Errore nell'import",
          description: "Si è verificato un errore durante l'importazione",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  return (
    <div data-testid="storage-panel">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Gestione Dati</h3>

      {/* Data Management */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📦 Backup e Ripristino</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📤</div>
            <div className="font-semibold text-gray-900 mb-1">Export Completo</div>
            <div className="text-sm text-gray-600 mb-3">Esporta tutti i dati in formato JSON</div>
            <Button
              onClick={handleExportAllData}
              className="w-full button-g2-primary"
              data-testid="export-all"
            >
              Esporta
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📥</div>
            <div className="font-semibold text-gray-900 mb-1">Import Dati</div>
            <div className="text-sm text-gray-600 mb-3">Importa dati da file JSON</div>
            <Button
              onClick={handleImportData}
              variant="outline"
              className="w-full button-g2-secondary"
              data-testid="import-data"
            >
              Importa
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-semibold text-gray-900 mb-1">Backup Auto</div>
            <div className="text-sm text-gray-600 mb-3">Configura backup automatico</div>
            <Button
              disabled
              className="w-full px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium cursor-not-allowed opacity-50"
              data-testid="configure-backup"
            >
              Configura
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
