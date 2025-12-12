import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Client, type Project, insertClientSchema } from "@shared/schema";

// Schema per form cliente (sia inserimento che modifica)
const clientFormSchema = z.object({
  sigla: z.string().min(1, "La sigla è obbligatoria").max(10, "Sigla troppo lunga (max 10 caratteri)"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional(),
  province: z.string().max(2, "Usa il codice provincia (2 lettere)").optional(),
  piva: z.string().optional(),
  cf: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  pec: z.string().email("PEC non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function ClientsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientProjects, setSelectedClientProjects] = useState<Project[] | null>(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch projects for viewing client projects
  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const defaultFormValues: ClientFormData = {
    sigla: "",
    name: "",
    address: "",
    city: "",
    cap: "",
    province: "",
    piva: "",
    cf: "",
    email: "",
    pec: "",
    phone: "",
    notes: "",
  };

  // Form per modifica cliente
  const editForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultFormValues,
  });

  // Form per nuovo cliente
  const newClientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultFormValues,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente creato",
        description: "Il cliente è stato creato con successo",
      });
      setShowNewClientModal(false);
      newClientForm.reset(defaultFormValues);
    },
    onError: (error: any) => {
      console.error("Create client error:", error);
      toast({
        title: "Errore nella creazione",
        description: error?.message || "Impossibile creare il cliente",
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientFormData }) => {
      const response = await apiRequest("PUT", `/api/clients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Cliente aggiornato",
        description: "Il cliente è stato aggiornato con successo",
      });
      setShowEditModal(false);
      setEditingClient(null);
      editForm.reset(defaultFormValues);
    },
    onError: (error: any) => {
      console.error("Update client error:", error);
      toast({
        title: "Errore nell'aggiornamento",
        description: error?.message || "Impossibile aggiornare il cliente",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      // 204 No Content doesn't have a body, so don't try to parse JSON
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Cliente eliminato",
        description: "Il cliente è stato eliminato con successo",
      });
    },
    onError: (error: any) => {
      console.error("Delete client error:", error);
      toast({
        title: "Errore nell'eliminazione",
        description: error?.message || "Impossibile eliminare il cliente",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients.filter(client =>
    client.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle view client projects
  const handleViewProjects = (client: Client) => {
    const clientProjects = allProjects.filter(project => project.client === client.sigla);
    setSelectedClientProjects(clientProjects);
    setShowProjectsModal(true);
  };

  // Handle new client
  const handleNewClient = () => {
    newClientForm.reset(defaultFormValues);
    setShowNewClientModal(true);
  };

  // Handle new client form submit
  const handleNewClientSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  // Handle edit client
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    editForm.reset({
      sigla: client.sigla,
      name: client.name,
      address: client.address || "",
      city: client.city || "",
      cap: client.cap || "",
      province: client.province || "",
      piva: client.piva || "",
      cf: client.cf || "",
      email: client.email || "",
      pec: client.pec || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setShowEditModal(true);
  };

  // Handle edit form submit
  const handleEditSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateClientMutation.mutate({
        id: editingClient.id,
        data,
      });
    }
  };

  // Handle delete client
  const handleDeleteClient = async (client: Client) => {
    const clientProjectsCount = allProjects.filter(project => project.client === client.sigla).length;

    if (clientProjectsCount > 0) {
      toast({
        title: "Impossibile eliminare",
        description: `Il cliente ${client.name} ha ${clientProjectsCount} commesse associate. Eliminare prima le commesse.`,
        variant: "destructive",
      });
      return;
    }

    setClientToDelete(client);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="clients-table-loading">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 items-center p-4 bg-white rounded-lg border border-gray-100">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-48 flex-1" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
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
            onClick={handleNewClient}
            disabled={createClientMutation.isPending}
            data-testid="add-client"
          >
            {createClientMutation.isPending ? "Creando..." : "➕ Nuovo Cliente"}
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
                          onClick={() => handleEditClient(client)}
                          disabled={updateClientMutation.isPending}
                          data-testid={`edit-client-${client.id}`}
                        >
                          {updateClientMutation.isPending ? '⏳' : '✏️'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Visualizza commesse"
                          onClick={() => handleViewProjects(client)}
                          data-testid={`view-client-projects-${client.id}`}
                        >
                          📋
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina"
                          onClick={() => handleDeleteClient(client)}
                          disabled={deleteClientMutation.isPending}
                          data-testid={`delete-client-${client.id}`}
                        >
                          {deleteClientMutation.isPending ? '⏳' : '🗑️'}
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

      {/* Projects Modal */}
      <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Commesse Cliente: {selectedClientProjects && selectedClientProjects.length > 0 
                ? allProjects.find(p => p.client === selectedClientProjects[0]?.client)?.client 
                : 'Cliente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedClientProjects && selectedClientProjects.length > 0 ? (
              <div className="space-y-2">
                {selectedClientProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {project.code}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'in_corso'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.status === 'conclusa'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status === 'in_corso' ? 'In Corso' : project.status === 'conclusa' ? 'Conclusa' : 'Sospesa'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {project.object}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {project.city} • {project.year} • Template: {project.template}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">📋</div>
                <p>Nessuna commessa trovata per questo cliente</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowProjectsModal(false)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              {/* Dati principali */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="sigla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sigla Cliente *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="es. ABC"
                          maxLength={10}
                          disabled={updateClientMutation.isPending}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Cliente *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ragione sociale / Nome completo"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Indirizzo */}
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Via/Piazza, numero civico"
                        disabled={updateClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Città"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="00000"
                          maxLength={5}
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="RM"
                          maxLength={2}
                          className="uppercase"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dati fiscali */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="piva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="12345678901"
                          maxLength={11}
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="cf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="RSSMRA80A01H501U"
                          maxLength={16}
                          className="uppercase"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contatti */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@esempio.it"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="pec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PEC</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="pec@esempio.it"
                          disabled={updateClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+39 06 1234567"
                        disabled={updateClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note */}
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Eventuali note sul cliente..."
                        rows={3}
                        disabled={updateClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={updateClientMutation.isPending}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={updateClientMutation.isPending}
                >
                  {updateClientMutation.isPending ? "Salvando..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Cliente</DialogTitle>
          </DialogHeader>

          <Form {...newClientForm}>
            <form onSubmit={newClientForm.handleSubmit(handleNewClientSubmit)} className="space-y-4">
              {/* Dati principali */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newClientForm.control}
                  name="sigla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sigla Cliente *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="es. ABC"
                          maxLength={10}
                          disabled={createClientMutation.isPending}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newClientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Cliente *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ragione sociale / Nome completo"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Indirizzo */}
              <FormField
                control={newClientForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Via/Piazza, numero civico"
                        disabled={createClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={newClientForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Città"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newClientForm.control}
                  name="cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="00000"
                          maxLength={5}
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newClientForm.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="RM"
                          maxLength={2}
                          className="uppercase"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dati fiscali */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newClientForm.control}
                  name="piva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="12345678901"
                          maxLength={11}
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newClientForm.control}
                  name="cf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="RSSMRA80A01H501U"
                          maxLength={16}
                          className="uppercase"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contatti */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newClientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="email@esempio.it"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newClientForm.control}
                  name="pec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PEC</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="pec@esempio.it"
                          disabled={createClientMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newClientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+39 06 1234567"
                        disabled={createClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note */}
              <FormField
                control={newClientForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Eventuali note sul cliente..."
                        rows={3}
                        disabled={createClientMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientModal(false)}
                  disabled={createClientMutation.isPending}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? "Creando..." : "Crea Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il cliente?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>Sei sicuro di voler eliminare questo cliente?</div>
              {clientToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-sm mb-1">
                    {clientToDelete.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    Sigla: <span className="font-mono font-semibold">{clientToDelete.sigla}</span>
                  </div>
                  {clientToDelete.city && (
                    <div className="text-xs text-gray-500 mt-1">
                      Città: {clientToDelete.city}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Commesse: {clientToDelete.projectsCount || 0}
                  </div>
                </div>
              )}
              <div className="text-red-600 font-medium mt-2">
                ⚠️ Questa azione non può essere annullata.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Elimina cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
