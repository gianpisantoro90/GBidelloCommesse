import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RoutingResult {
  suggestedPath: string;
  confidence: number;
  reasoning: string;
}

export default function RoutingResults() {
  const [results, setResults] = useState<RoutingResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mock results for demonstration
  const mockResults: RoutingResult[] = [
    {
      suggestedPath: "02_PROGETTAZIONE/01_RELAZIONI/",
      confidence: 92,
      reasoning: "Basato su contenuto e nomenclatura"
    },
    {
      suggestedPath: "01_DOCUMENTI_GENERALI/02_TECNICI/",
      confidence: 67,
      reasoning: "Alternativa basata su tipologia"
    }
  ];

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Alta</span>;
    } else if (confidence >= 60) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Media</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Bassa</span>;
    }
  };

  const handleSelectPath = (path: string) => {
    console.log("Selected path:", path);
    // TODO: Implement path selection logic
  };

  const handleAcceptSuggestion = () => {
    console.log("Accepting suggestion");
    // TODO: Implement suggestion acceptance logic
  };

  const handleManualPath = () => {
    console.log("Manual path selection");
    // TODO: Implement manual path selection
  };

  const handleAnalyzeAnother = () => {
    setIsVisible(false);
    setSelectedFile(null);
    setResults([]);
  };

  if (!isVisible && mockResults.length > 0) {
    setIsVisible(true);
    setResults(mockResults);
    setSelectedFile(new File([""], "relazione_tecnica.pdf", { type: "application/pdf" }));
  }

  return (
    <div 
      className={`card-g2 ${isVisible ? 'block' : 'hidden'}`} 
      data-testid="routing-results"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Risultati Analisi</h3>
      
      <div className="space-y-4">
        {/* File Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Informazioni File</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nome:</span>{" "}
              <span className="font-mono" data-testid="file-name">
                {selectedFile?.name || "relazione_tecnica.pdf"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Dimensione:</span>{" "}
              <span data-testid="file-size">2.1 MB</span>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>{" "}
              <span data-testid="file-type">PDF Document</span>
            </div>
            <div>
              <span className="text-gray-600">Rilevato:</span>{" "}
              <span data-testid="file-detected">Documento tecnico</span>
            </div>
          </div>
        </div>
        
        {/* Suggested Paths */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">💡 Percorsi Suggeriti</h4>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSelectPath(result.suggestedPath)}
                data-testid={`suggested-path-${index}`}
              >
                <div className="flex-1">
                  <div className="font-mono text-sm text-primary">
                    {result.suggestedPath}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Confidenza: {result.confidence}% • {result.reasoning}
                  </div>
                </div>
                <div className="flex gap-2">
                  {getConfidenceBadge(result.confidence)}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPath(result.suggestedPath);
                    }}
                    data-testid={`select-path-${index}`}
                  >
                    ✓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleAcceptSuggestion}
            className="px-6 py-2 bg-g2-success text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            data-testid="accept-suggestion"
          >
            ✅ Accetta Suggerimento
          </Button>
          <Button
            variant="outline"
            onClick={handleManualPath}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            data-testid="manual-path"
          >
            ✏️ Percorso Manuale
          </Button>
          <Button
            variant="ghost"
            onClick={handleAnalyzeAnother}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            data-testid="analyze-another"
          >
            🔄 Analizza Altro File
          </Button>
        </div>
      </div>
    </div>
  );
}
