import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

// Generic JSON file storage
export class JSONFileStorage<T extends { id: string }> {
  private filePath: string;
  private cache: T[] | null = null;

  constructor(filename: string) {
    this.filePath = path.join(DATA_DIR, filename);
  }

  async ensureFile(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async readAll(): Promise<T[]> {
    if (this.cache) return this.cache;

    await this.ensureFile();
    const content = await fs.readFile(this.filePath, 'utf-8');
    this.cache = JSON.parse(content);
    return this.cache || [];
  }

  async writeAll(data: T[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache = data;
  }

  async findById(id: string): Promise<T | undefined> {
    const all = await this.readAll();
    return all.find(item => item.id === id);
  }

  async create(item: T): Promise<T> {
    const all = await this.readAll();
    all.push(item);
    await this.writeAll(all);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const all = await this.readAll();
    const index = all.findIndex(item => item.id === id);

    if (index === -1) return null;

    all[index] = { ...all[index], ...updates };
    await this.writeAll(all);
    return all[index];
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.readAll();
    const filtered = all.filter(item => item.id !== id);

    if (filtered.length === all.length) return false;

    await this.writeAll(filtered);
    return true;
  }

  async findByField<K extends keyof T>(field: K, value: T[K]): Promise<T[]> {
    const all = await this.readAll();
    return all.filter(item => item[field] === value);
  }

  clearCache(): void {
    this.cache = null;
  }
}

// Storage instances
import type {
  Project,
  Client,
  FatturaIngresso,
  CostoVivo,
  Prestazione,
  UserWithPassword,
  Scadenza,
  Comunicazione,
  Tag,
  ProjectTag,
  FileRouting,
  ProjectResource,
  ActivityLog,
  ProfiloCosto,
  FatturaEmessa,
  FatturaConsulente,
  CostoGenerale
} from '@shared/schema';

export const projectsStorage = new JSONFileStorage<Project>('projects.json');
export const clientsStorage = new JSONFileStorage<Client>('clients.json');
export const fattureIngressoStorage = new JSONFileStorage<FatturaIngresso>('fatture-ingresso.json');
export const costiViviStorage = new JSONFileStorage<CostoVivo>('costi-vivi.json');
export const prestazioniStorage = new JSONFileStorage<Prestazione>('prestazioni.json');
export const usersStorage = new JSONFileStorage<UserWithPassword>('users.json');
export const scadenzeStorage = new JSONFileStorage<Scadenza>('scadenze.json');
export const comunicazioniStorage = new JSONFileStorage<Comunicazione>('comunicazioni.json');
export const tagsStorage = new JSONFileStorage<Tag>('tags.json');
export const projectTagsStorage = new JSONFileStorage<ProjectTag & { id: string }>('project-tags.json');
export const fileRoutingsStorage = new JSONFileStorage<FileRouting>('file-routings.json');
export const projectResourcesStorage = new JSONFileStorage<ProjectResource>('project-resources.json');

// Nuovi storage
export const activityLogsStorage = new JSONFileStorage<ActivityLog>('activity-logs.json');
export const profiliCostoStorage = new JSONFileStorage<ProfiloCosto>('profili-costo.json');
export const fattureEmesseStorage = new JSONFileStorage<FatturaEmessa>('fatture-emesse.json');
export const fattureConsulentiStorage = new JSONFileStorage<FatturaConsulente>('fatture-consulenti.json');
export const costiGeneraliStorage = new JSONFileStorage<CostoGenerale>('costi-generali.json');
