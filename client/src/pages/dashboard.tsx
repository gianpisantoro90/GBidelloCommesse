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
    commesse: "lista",
    economia: "fatture-emesse",
    costi: "costi-vivi",
    operativita: "scadenze",
    anagrafica: "clienti",
    sistema: "storage",
  });
  const [pendingProject, setPendingProject] = useState(null);

  const handleSubTabChange = (mainTab: string, subTab: string) => {
    setActiveSubTab(prev => ({ ...prev, [mainTab]: subTab }));
  };

  // Stile comune per i tab trigger
  const tabTriggerClass = "px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:text-secondary data-[state=active]:bg-secondary/5 hover:bg-gray-50 transition-all rounded-none whitespace-nowrap";

  return (
    <div className="min-h-screen bg-g2-accent">
      <Header user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
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

            {/* COMMESSE Panel */}
            {activeTab === "commesse" && (
              <div data-testid="commesse-panel">
                <Tabs value={activeSubTab.commesse} onValueChange={(value) => handleSubTabChange("commesse", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
                    <TabsList className="flex w-full bg-transparent border-0 p-0">
                      <TabsTrigger value="lista" className={tabTriggerClass} data-testid="tab-lista">
                        Lista Commesse
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger value="nuova" className={tabTriggerClass} data-testid="tab-nuova">
                          + Nuova Commessa
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="lista" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <ProjectsTable />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="nuova" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <NewProjectForm onProjectSaved={setPendingProject} />
                        <FolderStructureCard pendingProject={pendingProject} />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            {/* ECONOMIA Panel - Solo Admin */}
            {activeTab === "economia" && isAdmin && (
              <div data-testid="economia-panel">
                <Tabs value={activeSubTab.economia} onValueChange={(value) => handleSubTabChange("economia", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
                    <TabsList className="flex w-full bg-transparent border-0 p-0 overflow-x-auto">
                      <TabsTrigger value="fatture-emesse" className={tabTriggerClass} data-testid="tab-fatture-emesse">
                        Fatture Emesse
                      </TabsTrigger>
                      <TabsTrigger value="fatture-ingresso" className={tabTriggerClass} data-testid="tab-fatture-ingresso">
                        Fatture Ingresso
                      </TabsTrigger>
                      <TabsTrigger value="fatture-consulenti" className={tabTriggerClass} data-testid="tab-fatture-consulenti">
                        Fatture Consulenti
                      </TabsTrigger>
                      <TabsTrigger value="costi-generali" className={tabTriggerClass} data-testid="tab-costi-generali">
                        Costi Generali
                      </TabsTrigger>
                      <TabsTrigger value="centro-costo" className={tabTriggerClass} data-testid="tab-centro-costo">
                        Centro Costo
                      </TabsTrigger>
                      <TabsTrigger value="kpi" className={tabTriggerClass} data-testid="tab-kpi">
                        KPI Dashboard
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="fatture-emesse" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <FattureEmesse />
                  </TabsContent>

                  <TabsContent value="fatture-ingresso" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <FattureIngresso />
                  </TabsContent>

                  <TabsContent value="fatture-consulenti" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <FattureConsulenti />
                  </TabsContent>

                  <TabsContent value="costi-generali" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <CostiGenerali />
                  </TabsContent>

                  <TabsContent value="centro-costo" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <CentroCostoDashboard />
                  </TabsContent>

                  <TabsContent value="kpi" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <KpiDashboard />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* COSTI Panel - Accessibile a tutti per Costi Vivi */}
            {activeTab === "costi" && (
              <div data-testid="costi-panel">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <CostiVivi user={user} />
                </div>
              </div>
            )}

            {/* OPERATIVITA Panel */}
            {activeTab === "operativita" && (
              <div data-testid="operativita-panel">
                <Tabs value={activeSubTab.operativita} onValueChange={(value) => handleSubTabChange("operativita", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
                    <TabsList className="flex w-full bg-transparent border-0 p-0">
                      <TabsTrigger value="scadenze" className={tabTriggerClass} data-testid="tab-scadenze">
                        Scadenzario
                      </TabsTrigger>
                      <TabsTrigger value="comunicazioni" className={tabTriggerClass} data-testid="tab-comunicazioni">
                        Comunicazioni
                      </TabsTrigger>
                      <TabsTrigger value="risorse" className={tabTriggerClass} data-testid="tab-risorse">
                        Gestione Risorse
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="scadenze" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <Scadenzario />
                  </TabsContent>

                  <TabsContent value="comunicazioni" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <RegistroComunicazioni />
                  </TabsContent>

                  <TabsContent value="risorse" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <GestioneRisorse />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ANAGRAFICA Panel - Solo Admin */}
            {activeTab === "anagrafica" && isAdmin && (
              <div data-testid="anagrafica-panel">
                <Tabs value={activeSubTab.anagrafica} onValueChange={(value) => handleSubTabChange("anagrafica", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
                    <TabsList className="flex w-full bg-transparent border-0 p-0">
                      <TabsTrigger value="clienti" className={tabTriggerClass} data-testid="tab-clienti">
                        Anagrafica Clienti
                      </TabsTrigger>
                      <TabsTrigger value="parcella" className={tabTriggerClass} data-testid="tab-parcella">
                        Calcolo Parcella
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="clienti" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <ClientsTable />
                  </TabsContent>

                  <TabsContent value="parcella" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <ParcellaCalculator />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* SISTEMA Panel */}
            {activeTab === "sistema" && (
              <div data-testid="sistema-panel">
                <Tabs value={activeSubTab.sistema} onValueChange={(value) => handleSubTabChange("sistema", value)}>
                  <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
                    <TabsList className="flex w-full bg-transparent border-0 p-0">
                      <TabsTrigger value="storage" className={tabTriggerClass} data-testid="tab-storage">
                        Storage
                      </TabsTrigger>
                      {isAdmin && (
                        <TabsTrigger value="users" className={tabTriggerClass} data-testid="tab-users">
                          Gestione Utenti
                        </TabsTrigger>
                      )}
                      {isAdmin && (
                        <TabsTrigger value="profili-costo" className={tabTriggerClass} data-testid="tab-profili-costo">
                          Profili Costo
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="activity-log" className={tabTriggerClass} data-testid="tab-activity-log">
                        Log Attività
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="storage" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                    <StoragePanel />
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="users" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                      <UsersManagement />
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="profili-costo" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
                      <ProfiliCostoManagement />
                    </TabsContent>
                  )}

                  <TabsContent value="activity-log" className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 p-6 mt-0">
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
