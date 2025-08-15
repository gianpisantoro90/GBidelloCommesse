import { useQuery } from "@tanstack/react-query";
import { type Project, type Client } from "@shared/schema";

export default function StatsCard() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const activeProjects = projects.length;
  const totalClients = clients.length;

  return (
    <div className="card-g2" data-testid="stats-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stato Archivio</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Commesse Attive</div>
          <div className="text-3xl font-bold text-primary" data-testid="stat-projects">
            {activeProjects}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Clienti</div>
          <div className="text-3xl font-bold text-primary" data-testid="stat-clients">
            {totalClients}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        💾 Dati memorizzati localmente in IndexedDB
      </div>
    </div>
  );
}
