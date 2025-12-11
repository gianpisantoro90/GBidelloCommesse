import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, FileText, Check, Clock, Euro, Download } from "lucide-react";
import { PdfUpload } from "@/components/ui/pdf-upload";
import type { FatturaEmessa, Project } from "@shared/schema";

export default function FattureEmesse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFattura, setEditingFattura] = useState<FatturaEmessa | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    projectId: "",
    numeroFattura: "",
    cliente: "",
    dataEmissione: new Date().toISOString().split('T')[0],
    dataScadenzaPagamento: "",
    importo: 0,
    importoIVA: 0,
    importoTotale: 0,
    descrizione: "",
    incassata: false,
    dataIncasso: "",
    allegato: "",
    note: ""
  });

  const { data: fatture = [], isLoading } = useQuery<FatturaEmessa[]>({
    queryKey: ["fatture-emesse"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/fatture-emesse");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/fatture-emesse", data);
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-emesse"] });
      toast({ title: "Successo", description: "Fattura creata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante la creazione", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PUT", `/api/fatture-emesse/${id}`, data);
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-emesse"] });
      toast({ title: "Successo", description: "Fattura aggiornata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/fatture-emesse/${id}`);
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-emesse"] });
      toast({ title: "Successo", description: "Fattura eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'eliminazione", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      projectId: "",
      numeroFattura: "",
      cliente: "",
      dataEmissione: new Date().toISOString().split('T')[0],
      dataScadenzaPagamento: "",
      importo: 0,
      importoIVA: 0,
      importoTotale: 0,
      descrizione: "",
      incassata: false,
      dataIncasso: "",
      allegato: "",
      note: ""
    });
    setEditingFattura(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (fattura: FatturaEmessa) => {
    setEditingFattura(fattura);
    setFormData({
      projectId: fattura.projectId,
      numeroFattura: fattura.numeroFattura,
      cliente: fattura.cliente,
      dataEmissione: fattura.dataEmissione,
      dataScadenzaPagamento: fattura.dataScadenzaPagamento,
      importo: fattura.importo,
      importoIVA: fattura.importoIVA || 0,
      importoTotale: fattura.importoTotale,
      descrizione: fattura.descrizione,
      incassata: fattura.incassata,
      dataIncasso: fattura.dataIncasso || "",
      allegato: fattura.allegato || "",
      note: fattura.note || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFattura) {
      updateMutation.mutate({ id: editingFattura.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImportoChange = (importo: number) => {
    const iva = importo * 0.22;
    const totale = importo + iva;
    setFormData(prev => ({
      ...prev,
      importo,
      importoIVA: Math.round(iva * 100) / 100,
      importoTotale: Math.round(totale * 100) / 100
    }));
  };

  const toggleIncassata = async (fattura: FatturaEmessa) => {
    const newStatus = !fattura.incassata;
    await updateMutation.mutateAsync({
      id: fattura.id,
      data: {
        incassata: newStatus,
        dataIncasso: newStatus ? new Date().toISOString().split('T')[0] : ""
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.code} - ${project.object}` : projectId;
  };

  const filteredFatture = fatture.filter(f => {
    if (filterProjectId !== "all" && f.projectId !== filterProjectId) return false;
    if (filterStatus === "incassate" && !f.incassata) return false;
    if (filterStatus === "da_incassare" && f.incassata) return false;
    return true;
  });

  const totaleEmesso = filteredFatture.reduce((acc, f) => acc + f.importoTotale, 0);
  const totaleIncassato = filteredFatture.filter(f => f.incassata).reduce((acc, f) => acc + f.importoTotale, 0);

  return (
    <div className="space-y-4">
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
              <SelectItem value="incassate">Incassate</SelectItem>
              <SelectItem value="da_incassare">Da incassare</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuova Fattura
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Totale Emesso</span>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totaleEmesso)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Incassato</span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totaleIncassato)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Da Incassare</span>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totaleEmesso - totaleIncassato)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 animate-pulse space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : filteredFatture.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessuna fattura emessa</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Fattura</TableHead>
                    <TableHead>Commessa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Emissione</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFatture.map((fattura) => (
                    <TableRow key={fattura.id}>
                      <TableCell className="font-medium">{fattura.numeroFattura}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {getProjectName(fattura.projectId)}
                      </TableCell>
                      <TableCell>{fattura.cliente}</TableCell>
                      <TableCell>{formatDate(fattura.dataEmissione)}</TableCell>
                      <TableCell>{formatDate(fattura.dataScadenzaPagamento)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(fattura.importoTotale)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={fattura.incassata ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleIncassata(fattura)}
                        >
                          {fattura.incassata ? "Incassata" : "Da incassare"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {fattura.allegato && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={fattura.allegato} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(fattura)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questa fattura?")) {
                                deleteMutation.mutate(fattura.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFattura ? "Modifica Fattura" : "Nuova Fattura Emessa"}
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
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                required
              />
            </div>

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
                    className="pl-9"
                    value={formData.importoIVA}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      importoIVA: parseFloat(e.target.value) || 0,
                      importoTotale: prev.importo + (parseFloat(e.target.value) || 0)
                    }))}
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
                    value={formData.importoTotale}
                    readOnly
                  />
                </div>
              </div>
            </div>

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
              <Label htmlFor="incassata">Incassata</Label>
              <Switch
                id="incassata"
                checked={formData.incassata}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  incassata: checked,
                  dataIncasso: checked ? new Date().toISOString().split('T')[0] : ""
                }))}
              />
            </div>

            {formData.incassata && (
              <div className="space-y-2">
                <Label htmlFor="dataIncasso">Data Incasso</Label>
                <Input
                  id="dataIncasso"
                  type="date"
                  value={formData.dataIncasso}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataIncasso: e.target.value }))}
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
                {editingFattura ? "Aggiorna" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
