import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Check, Clock, Euro, Download, FileText } from "lucide-react";
import { PdfUpload } from "@/components/ui/pdf-upload";
import type { Project } from "@shared/schema";
import {
  formatCurrency,
  formatDate,
  calculateTotals,
  getProjectDisplayName,
  getTodayISO,
  calculateIVA,
  calculateTotalWithIVA
} from "@/lib/financial-utils";

// Configurazione per tipo fattura
export interface InvoiceConfig {
  type: 'emesse' | 'ingresso' | 'consulenti';
  apiEndpoint: string;
  queryKey: string;
  title: string;
  entityLabel: string; // "Cliente", "Fornitore", "Consulente"
  includeIVA: boolean;
  includeCategoria: boolean;
  statusField: 'incassata' | 'pagata';
  statusLabels: { true: string; false: string };
  amountInCents: boolean;
  categories?: { value: string; label: string; icon: string; color: string }[];
}

// Configurazioni predefinite
export const INVOICE_CONFIGS: Record<string, InvoiceConfig> = {
  emesse: {
    type: 'emesse',
    apiEndpoint: '/api/fatture-emesse',
    queryKey: 'fatture-emesse',
    title: 'Fatture Emesse',
    entityLabel: 'Cliente',
    includeIVA: true,
    includeCategoria: false,
    statusField: 'incassata',
    statusLabels: { true: 'Incassata', false: 'Da incassare' },
    amountInCents: false
  },
  ingresso: {
    type: 'ingresso',
    apiEndpoint: '/api/fatture-ingresso',
    queryKey: 'fatture-ingresso',
    title: 'Fatture Ingresso',
    entityLabel: 'Fornitore',
    includeIVA: false,
    includeCategoria: true,
    statusField: 'pagata',
    statusLabels: { true: 'Pagata', false: 'Da pagare' },
    amountInCents: true,
    categories: [
      { value: 'materiali', label: 'Materiali', icon: '📦', color: 'bg-blue-100 text-blue-700' },
      { value: 'collaborazione_esterna', label: 'Collaborazione Esterna', icon: '👥', color: 'bg-purple-100 text-purple-700' },
      { value: 'costo_vivo', label: 'Costo Vivo', icon: '💳', color: 'bg-orange-100 text-orange-700' },
      { value: 'altro', label: 'Altro', icon: '📋', color: 'bg-gray-100 text-gray-700' }
    ]
  },
  consulenti: {
    type: 'consulenti',
    apiEndpoint: '/api/fatture-consulenti',
    queryKey: 'fatture-consulenti',
    title: 'Fatture Consulenti',
    entityLabel: 'Consulente',
    includeIVA: false,
    includeCategoria: false,
    statusField: 'pagata',
    statusLabels: { true: 'Pagata', false: 'Da pagare' },
    amountInCents: false
  }
};

interface GenericInvoiceManagerProps {
  config: InvoiceConfig;
}

interface Invoice {
  id: string;
  projectId: string;
  numeroFattura: string;
  dataEmissione: string;
  dataScadenzaPagamento: string;
  importo: number;
  importoIVA?: number;
  importoTotale?: number;
  descrizione: string;
  incassata?: boolean;
  pagata?: boolean;
  dataIncasso?: string;
  dataPagamento?: string;
  allegato?: string;
  note?: string;
  cliente?: string;
  fornitore?: string;
  consulente?: string;
  categoria?: string;
}

