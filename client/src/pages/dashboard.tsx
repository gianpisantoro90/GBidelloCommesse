import { useState } from "react";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import StatsCard from "@/components/dashboard/stats-card";
import RecentProjectsTable from "@/components/dashboard/recent-projects-table";
import EconomicDashboardCard from "@/components/dashboard/economic-dashboard-card";
import FattureScadenzaWidget from "@/components/dashboard/fatture-scadenza-widget";
import CashFlowDashboard from "@/components/dashboard/cash-flow-dashboard";
import NewProjectForm from "@/components/projects/new-project-form";
import FolderStructureCard from "@/components/projects/folder-structure-card";
import ProjectsTable from "@/components/projects/projects-table";
import ClientsTable from "@/components/projects/clients-table";
import ParcellaCalculator from "@/components/projects/parcella-calculator-new";
import Scadenzario from "@/components/projects/scadenzario";
import RegistroComunicazioni from "@/components/projects/registro-comunicazioni";
import GestioneRisorse from "@/components/projects/gestione-risorse";
import KpiDashboard from "@/components/projects/kpi-dashboard";
import FattureIngresso from "@/components/projects/fatture-ingresso";
import FattureEmesse from "@/components/projects/fatture-emesse";
import FattureConsulenti from "@/components/projects/fatture-consulenti";
import CostiVivi from "@/components/projects/costi-vivi";
import CostiGenerali from "@/components/projects/costi-generali";
import CentroCostoDashboard from "@/components/projects/centro-costo-dashboard";
import StoragePanel from "@/components/system/storage-panel";
import UsersManagement from "@/components/system/users-management";
import ProfiliCostoManagement from "@/components/system/profili-costo-management";
import ActivityLogViewer from "@/components/system/activity-log-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Project } from "@shared/schema";
import { User } from "@/hooks/useAuth";

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

// Helper per verificare se l'utente è admin (supporta sia nuovo che vecchio schema)
const isUserAdmin = (user: User | null) => {
  return user?.role === "admin" || user?.role === "amministratore" as any;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const isAdmin = isUserAdmin(user);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState({
    gestione: "progetti",
    sistema: "storage",
    vista: "tabella"
  });
  const [pendingProject, setPendingProject] = useState(null);

  const handleSubTabChange = (mainTab: string, subTab: string) => {
    setActiveSubTab(prev => ({ ...prev, [mainTab]: subTab }));
  };

  return (
    <div className="min-h-screen bg-g2-accent">
      <Header user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="p-6">
          <div className="animate-fade-in">
            {/* Dashboard Panel */}
            {activeTab === "dashboard" && (
              <div className="space-y-8" data-testid="dashboard-panel">
                {/* First Row - Economic Dashboard */}
                <EconomicDashboardCard />

                {/* Widget Fatture in Scadenza */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <FattureScadenzaWidget />
                  <CashFlowDashboard isAdmin={isAdmin} />
                </div>

                {/* Second Row - Recent Projects */}
                <RecentProjectsTable />

                {/* Third Row - Core System Info */}
                <div className="grid gap-6 lg:grid-cols-1">
                  <StatsCard />
                </div>
              </div>
            )}

            {/* Management Panel */}
            {activeTab === "gestione" && (
              <div data-testid="management-panel">
                <Tabs value={activeSubTab.gestione} onValueChange={(value) => handleSubTabChange("gestione", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 overflow-x-auto">
                    <TabsList className="inline-flex w-auto min-w-full bg-transparent border-0 p-0">
                      <TabsTrigger
                        value="progetti"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-progetti"
                      >
                        Commesse
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger
                          value="nuova"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-nuova"
                        >
                          + Nuova
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="centro-costo"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-centro-costo"
                      >
                        Centro Costo
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger
                          value="fatture-emesse"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-fatture-emesse"
                        >
                          Fatt. Emesse
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger
                          value="fatture-ingresso"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-fatture-ingresso"
                        >
                          Fatt. Ingresso
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger
                          value="fatture-consulenti"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-fatture-consulenti"
                        >
                          Fatt. Consulenti
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="costi-vivi"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-costi-vivi"
                      >
                        Costi Vivi
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger
                          value="costi-generali"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-costi-generali"
                        >
                          Costi Generali
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="scadenzario"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-scadenzario"
                      >
                        Scadenze
                      </TabsTrigger>
                      <TabsTrigger
                        value="comunicazioni"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-comunicazioni"
                      >
                        Comunicazioni
                      </TabsTrigger>
                      <TabsTrigger
                        value="risorse"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-risorse"
                      >
                        Risorse
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger
                          value="clienti"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-clienti"
                        >
                          Clienti
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger
                          value="kpi"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-kpi"
                        >
                          KPI
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger
                          value="parcella"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-parcella"
                        >
                          Calc. Parcella
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="progetti" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <ProjectsTable />
                  </TabsContent>

                  <TabsContent value="risorse" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <GestioneRisorse />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="kpi" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <KpiDashboard />
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="parcella" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <ParcellaCalculator />
                    </TabsContent>
                  )}

                  <TabsContent value="scadenzario" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <Scadenzario />
                  </TabsContent>

                  <TabsContent value="comunicazioni" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <RegistroComunicazioni />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="fatture-emesse" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <FattureEmesse />
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="fatture-ingresso" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <FattureIngresso />
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="fatture-consulenti" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <FattureConsulenti />
                    </TabsContent>
                  )}

                  <TabsContent value="costi-vivi" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <CostiVivi user={user} />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="costi-generali" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <CostiGenerali />
                    </TabsContent>
                  )}

                  <TabsContent value="centro-costo" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <CentroCostoDashboard />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="nuova" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <NewProjectForm
                          onProjectSaved={setPendingProject}
                        />
                        <FolderStructureCard
                          pendingProject={pendingProject}
                        />
                      </div>
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="clienti" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <ClientsTable />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}


            {/* System Panel */}
            {activeTab === "sistema" && (
              <div data-testid="system-panel">
                <Tabs value={activeSubTab.sistema} onValueChange={(value) => handleSubTabChange("sistema", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 overflow-x-auto">
                    <TabsList className="inline-flex w-auto min-w-full bg-transparent border-0 p-0">
                      <TabsTrigger
                        value="storage"
                        className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-storage"
                      >
                        Storage
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger
                          value="users"
                          className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-users"
                        >
                          Gestione Utenti
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger
                          value="profili-costo"
                          className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-profili-costo"
                        >
                          Profili Costo
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="activity-log"
                        className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-activity-log"
                      >
                        Log Attività
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="storage" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <StoragePanel />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="users" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <UsersManagement />
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="profili-costo" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <ProfiliCostoManagement />
                    </TabsContent>
                  )}

                  <TabsContent value="activity-log" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <ActivityLogViewer userId={isAdmin ? undefined : user?.id} showAll={isAdmin} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
