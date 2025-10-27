import { z } from "zod";

// ============================================================================
// Projects Schema
// ============================================================================
export const insertProjectSchema = z.object({
  code: z.string().min(1, "Il codice è obbligatorio"),
  client: z.string().min(1, "Il cliente è obbligatorio"),
  city: z.string().min(1, "La città è obbligatoria"),
  object: z.string().min(1, "L'oggetto è obbligatorio"),
  year: z.number().int().min(0).max(99),
  template: z.enum(["LUNGO", "BREVE"]),
  status: z.enum(["in_corso", "conclusa", "sospesa"]).default("in_corso"),
  tipoRapporto: z.enum(["diretto", "tramite_impresa", "tramite_professionista"]).default("diretto"),
  tipoIntervento: z.enum(["professionale", "realizzativo"]).default("professionale"),
  budget: z.number().optional(),
  committenteFinale: z.string().optional(),
  fsRoot: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;

export interface Project extends InsertProject {
  id: string;
}

// ============================================================================
// Clients Schema
// ============================================================================
export const insertClientSchema = z.object({
  sigla: z.string().min(1, "La sigla è obbligatoria"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional(),
  province: z.string().optional(),
  piva: z.string().optional(),
  cf: z.string().optional(),
  email: z.string().email().optional(),
  pec: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;

export interface Client extends InsertClient {
  id: string;
}

// ============================================================================
// File Routing Schema
// ============================================================================
export const insertFileRoutingSchema = z.object({
  projectId: z.string(),
  fileName: z.string(),
  originalPath: z.string(),
  targetPath: z.string(),
  routedAt: z.string(),
  routedBy: z.enum(["ai", "manual"]),
  confidence: z.number().min(0).max(1).optional(),
});

export type InsertFileRouting = z.infer<typeof insertFileRoutingSchema>;

export interface FileRouting extends InsertFileRouting {
  id: string;
}

// ============================================================================
// System Config Schema
// ============================================================================
export const insertSystemConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
  description: z.string().optional(),
  updatedAt: z.string(),
});

export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export interface SystemConfig extends InsertSystemConfig {
  id: string;
}

// ============================================================================
// Fatture Ingresso Schema
// ============================================================================
export const insertFatturaIngressoSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  numeroFattura: z.string().min(1, "Il numero fattura è obbligatorio"),
  fornitore: z.string().min(1, "Il fornitore è obbligatorio"),
  dataEmissione: z.string().min(1, "La data emissione è obbligatoria"),
  dataScadenzaPagamento: z.string().min(1, "La data scadenza è obbligatoria"),
  importo: z.number().int().positive("L'importo deve essere positivo"),
  categoria: z.enum(["materiali", "collaborazione_esterna", "costo_vivo", "altro"]),
  descrizione: z.string().min(1, "La descrizione è obbligatoria"),
  pagata: z.boolean().default(false),
  dataPagamento: z.string().optional(),
  note: z.string().optional(),
});

export type InsertFatturaIngresso = z.infer<typeof insertFatturaIngressoSchema>;

export interface FatturaIngresso extends InsertFatturaIngresso {
  id: string;
}

// ============================================================================
// Costi Vivi Schema
// ============================================================================
export const insertCostoVivoSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  tipologia: z.enum(["viaggio", "parcheggio", "carburante", "alloggio", "vitto", "altro"]),
  data: z.string().min(1, "La data è obbligatoria"),
  importo: z.number().int().positive("L'importo deve essere positivo"),
  descrizione: z.string().min(1, "La descrizione è obbligatoria"),
  luogo: z.string().optional(),
  km: z.number().int().optional(),
  destinazione: z.string().optional(),
  note: z.string().optional(),
});

export type InsertCostoVivo = z.infer<typeof insertCostoVivoSchema>;

export interface CostoVivo extends InsertCostoVivo {
  id: string;
}

// ============================================================================
// Prestazioni (Work Performance) Schema
// ============================================================================
export const insertPrestazioneSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  userId: z.string().min(1, "L'utente è obbligatorio"),
  userName: z.string().min(1, "Il nome utente è obbligatorio"),
  data: z.string().min(1, "La data è obbligatoria"),
  oreLavoro: z.number().positive("Le ore lavoro devono essere positive"),
  costoOrario: z.number().positive("Il costo orario deve essere positivo"),
  descrizione: z.string().min(1, "La descrizione è obbligatoria"),
  categoria: z.string().optional(),
  note: z.string().optional(),
});

export type InsertPrestazione = z.infer<typeof insertPrestazioneSchema>;

export interface Prestazione extends InsertPrestazione {
  id: string;
}

// ============================================================================
// Users Schema
// ============================================================================
export const insertUserSchema = z.object({
  username: z.string().min(1, "L'username è obbligatorio"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  nome: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.enum(["amministratore", "collaboratore"]).default("collaboratore"),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User extends Omit<InsertUser, 'password'> {
  id: string;
  createdAt: string;
}

export interface UserWithPassword extends InsertUser {
  id: string;
  createdAt: string;
}

// ============================================================================
// Scadenze (Deadlines) Schema
// ============================================================================
export const insertScadenzaSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  titolo: z.string().min(1, "Il titolo è obbligatorio"),
  data: z.string().min(1, "La data è obbligatoria"),
  tipo: z.enum(["milestone", "deadline", "reminder", "altro"]),
  priorita: z.enum(["bassa", "media", "alta"]).default("media"),
  completata: z.boolean().default(false),
  descrizione: z.string().optional(),
  note: z.string().optional(),
});

export type InsertScadenza = z.infer<typeof insertScadenzaSchema>;

export interface Scadenza extends InsertScadenza {
  id: string;
}

// ============================================================================
// Comunicazioni Schema
// ============================================================================
export const insertComunicazioneSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  data: z.string().min(1, "La data è obbligatoria"),
  tipo: z.enum(["email", "telefono", "riunione", "verbale", "altro"]),
  oggetto: z.string().min(1, "L'oggetto è obbligatorio"),
  descrizione: z.string().min(1, "La descrizione è obbligatoria"),
  partecipanti: z.string().optional(),
  allegati: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export type InsertComunicazione = z.infer<typeof insertComunicazioneSchema>;

export interface Comunicazione extends InsertComunicazione {
  id: string;
}

// ============================================================================
// Tags Schema
// ============================================================================
export const insertTagSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  color: z.string(),
  description: z.string().optional(),
});

export type InsertTag = z.infer<typeof insertTagSchema>;

export interface Tag extends InsertTag {
  id: string;
}

// ============================================================================
// Project Tags Relation
// ============================================================================
export interface ProjectTag {
  projectId: string;
  tagId: string;
}

// ============================================================================
// Project Resources Schema
// ============================================================================
export const insertProjectResourceSchema = z.object({
  projectId: z.string().min(1, "La commessa è obbligatoria"),
  userName: z.string().min(1, "Il nome utente è obbligatorio"),
  userEmail: z.string().email().optional(),
  role: z.string().min(1, "Il ruolo è obbligatorio"),
  oreAssegnate: z.number().min(0).default(0),
  oreLavorate: z.number().min(0).default(0),
  costoOrario: z.number().min(0).default(0),
  isResponsabile: z.boolean().default(false),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
});

export type InsertProjectResource = z.infer<typeof insertProjectResourceSchema>;

export interface ProjectResource extends InsertProjectResource {
  id: string;
}
