import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuickActionsCardProps {
  onNewProject: () => void;
}

export default function QuickActionsCard({ onNewProject }: QuickActionsCardProps) {
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/export");
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `g2-commesse-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Esportazione completata",
        description: "I dati sono stati esportati con successo",
      });
    } catch (error) {
      toast({
        title: "Errore nell'esportazione",
        description: "Si è verificato un errore durante l'esportazione dei dati",
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
        
        toast({
          title: "Importazione completata",
          description: "I dati sono stati importati con successo",
        });
        
        // Refresh the page to show updated data
        window.location.reload();
      } catch (error) {
        toast({
          title: "Errore nell'importazione",
          description: "Si è verificato un errore durante l'importazione dei dati",
          variant: "destructive",
        });
      }
    };
    input.click();
  };


  return (
    <div className="card-g2" data-testid="quick-actions-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
      <div className="space-y-3">
        <Button 
          className="button-g2-primary w-full"
          onClick={onNewProject}
          data-testid="button-new-project"
        >
          Nuova Commessa
        </Button>
        <Button 
          variant="outline"
          className="button-g2-secondary w-full"
          onClick={handleExportData}
          data-testid="button-export-data"
        >
          Esporta Dati (.json)
        </Button>
        <Button 
          variant="outline"
          className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
          onClick={handleImportData}
          data-testid="button-import-data"
        >
          Importa Dati (.json)
        </Button>
      </div>
    </div>
  );
}
