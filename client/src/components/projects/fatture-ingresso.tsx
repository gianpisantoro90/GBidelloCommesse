import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Trash2, Euro, Calendar, CheckCircle, Clock, AlertCircle, Receipt } from "lucide-react";
import { type Project } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

interface FatturaIngresso {
  id: string;
  projectId: string;
  numeroFattura: string;
  fornitore: string;
  dataEmissione: string;
  dataScadenzaPagamento: string;
  importo: number; // centesimi
  categoria: 'materiali' | 'collaborazione_esterna' | 'costo_vivo' | 'altro';
  descrizione: string;
  pagata: boolean;
  dataPagamento?: string;
  note?: string;
  allegato?: string;
}

const CATEGORIE_FATTURA = [
  { value: 'materiali', label: 'Materiali', icon: '📦', color: 'bg-blue-100 text-blue-700' },
  { value: 'collaborazione_esterna', label: 'Collaborazione Esterna', icon: '👥', color: 'bg-purple-100 text-purple-700' },
  { value: 'costo_vivo', label: 'Costo Vivo', icon: '💳', color: 'bg-orange-100 text-orange-700' },
  { value: 'altro', label: 'Altro', icon: '📋', color: 'bg-gray-100 text-gray-700' }
];

export default function FattureIngresso() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FatturaIngresso | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [invoiceToDelete, setInvoiceToDelete] = useState<FatturaIngresso | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    numeroFattura: "",
    fornitore: "",
    dataEmissione: new Date().toISOString().split('T')[0],
    dataScadenzaPagamento: "",
    importo: 0,
    categoria: "materiali" as FatturaIngresso['categoria'],
    descrizione: "",
    note: ""
  });

  // Fetch progetti
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"]
  });

  // Fetch fatture ingresso
  const { data: invoices = [], isLoading } = useQuery<FatturaIngresso[]>({
    queryKey: ["/api/fatture-ingresso"]
  });

  // Create/Update invoice mutation
  const saveInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingInvoice
        ? `/api/fatture-ingresso/${editingInvoice.id}`
        : "/api/fatture-ingresso";
      const method = editingInvoice ? "PUT" : "POST";

      const response = await apiRequest(method, url, data);
      if (!response.ok) throw new Error("Errore nel salvataggio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fatture-ingresso"] });
      toast({
        title: editingInvoice ? "Fattura aggiornata" : "Fattura registrata",
        description: "La fattura in ingresso è stata salvata con successo"
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/fatture-ingresso/${id}`);
      // 204 No Content doesn't have a body, so don't try to parse JSON
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fatture-ingresso"] });
      toast({
        title: "Fattura eliminata",
        description: "La fattura è stata rimossa con successo"
      });
      setInvoiceToDelete(null);
    }
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/fatture-ingresso/${id}`, {
        pagata: true,
        dataPagamento: new Date().toISOString()
      });
      if (!response.ok) throw new Error("Errore nell'aggiornamento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fatture-ingresso"] });
      toast({
        title: "Pagamento registrato",
        description: "La fattura è stata marcata come pagata"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      numeroFattura: "",
      fornitore: "",
      dataEmissione: new Date().toISOString().split('T')[0],
      dataScadenzaPagamento: "",
      importo: 0,
      categoria: "materiali",
      descrizione: "",
      note: ""
    });
    setSelectedProject("");
    setEditingInvoice(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      toast({
        title: "Errore",
        description: "Seleziona una commessa",
        variant: "destructive"
      });
      return;
    }

    saveInvoiceMutation.mutate({
      projectId: selectedProject,
      ...formData,
      importo: Math.round(formData.importo * 100), // Converti in centesimi
      pagata: false
    });
  };

  const handleEdit = (invoice: FatturaIngresso) => {
    setEditingInvoice(invoice);
    setSelectedProject(invoice.projectId);
    setFormData({
      numeroFattura: invoice.numeroFattura,
      fornitore: invoice.fornitore,
      dataEmissione: invoice.dataEmissione.split('T')[0],
      dataScadenzaPagamento: invoice.dataScadenzaPagamento?.split('T')[0] || "",
      importo: invoice.importo / 100,
      categoria: invoice.categoria,
      descrizione: invoice.descrizione,
      note: invoice.note || ""
    });
    setIsDialogOpen(true);
  };

  const getCategoriaConfig = (categoria: string) => {
    return CATEGORIE_FATTURA.find(c => c.value === categoria) || CATEGORIE_FATTURA[0];
  };

  // Calcola statistiche
  const stats = {
    totale: invoices.length,
    pagate: invoices.filter(i => i.pagata).length,
    daPagare: invoices.filter(i => !i.pagata).length,
    scadute: invoices.filter(i => !i.pagata && new Date(i.dataScadenzaPagamento) < new Date()).length,
    importoTotale: invoices.reduce((sum, i) => sum + i.importo, 0),
    importoPagato: invoices.filter(i => i.pagata).reduce((sum, i) => sum + i.importo, 0),
    importoDaPagare: invoices.filter(i => !i.pagata).reduce((sum, i) => sum + i.importo, 0)
  };

  // Raggruppa per progetto
  const groupedInvoices = projects.map(project => {
    const projectInvoices = invoices.filter(i => i.projectId === project.id);
    const totaleSpeso = projectInvoices.reduce((sum, i) => sum + i.importo, 0);
    const totalePagato = projectInvoices.filter(i => i.pagata).reduce((sum, i) => sum + i.importo, 0);

    return {
      project,
      invoices: projectInvoices,
      totaleSpeso,
      totalePagato,
      totaleDaPagare: totaleSpeso - totalePagato
    };
  }).filter(group => group.invoices.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-red-600" />
            Fatture in Ingresso
          </h2>
          <p className="text-gray-600 mt-1">Gestione fatture fornitori, materiali e collaborazioni</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuova Fattura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? "Modifica Fattura" : "Registra Nuova Fattura in Ingresso"}</DialogTitle>
              <DialogDescription>
                Inserisci i dati della fattura ricevuta da fornitori o collaboratori
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="project">Commessa *</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  disabled={!!editingInvoice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona commessa" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.code} - {project.object}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroFattura">Numero Fattura *</Label>
                  <Input
                    id="numeroFattura"
                    value={formData.numeroFattura}
                    onChange={(e) => setFormData({ ...formData, numeroFattura: e.target.value })}
                    placeholder="es. FT-2025-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fornitore">Fornitore *</Label>
                  <Input
                    id="fornitore"
                    value={formData.fornitore}
                    onChange={(e) => setFormData({ ...formData, fornitore: e.target.value })}
                    placeholder="Nome fornitore"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_FATTURA.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descrizione">Descrizione *</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrizione materiali/servizi..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dataEmissione">Data Emissione *</Label>
                  <Input
                    id="dataEmissione"
                    type="date"
                    value={formData.dataEmissione}
                    onChange={(e) => setFormData({ ...formData, dataEmissione: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataScadenzaPagamento">Scadenza Pagamento *</Label>
                  <Input
                    id="dataScadenzaPagamento"
                    type="date"
                    value={formData.dataScadenzaPagamento}
                    onChange={(e) => setFormData({ ...formData, dataScadenzaPagamento: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="importo">Importo (€) *</Label>
                  <Input
                    id="importo"
                    type="number"
                    step="0.01"
                    value={formData.importo}
                    onChange={(e) => setFormData({ ...formData, importo: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit" disabled={saveInvoiceMutation.isPending}>
                  {saveInvoiceMutation.isPending ? "Salvando..." : "Salva Fattura"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fatture Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totale}</div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Pagate: {stats.pagate} | Da pagare: {stats.daPagare}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Importo Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                €{(stats.importoTotale / 100).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <Euro className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Già Pagato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                €{(stats.importoPagato / 100).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Da Pagare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">
                €{(stats.importoDaPagare / 100).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            {stats.scadute > 0 && (
              <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {stats.scadute} scadute
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabelle Fatture */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tutte le Fatture</TabsTrigger>
          <TabsTrigger value="by-project">Per Commessa</TabsTrigger>
          <TabsTrigger value="unpaid">Da Pagare</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <p className="text-center text-gray-500 py-8">Caricamento...</p>
              ) : invoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessuna fattura registrata</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">N. Fattura</th>
                        <th className="text-left py-3 px-4">Fornitore</th>
                        <th className="text-left py-3 px-4">Commessa</th>
                        <th className="text-left py-3 px-4">Categoria</th>
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-right py-3 px-4">Importo</th>
                        <th className="text-center py-3 px-4">Stato</th>
                        <th className="text-center py-3 px-4">Scadenza</th>
                        <th className="text-center py-3 px-4">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(invoice => {
                        const project = projects.find(p => p.id === invoice.projectId);
                        const catConfig = getCategoriaConfig(invoice.categoria);
                        const isScaduta = !invoice.pagata && new Date(invoice.dataScadenzaPagamento) < new Date();

                        return (
                          <tr key={invoice.id} className={`border-b hover:bg-gray-50 ${isScaduta ? 'bg-red-50' : ''}`}>
                            <td className="py-3 px-4 font-medium">{invoice.numeroFattura}</td>
                            <td className="py-3 px-4">{invoice.fornitore}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                <div className="font-medium">{project?.code}</div>
                                <div className="text-gray-500 truncate max-w-xs">{project?.object}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={catConfig.color}>
                                {catConfig.icon} {catConfig.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {format(new Date(invoice.dataEmissione), 'dd/MM/yyyy', { locale: it })}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-red-600">
                              €{(invoice.importo / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {invoice.pagata ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Pagata
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Da pagare
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-sm">
                              <div className={isScaduta ? 'text-red-600 font-semibold' : ''}>
                                {format(new Date(invoice.dataScadenzaPagamento), 'dd/MM/yyyy', { locale: it })}
                                {isScaduta && <div className="text-xs">SCADUTA</div>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                {!invoice.pagata && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsPaidMutation.mutate(invoice.id)}
                                    title="Segna come pagata"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(invoice)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setInvoiceToDelete(invoice)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-project" className="space-y-4">
          {groupedInvoices.map(group => (
            <Card key={group.project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{group.project.code}</CardTitle>
                    <CardDescription className="mt-1">{group.project.object}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Totale Speso</div>
                    <div className="text-xl font-bold text-red-600">
                      €{(group.totaleSpeso / 100).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.invoices.map(invoice => {
                    const catConfig = getCategoriaConfig(invoice.categoria);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{invoice.numeroFattura}</span>
                            <Badge className={catConfig.color}>
                              {catConfig.icon} {catConfig.label}
                            </Badge>
                            {invoice.pagata && (
                              <Badge className="bg-green-100 text-green-800">Pagata</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {invoice.fornitore} - {invoice.descrizione}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            €{(invoice.importo / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            Scad: {format(new Date(invoice.dataScadenzaPagamento), 'dd/MM/yy', { locale: it })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          {groupedInvoices.length === 0 && (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-gray-500">Nessuna fattura registrata</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {invoices.filter(i => !i.pagata).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nessuna fattura da pagare</p>
              ) : (
                <div className="space-y-3">
                  {invoices
                    .filter(i => !i.pagata)
                    .sort((a, b) => new Date(a.dataScadenzaPagamento).getTime() - new Date(b.dataScadenzaPagamento).getTime())
                    .map(invoice => {
                      const project = projects.find(p => p.id === invoice.projectId);
                      const catConfig = getCategoriaConfig(invoice.categoria);
                      const isScaduta = new Date(invoice.dataScadenzaPagamento) < new Date();

                      return (
                        <div key={invoice.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${isScaduta ? 'border-red-300 bg-red-50' : ''}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="font-semibold">{invoice.numeroFattura}</div>
                              <Badge className={catConfig.color}>
                                {catConfig.icon} {catConfig.label}
                              </Badge>
                              {isScaduta && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  SCADUTA
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {invoice.fornitore} - {project?.code}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Scadenza: {format(new Date(invoice.dataScadenzaPagamento), 'dd MMMM yyyy', { locale: it })}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-600">
                                €{(invoice.importo / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => markAsPaidMutation.mutate(invoice.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Segna Pagata
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la fattura?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la fattura <strong>{invoiceToDelete?.numeroFattura}</strong>?
              <br />
              <span className="text-red-600 mt-2 block">
                Questa azione non può essere annullata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToDelete && deleteInvoiceMutation.mutate(invoiceToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina Fattura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
