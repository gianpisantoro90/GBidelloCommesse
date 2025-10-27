import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { TIPO_RAPPORTO_CONFIG, type TipoRapportoType } from "@/lib/prestazioni-utils";
import { CheckCircle, Loader2, Save } from "lucide-react";
import { z } from "zod";

const formSchema = insertProjectSchema.extend({
  year: z.number().min(0).max(99),
});

type FormData = z.infer<typeof formSchema>;

interface NewProjectFormProps {
  onProjectSaved: (project: any) => void;
}

export default function NewProjectForm({ onProjectSaved }: NewProjectFormProps) {
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client: "",
      city: "",
      object: "",
      year: new Date().getFullYear() % 100,
      template: "LUNGO",
      status: "in_corso",
      tipoRapporto: "diretto",
      tipoIntervento: "professionale",
      budget: undefined,
      committenteFinale: undefined,
      code: "",
      fsRoot: undefined,
      metadata: undefined,
    },
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (data: { client: string; city: string; year: number }) => {
      const response = await apiRequest("POST", "/api/generate-code", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      form.setValue("code", data.code);
    },
    onError: () => {
      toast({
        title: "Errore nella generazione del codice",
        description: "Si è verificato un errore durante la generazione del codice commessa",
        variant: "destructive",
      });
    },
  });

  // Simple project creation
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const projectResponse = await apiRequest("POST", "/api/projects", data);
      const project = await projectResponse.json();
      return project;
    },
    onSuccess: (project) => {
      toast({
        title: "Commessa creata con successo",
        description: `Progetto ${project.code} creato con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onProjectSaved(project);
      form.reset();
      setGeneratedCode("");
    },
    onError: (error: any) => {
      console.error('Project creation error:', error);

      toast({
        title: "Errore nella creazione",
        description: "Si è verificato un errore durante la creazione della commessa",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCode = () => {
    const { client, city, year } = form.getValues();
    if (!client || !city || year === undefined || year === null) {
      toast({
        title: "Campi mancanti",
        description: "Compilare Cliente, Città e Anno prima di generare il codice",
        variant: "destructive",
      });
      return;
    }

    generateCodeMutation.mutate({ client, city, year });
  };

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);

    if (!data.code) {
      toast({
        title: "Codice mancante",
        description: "Generare prima il codice commessa",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate(data);
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    const firstError = Object.values(errors)[0] as any;
    toast({
      title: "Errore di validazione",
      description: firstError?.message || "Controlla i campi del form",
      variant: "destructive",
    });
  };

  return (
    <div className="card-g2" data-testid="new-project-form">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crea Nuova Commessa</h2>
      
      <form className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="client" className="block text-sm font-semibold text-gray-700 mb-2">
              Cliente *
            </Label>
            <Input
              id="client"
              placeholder="Es. Comune di Milano"
              className="input-g2"
              data-testid="input-client"
              {...form.register("client")}
            />
            {form.formState.errors.client && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.client.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
              Città *
            </Label>
            <Input
              id="city"
              placeholder="Es. Milano"
              className="input-g2"
              data-testid="input-city"
              {...form.register("city")}
            />
            {form.formState.errors.city && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.city.message}</p>
            )}
          </div>
        </div>
        
        {/* Nuova sezione: Tipo Rapporto Committenza */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo Rapporto *
              <span className="ml-1 text-xs text-gray-500 font-normal">Chi commissiona a G2?</span>
            </Label>
            <Select
              onValueChange={(value) => form.setValue("tipoRapporto", value as TipoRapportoType)}
              defaultValue={form.getValues("tipoRapporto")}
              data-testid="select-tipo-rapporto"
            >
              <SelectTrigger className="input-g2">
                <SelectValue placeholder="Seleziona tipo rapporto..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_RAPPORTO_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label} - {config.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.tipoRapporto && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.tipoRapporto.message}</p>
            )}
          </div>
        </div>
        
        {/* Campo Committente Finale - visibile solo se tipo != diretto */}
        {form.watch("tipoRapporto") && form.watch("tipoRapporto") !== "diretto" && (
          <div>
            <Label htmlFor="committente-finale" className="block text-sm font-semibold text-gray-700 mb-2">
              Committente Finale
              <span className="ml-1 text-xs text-gray-500 font-normal">Proprietario/Ente finale dell'opera</span>
            </Label>
            <Input
              id="committente-finale"
              placeholder="Es. Comune di Roma, Privato, etc."
              className="input-g2"
              data-testid="input-committente-finale"
              {...form.register("committenteFinale")}
            />
            {form.formState.errors.committenteFinale && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.committenteFinale.message}</p>
            )}
          </div>
        )}
        
        <div>
          <Label htmlFor="object" className="block text-sm font-semibold text-gray-700 mb-2">
            Oggetto Commessa *
          </Label>
          <Input
            id="object"
            placeholder="Descrizione sintetica del progetto"
            className="input-g2"
            data-testid="input-object"
            {...form.register("object")}
          />
          {form.formState.errors.object && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.object.message}</p>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
              Anno (AA) *
            </Label>
            <Input
              id="year"
              type="number"
              min="0"
              max="99"
              placeholder="24"
              className="input-g2"
              data-testid="input-year"
              {...form.register("year", { valueAsNumber: true })}
            />
            {form.formState.errors.year && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.year.message}</p>
            )}
          </div>
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              Template Progetto *
            </Label>
            <Select
              onValueChange={(value) => form.setValue("template", value)}
              defaultValue={form.getValues("template")}
              data-testid="select-template"
            >
              <SelectTrigger className="input-g2">
                <SelectValue placeholder="Seleziona template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LUNGO">LUNGO - Progetti complessi</SelectItem>
                <SelectItem value="BREVE">BREVE - Progetti semplici</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              Stato Commessa *
            </Label>
            <Select
              onValueChange={(value) => form.setValue("status", value)}
              defaultValue={form.getValues("status")}
              data-testid="select-status"
            >
              <SelectTrigger className="input-g2">
                <SelectValue placeholder="Seleziona stato..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_corso">🟡 In Corso</SelectItem>
                <SelectItem value="conclusa">🟢 Conclusa</SelectItem>
                <SelectItem value="sospesa">🔴 Sospesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nuova sezione: Tipologia Intervento e Budget */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipologia Intervento *
            </Label>
            <Select
              onValueChange={(value) => form.setValue("tipoIntervento", value as "professionale" | "realizzativo")}
              defaultValue={form.getValues("tipoIntervento")}
              data-testid="select-tipo-intervento"
            >
              <SelectTrigger className="input-g2">
                <SelectValue placeholder="Seleziona tipologia..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professionale">📋 Professionale - Consulenza, progettazione</SelectItem>
                <SelectItem value="realizzativo">🏗️ Realizzativo - Lavori, costruzione</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Professionale: solo servizi. Realizzativo: include lavori/opere.
            </p>
          </div>
          <div>
            <Label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
              Budget Iniziale
              <span className="ml-1 text-xs text-gray-500 font-normal">(opzionale)</span>
            </Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Es. 50000.00"
              className="input-g2"
              data-testid="input-budget"
              {...form.register("budget", {
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : parseFloat(v)
              })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Budget preventivato per la commessa (in euro)
            </p>
          </div>
        </div>

        <div>
          <Label className="block text-sm font-semibold text-gray-700 mb-2">
            Codice Commessa
          </Label>
          <div className="flex gap-3">
            <Input
              readOnly
              placeholder="Generato automaticamente..."
              className="flex-1 input-g2 bg-gray-50 text-gray-600 font-mono"
              data-testid="input-generated-code"
              {...form.register("code")}
            />
            <Button
              type="button"
              onClick={handleGenerateCode}
              disabled={generateCodeMutation.isPending}
              className="button-g2-primary"
              data-testid="button-generate-code"
            >
              {generateCodeMutation.isPending ? "Generando..." : "Genera"}
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-wrap gap-3">
            {/* Create Project Button */}
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit, onError)}
              disabled={createProjectMutation.isPending || !form.watch("code")}
              className="px-8 py-3 bg-g2-success text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              data-testid="button-save-project"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crea Commessa
                </>
              )}
            </Button>

            {/* Reset Button */}
            <Button
              type="reset"
              variant="outline"
              disabled={createProjectMutation.isPending}
              onClick={() => {
                form.reset();
                setGeneratedCode("");
              }}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              data-testid="button-reset-form"
            >
              Cancella
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
