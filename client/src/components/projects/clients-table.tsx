import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Client } from "@shared/schema";

export default function ClientsTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients.filter(client =>
    client.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl">⏳</div>
        <p>Caricamento clienti...</p>
      </div>
    );
  }

  return (
    <div data-testid="clients-table">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Anagrafica Clienti</h3>
        <div className="flex gap-3">
          <div className="relative">
            <Input
              placeholder="Cerca clienti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              data-testid="search-clients"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-lg">🔍</span>
          </div>
          <Button
            className="button-g2-primary"
            data-testid="add-client"
          >
            ➕ Nuovo Cliente
          </Button>
        </div>
      </div>
      
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-lg font-medium">
            {searchTerm ? "Nessun cliente trovato" : "Nessun cliente presente"}
          </p>
          <p className="text-sm">
            {searchTerm ? "Prova a modificare i criteri di ricerca" : "I clienti vengono creati automaticamente dalle commesse"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm rounded-tl-lg">Sigla</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Nome Cliente</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Città Principale</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">N. Commesse</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm rounded-tr-lg">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono text-sm font-semibold text-primary" data-testid={`client-sigla-${client.id}`}>
                      {client.sigla}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold" data-testid={`client-name-${client.id}`}>
                      {client.name}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600" data-testid={`client-city-${client.id}`}>
                      {client.city || "-"}
                    </td>
                    <td className="py-4 px-4" data-testid={`client-projects-count-${client.id}`}>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        (client.projectsCount || 0) > 5 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {client.projectsCount || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifica"
                          data-testid={`edit-client-${client.id}`}
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Visualizza commesse"
                          data-testid={`view-client-projects-${client.id}`}
                        >
                          📋
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina"
                          data-testid={`delete-client-${client.id}`}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-sm text-gray-500" data-testid="clients-count">
            Mostrando <strong>{filteredClients.length}</strong> di <strong>{clients.length}</strong> clienti
          </div>
        </>
      )}
    </div>
  );
}
