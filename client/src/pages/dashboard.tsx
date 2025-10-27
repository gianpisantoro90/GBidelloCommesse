import { useState } from "react";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import StatsCard from "@/components/dashboard/stats-card";
import RecentProjectsTable from "@/components/dashboard/recent-projects-table";
import EconomicDashboardCard from "@/components/dashboard/economic-dashboard-card";
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
import CostiVivi from "@/components/projects/costi-vivi";
import CentroCostoDashboard from "@/components/projects/centro-costo-dashboard";
import StoragePanel from "@/components/system/storage-panel";
import UsersManagement from "@/components/system/users-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Project } from "@shared/schema";
import { User } from "@/hooks/useAuth";

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // DEBUG: Log user info
  console.log("Dashboard - User object:", user);
  console.log("Dashboard - User role:", user?.role);
  console.log("Dashboard - Is admin?:", user?.role === "amministratore");

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
                        📋 Commesse
                      </TabsTrigger>
                      <TabsTrigger
                        value="nuova"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-nuova"
                      >
                        ➕ Nuova
                      </TabsTrigger>
                      <TabsTrigger
                        value="centro-costo"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-centro-costo"
                      >
                        💰 Centro Costo
                      </TabsTrigger>
                      {user?.role === "amministratore" && (
                        <TabsTrigger
                          value="fatture-ingresso"
                          className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                          data-testid="tab-fatture-ingresso"
                        >
                          📥 Fatt. Ingresso
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="costi-vivi"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-costi-vivi"
                      >
                        💳 Costi Vivi
                      </TabsTrigger>
                      <TabsTrigger
                        value="scadenzario"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-scadenzario"
                      >
                        📅 Scadenze
                      </TabsTrigger>
                      <TabsTrigger
                        value="comunicazioni"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-comunicazioni"
                      >
                        💬 Comunicazioni
                      </TabsTrigger>
                      <TabsTrigger
                        value="risorse"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-risorse"
                      >
                        👷 Risorse
                      </TabsTrigger>
                      <TabsTrigger
                        value="clienti"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-clienti"
                      >
                        👥 Clienti
                      </TabsTrigger>
                      <TabsTrigger
                        value="kpi"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-kpi"
                      >
                        📊 KPI
                      </TabsTrigger>
                      <TabsTrigger
                        value="parcella"
                        className="px-4 py-3 text-xs font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none whitespace-nowrap"
                        data-testid="tab-parcella"
                      >
                        💰 Calc. Parcella
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="progetti" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <ProjectsTable />
                  </TabsContent>

                  <TabsContent value="risorse" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <GestioneRisorse />
                  </TabsContent>

                  <TabsContent value="kpi" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <KpiDashboard />
                  </TabsContent>

                  <TabsContent value="parcella" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <ParcellaCalculator />
                  </TabsContent>

                  <TabsContent value="scadenzario" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <Scadenzario />
                  </TabsContent>

                  <TabsContent value="comunicazioni" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <RegistroComunicazioni />
                  </TabsContent>

                  {user?.role === "amministratore" && (
                    <TabsContent value="fatture-ingresso" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <FattureIngresso />
                    </TabsContent>
                  )}

                  <TabsContent value="costi-vivi" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <CostiVivi />
                  </TabsContent>

                  <TabsContent value="centro-costo" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <CentroCostoDashboard />
                  </TabsContent>

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
                  
                  <TabsContent value="clienti" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <ClientsTable />
                  </TabsContent>
                </Tabs>
              </div>
            )}


            {/* System Panel */}
            {activeTab === "sistema" && (
              <div data-testid="system-panel">
                <Tabs value={activeSubTab.sistema} onValueChange={(value) => handleSubTabChange("sistema", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200">
                    <TabsList className="flex w-full bg-transparent border-0 p-0">
                      <TabsTrigger
                        value="storage"
                        className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none"
                        data-testid="tab-storage"
                      >
                        💾 Storage
                      </TabsTrigger>
                      {user?.role === "amministratore" && (
                        <TabsTrigger
                          value="users"
                          className="px-6 py-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary hover:bg-gray-50 transition-colors rounded-none"
                          data-testid="tab-users"
                        >
                          👥 Gestione Utenti
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  
                  <TabsContent value="storage" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                    <StoragePanel />
                  </TabsContent>

                  {user?.role === "amministratore" && (
                    <TabsContent value="users" className="bg-white rounded-b-2xl shadow-lg border border-gray-100 p-6 mt-0">
                      <UsersManagement />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
