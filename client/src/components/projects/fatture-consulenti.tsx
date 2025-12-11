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
import { Plus, Pencil, Trash2, Building2, Check, Clock, Euro, Download } from "lucide-react";
import type { FatturaConsulente, Project } from "@shared/schema";

export default function FattureConsulenti() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFattura, setEditingFattura] = useState<FatturaConsulente | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    projectId: "",
    numeroFattura: "",
    consulente: "",
    dataEmissione: new Date().toISOString().split('T')[0],
    dataScadenzaPagamento: "",
    importo: 0,
    descrizione: "",
    pagata: false,
    dataPagamento: "",
    allegato: "",
    note: ""
  });

  const { data: fatture = [], isLoading } = useQuery<FatturaConsulente[]>({
    queryKey: ["fatture-consulenti"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/fatture-consulenti");
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
      const response = await apiRequest("POST", "/api/fatture-consulenti", data);
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-consulenti"] });
      toast({ title: "Successo", description: "Fattura creata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante la creazione", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PUT", `/api/fatture-consulenti/${id}`, data);
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-consulenti"] });
      toast({ title: "Successo", description: "Fattura aggiornata con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/fatture-consulenti/${id}`);
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fatture-consulenti"] });
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
      consulente: "",
      dataEmissione: new Date().toISOString().split('T')[0],
      dataScadenzaPagamento: "",
      importo: 0,
      descrizione: "",
      pagata: false,
      dataPagamento: "",
      allegato: "",
      note: ""
    });
    setEditingFattura(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (fattura: FatturaConsulente) => {
    setEditingFattura(fattura);
    setFormData({
      projectId: fattura.projectId,
      numeroFattura: fattura.numeroFattura,
      consulente: fattura.consulente,
      dataEmissione: fattura.dataEmissione,
      dataScadenzaPagamento: fattura.dataScadenzaPagamento,
      importo: fattura.importo,
      descrizione: fattura.descrizione,
      pagata: fattura.pagata,
      dataPagamento: fattura.dataPagamento || "",
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

  const togglePagata = async (fattura: FatturaConsulente) => {
    const newStatus = !fattura.pagata;
    await updateMutation.mutateAsync({
      id: fattura.id,
      data: {
        pagata: newStatus,
        dataPagamento: newStatus ? new Date().toISOString().split('T')[0] : ""
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
    if (filterStatus === "pagate" && !f.pagata) return false;
    if (filterStatus === "da_pagare" && f.pagata) return false;
    return true;
  });

  const totaleFatture = filteredFatture.reduce((acc, f) => acc + f.importo, 0);
  const totalePagate = filteredFatture.filter(f => f.pagata).reduce((acc, f) => acc + f.importo, 0);

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
              <SelectItem value="pagate">Pagate</SelectItem>
              <SelectItem value="da_pagare">Da pagare</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuova Fattura Consulente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Totale Fatture</span>
              <Building2 className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totaleFatture)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pagate</span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalePagate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Da Pagare</span>
              <Clock className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totaleFatture - totalePagate)}</p>
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
            <p className="text-center text-gray-500 py-8">Nessuna fattura consulente</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Fattura</TableHead>
                    <TableHead>Commessa</TableHead>
                    <TableHead>Consulente</TableHead>
                    <TableHead>Data</TableHead>
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
                      <TableCell>{fattura.consulente}</TableCell>
                      <TableCell>{formatDate(fattura.dataEmissione)}</TableCell>
                      <TableCell>{formatDate(fattura.dataScadenzaPagamento)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(fattura.importo)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={fattura.pagata ? "default" : "destructive"}
                          className="cursor-pointer"
                          onClick={() => togglePagata(fattura)}
                        >
                          {fattura.pagata ? "Pagata" : "Da pagare"}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFattura ? "Modifica Fattura" : "Nuova Fattura Consulente"}
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
              <Label htmlFor="consulente">Consulente *</Label>
              <Input
                id="consulente"
                value={formData.consulente}
                onChange={(e) => setFormData(prev => ({ ...prev, consulente: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, importo: parseFloat(e.target.value) || 0 }))}
                  required
                />
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
              <Label htmlFor="pagata">Pagata</Label>
              <Switch
                id="pagata"
                checked={formData.pagata}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  pagata: checked,
                  dataPagamento: checked ? new Date().toISOString().split('T')[0] : ""
                }))}
              />
            </div>

            {formData.pagata && (
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={formData.dataPagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataPagamento: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="allegato">URL Allegato PDF</Label>
              <Input
                id="allegato"
                type="url"
                value={formData.allegato}
                onChange={(e) => setFormData(prev => ({ ...prev, allegato: e.target.value }))}
                placeholder="https://..."
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