export default function GenericInvoiceManager({ config }: GenericInvoiceManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state dinamico basato sulla configurazione
  const getInitialFormData = () => ({
    projectId: "",
    numeroFattura: "",
    [config.entityLabel.toLowerCase()]: "", // cliente/fornitore/consulente
    dataEmissione: getTodayISO(),
    dataScadenzaPagamento: "",
    importo: 0,
    ...(config.includeIVA ? { importoIVA: 0, importoTotale: 0 } : {}),
    ...(config.includeCategoria ? { categoria: config.categories?.[0]?.value || "" } : {}),
    descrizione: "",
    [config.statusField]: false,
    ...(config.statusField === 'incassata' ? { dataIncasso: "" } : { dataPagamento: "" }),
    allegato: "",
    note: ""
  });

  const [formData, setFormData] = useState(getInitialFormData());

  // Fetch fatture
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: [config.queryKey],
    queryFn: async () => {
      const response = await apiRequest("GET", config.apiEndpoint);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  // Fetch progetti
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", config.apiEndpoint, data);
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast({ title: "Successo", description: "Fattura creata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante la creazione", variant: "destructive" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `${config.apiEndpoint}/${id}`, data);
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast({ title: "Successo", description: "Fattura aggiornata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `${config.apiEndpoint}/${id}`);
      if (!response.ok && response.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast({ title: "Successo", description: "Fattura eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'eliminazione", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData(getInitialFormData());
    setEditingInvoice(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const entityField = config.entityLabel.toLowerCase();
    const entityValue = invoice.cliente || invoice.fornitore || invoice.consulente || "";

    setFormData({
      projectId: invoice.projectId,
      numeroFattura: invoice.numeroFattura,
      [entityField]: entityValue,
      dataEmissione: invoice.dataEmissione?.split('T')[0] || getTodayISO(),
      dataScadenzaPagamento: invoice.dataScadenzaPagamento?.split('T')[0] || "",
      importo: config.amountInCents ? invoice.importo / 100 : invoice.importo,
      ...(config.includeIVA ? {
        importoIVA: invoice.importoIVA || 0,
        importoTotale: invoice.importoTotale || 0
      } : {}),
      ...(config.includeCategoria ? { categoria: invoice.categoria || "" } : {}),
      descrizione: invoice.descrizione || "",
      [config.statusField]: invoice[config.statusField] || false,
      ...(config.statusField === 'incassata'
        ? { dataIncasso: invoice.dataIncasso?.split('T')[0] || "" }
        : { dataPagamento: invoice.dataPagamento?.split('T')[0] || "" }
      ),
      allegato: invoice.allegato || "",
      note: invoice.note || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entityField = config.entityLabel.toLowerCase();
    const submitData = {
      ...formData,
      [entityField]: formData[entityField],
      ...(config.amountInCents ? { importo: Math.round(formData.importo * 100) } : {})
    };

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleImportoChange = (importo: number) => {
    if (config.includeIVA) {
      const iva = calculateIVA(importo);
      const totale = calculateTotalWithIVA(importo);
      setFormData(prev => ({ ...prev, importo, importoIVA: iva, importoTotale: totale }));
    } else {
      setFormData(prev => ({ ...prev, importo }));
    }
  };

  const toggleStatus = async (invoice: Invoice) => {
    const currentStatus = invoice[config.statusField] || false;
    const newStatus = !currentStatus;
    const dateField = config.statusField === 'incassata' ? 'dataIncasso' : 'dataPagamento';

    await updateMutation.mutateAsync({
      id: invoice.id,
      data: {
        [config.statusField]: newStatus,
        [dateField]: newStatus ? getTodayISO() : ""
      }
    });
  };

  // Filtraggio
  const filteredInvoices = invoices.filter(inv => {
    if (filterProjectId !== "all" && inv.projectId !== filterProjectId) return false;
    const isPaid = inv[config.statusField] || false;
    if (filterStatus === "paid" && !isPaid) return false;
    if (filterStatus === "unpaid" && isPaid) return false;
    return true;
  });

  // Calcolo totali
  const getAmount = (inv: Invoice) => {
    const rawAmount = config.includeIVA ? (inv.importoTotale || inv.importo) : inv.importo;
    return config.amountInCents ? rawAmount / 100 : rawAmount;
  };

  const totals = {
    total: filteredInvoices.reduce((acc, inv) => acc + getAmount(inv), 0),
    paid: filteredInvoices.filter(inv => inv[config.statusField]).reduce((acc, inv) => acc + getAmount(inv), 0),
    get pending() { return this.total - this.paid; }
  };

  // Helper per ottenere il valore dell'entità (cliente/fornitore/consulente)
  const getEntityValue = (invoice: Invoice): string => {
    return invoice.cliente || invoice.fornitore || invoice.consulente || "";
  };

  // Helper per categoria
  const getCategoryConfig = (categoria?: string) => {
    if (!config.categories || !categoria) return null;
    return config.categories.find(c => c.value === categoria);
  };

  return (
    <div className="space-y-4">
      {/* Filtri e Azioni */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Select value={filterProjectId} onValueChange={setFilterProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tutte le commesse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le commesse</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tutte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="paid">{config.statusLabels.true}</SelectItem>
              <SelectItem value="unpaid">{config.statusLabels.false}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuova Fattura
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Totale</span>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{config.statusLabels.true}</span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{config.statusLabels.false}</span>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.pending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabella */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 animate-pulse space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessuna fattura</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Fattura</TableHead>
                    <TableHead>Commessa</TableHead>
                    <TableHead>{config.entityLabel}</TableHead>
                    {config.includeCategoria && <TableHead>Categoria</TableHead>}
                    <TableHead>Data</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const catConfig = getCategoryConfig(invoice.categoria);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.numeroFattura}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {getProjectDisplayName(invoice.projectId, projects)}
                        </TableCell>
                        <TableCell>{getEntityValue(invoice)}</TableCell>
                        {config.includeCategoria && (
                          <TableCell>
                            {catConfig && (
                              <Badge className={catConfig.color}>
                                {catConfig.icon} {catConfig.label}
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell>{formatDate(invoice.dataEmissione)}</TableCell>
                        <TableCell>{formatDate(invoice.dataScadenzaPagamento)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(getAmount(invoice))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={invoice[config.statusField] ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleStatus(invoice)}
                          >
                            {invoice[config.statusField]
                              ? config.statusLabels.true
                              : config.statusLabels.false}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {invoice.allegato && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={invoice.allegato} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questa fattura?")) {
                                  deleteMutation.mutate(invoice.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Modifica Fattura" : `Nuova Fattura ${config.title.split(' ')[1]}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Commessa *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona commessa" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.code} - {p.object}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroFattura">Numero Fattura *</Label>
                <Input
                  id="numeroFattura"
                  value={formData.numeroFattura}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroFattura: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">{config.entityLabel} *</Label>
              <Input
                id="entity"
                value={formData[config.entityLabel.toLowerCase()] || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [config.entityLabel.toLowerCase()]: e.target.value
                }))}
                required
              />
            </div>

            {config.includeCategoria && config.categories && (
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataEmissione">Data Emissione *</Label>
                <Input
                  id="dataEmissione"
                  type="date"
                  value={formData.dataEmissione}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEmissione: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataScadenzaPagamento">Data Scadenza *</Label>
                <Input
                  id="dataScadenzaPagamento"
                  type="date"
                  value={formData.dataScadenzaPagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataScadenzaPagamento: e.target.value }))}
                  required
                />
              </div>
            </div>

            {config.includeIVA ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="importo">Imponibile *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="importo"
                      type="number"
                      step="0.01"
                      className="pl-9"
                      value={formData.importo}
                      onChange={(e) => handleImportoChange(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importoIVA">IVA (22%)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="importoIVA"
                      type="number"
                      step="0.01"
                      className="pl-9 bg-gray-50"
                      value={formData.importoIVA || 0}
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importoTotale">Totale</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="importoTotale"
                      type="number"
                      step="0.01"
                      className="pl-9 bg-gray-50"
                      value={formData.importoTotale || 0}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="importo">Importo *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="importo"
                    type="number"
                    step="0.01"
                    className="pl-9"
                    value={formData.importo}
                    onChange={(e) => handleImportoChange(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione *</Label>
              <Textarea
                id="descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">{config.statusLabels.true}</Label>
              <Switch
                id="status"
                checked={formData[config.statusField] || false}
                onCheckedChange={(checked) => {
                  const dateField = config.statusField === 'incassata' ? 'dataIncasso' : 'dataPagamento';
                  setFormData(prev => ({
                    ...prev,
                    [config.statusField]: checked,
                    [dateField]: checked ? getTodayISO() : ""
                  }));
                }}
              />
            </div>

            {formData[config.statusField] && (
              <div className="space-y-2">
                <Label htmlFor="dateStatus">
                  Data {config.statusField === 'incassata' ? 'Incasso' : 'Pagamento'}
                </Label>
                <Input
                  id="dateStatus"
                  type="date"
                  value={formData[config.statusField === 'incassata' ? 'dataIncasso' : 'dataPagamento'] || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [config.statusField === 'incassata' ? 'dataIncasso' : 'dataPagamento']: e.target.value
                  }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Allegato PDF</Label>
              <PdfUpload
                value={formData.allegato}
                onChange={(url) => setFormData(prev => ({ ...prev, allegato: url }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingInvoice ? "Aggiorna" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export wrapper components per mantenere retrocompatibilità
export function FattureEmesseManager() {
  return <GenericInvoiceManager config={INVOICE_CONFIGS.emesse} />;
}

export function FattureIngressoManager() {
  return <GenericInvoiceManager config={INVOICE_CONFIGS.ingresso} />;
}

export function FattureConsulentiManager() {
  return <GenericInvoiceManager config={INVOICE_CONFIGS.consulenti} />;
}
