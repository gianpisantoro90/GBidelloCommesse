import { type Project, type InsertProject, type Client, type InsertClient, type FileRouting, type InsertFileRouting, type SystemConfig, type InsertSystemConfig } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectByCode(code: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClientBySigla(sigla: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // File Routings
  getFileRouting(id: string): Promise<FileRouting | undefined>;
  getFileRoutingsByProject(projectId: string): Promise<FileRouting[]>;
  createFileRouting(routing: InsertFileRouting): Promise<FileRouting>;
  
  // System Config
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  setSystemConfig(key: string, value: any): Promise<SystemConfig>;
  
  // Bulk operations
  exportAllData(): Promise<{ projects: Project[], clients: Client[], fileRoutings: FileRouting[], systemConfig: SystemConfig[] }>;
  importAllData(data: { projects: Project[], clients: Client[], fileRoutings: FileRouting[], systemConfig: SystemConfig[] }): Promise<void>;
  clearAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private clients: Map<string, Client> = new Map();
  private fileRoutings: Map<string, FileRouting> = new Map();
  private systemConfig: Map<string, SystemConfig> = new Map();

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectByCode(code: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(p => p.code === code);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      fsRoot: insertProject.fsRoot || null,
      metadata: insertProject.metadata || {},
    };
    this.projects.set(id, project);
    
    // Update client projects count
    const clientSigla = this.generateSafeAcronym(insertProject.client);
    const existingClient = Array.from(this.clients.values()).find(c => c.sigla === clientSigla);
    if (existingClient) {
      existingClient.projectsCount = (existingClient.projectsCount || 0) + 1;
    } else {
      // Create new client
      await this.createClient({
        sigla: clientSigla,
        name: insertProject.client,
        city: insertProject.city,
        projectsCount: 1,
      });
    }
    
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = { ...existing, ...updateData };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;
    
    this.projects.delete(id);
    
    // Update client projects count
    const clientSigla = this.generateSafeAcronym(project.client);
    const client = Array.from(this.clients.values()).find(c => c.sigla === clientSigla);
    if (client && (client.projectsCount || 0) > 0) {
      client.projectsCount = (client.projectsCount || 0) - 1;
    }
    
    return true;
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientBySigla(sigla: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(c => c.sigla === sigla);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
      id,
      city: insertClient.city || null,
      projectsCount: insertClient.projectsCount || 0,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    
    const updated: Client = { ...existing, ...updateData };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // File Routings
  async getFileRouting(id: string): Promise<FileRouting | undefined> {
    return this.fileRoutings.get(id);
  }

  async getFileRoutingsByProject(projectId: string): Promise<FileRouting[]> {
    return Array.from(this.fileRoutings.values()).filter(fr => fr.projectId === projectId);
  }

  async createFileRouting(insertRouting: InsertFileRouting): Promise<FileRouting> {
    const id = randomUUID();
    const routing: FileRouting = {
      ...insertRouting,
      id,
      createdAt: new Date(),
      projectId: insertRouting.projectId || null,
      fileType: insertRouting.fileType || null,
      actualPath: insertRouting.actualPath || null,
      confidence: insertRouting.confidence || 0,
      method: insertRouting.method || null,
    };
    this.fileRoutings.set(id, routing);
    return routing;
  }

  // System Config
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return Array.from(this.systemConfig.values()).find(sc => sc.key === key);
  }

  async setSystemConfig(key: string, value: any): Promise<SystemConfig> {
    const existing = Array.from(this.systemConfig.values()).find(sc => sc.key === key);
    
    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
      return existing;
    } else {
      const id = randomUUID();
      const config: SystemConfig = {
        id,
        key,
        value,
        updatedAt: new Date(),
      };
      this.systemConfig.set(id, config);
      return config;
    }
  }

  // Bulk operations
  async exportAllData() {
    return {
      projects: Array.from(this.projects.values()),
      clients: Array.from(this.clients.values()),
      fileRoutings: Array.from(this.fileRoutings.values()),
      systemConfig: Array.from(this.systemConfig.values()),
    };
  }

  async importAllData(data: { projects: Project[], clients: Client[], fileRoutings: FileRouting[], systemConfig: SystemConfig[] }) {
    this.projects.clear();
    this.clients.clear();
    this.fileRoutings.clear();
    this.systemConfig.clear();

    data.projects.forEach(p => this.projects.set(p.id, p));
    data.clients.forEach(c => this.clients.set(c.id, c));
    data.fileRoutings.forEach(fr => this.fileRoutings.set(fr.id, fr));
    data.systemConfig.forEach(sc => this.systemConfig.set(sc.id, sc));
  }

  async clearAllData() {
    this.projects.clear();
    this.clients.clear();
    this.fileRoutings.clear();
    this.systemConfig.clear();
  }

  private generateSafeAcronym(text: string): string {
    return (text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3).padEnd(3, 'X');
  }
}

export const storage = new MemStorage();
