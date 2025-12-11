import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Euro, Users } from "lucide-react";
import type { ProfiloCosto } from "@shared/schema";

export default function ProfiliCostoManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfilo, setEditingProfilo] = useState<ProfiloCosto | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descrizione: "",
    costoOrario: 0,
    active: true
  });

  const { data: profili = [], isLoading } = useQuery<ProfiloCosto[]>({
    queryKey: ["profili-costo"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/profili-costo");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/profili-costo", data);
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profili-costo"] });
      toast({ title: "Successo", description: "Profilo creato con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante la creazione", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PUT", `/api/profili-costo/${id}`, data);
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profili-costo"] });
      toast({ title: "Successo", description: "Profilo aggiornato con successo" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/profili-costo/${id}`);
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profili-costo"] });
      toast({ title: "Successo", description: "Profilo eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore durante l'eliminazione", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ nome: "", descrizione: "", costoOrario: 0, active: true });
    setEditingProfilo(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (profilo: ProfiloCosto) => {
    setEditingProfilo(profilo);
    setFormData({
      nome: profilo.nome,
      descrizione: profilo.descrizione || "",
      costoOrario: profilo.costoOrario,
      active: profilo.active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfilo) {
      updateMutation.mutate({ id: editingProfilo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Profili Costo Orario
        </CardTitle>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuovo Profilo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : profili.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nessun profilo costo definito. Crea il primo profilo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="text-right">Costo Orario</TableHead>
                <TableHead className="text-center">Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profili.map((profilo) => (
                <TableRow key={profilo.id}>
                  <TableCell className="font-medium">{profilo.nome}</TableCell>
                  <TableCell className="text-gray-500">{profilo.descrizione || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(profilo.costoOrario)}/h
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={profilo.active ? "default" : "secondary"}>
                      {profilo.active ? "Attivo" : "Disattivato"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(profilo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questo profilo?")) {
                            deleteMutation.mutate(profilo.id);
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
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProfilo ? "Modifica Profilo" : "Nuovo Profilo Costo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Profilo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="es. Ingegnere, Tecnico, Operaio..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Input
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                  placeholder="Descrizione opzionale"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costoOrario">Costo Orario (EUR) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="costoOrario"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-9"
                    value={formData.costoOrario}
                    onChange={(e) => setFormData(prev => ({ ...prev, costoOrario: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Attivo</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingProfilo ? "Aggiorna" : "Crea"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
