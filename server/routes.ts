import { Router } from 'express';
import { randomUUID } from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  projectsStorage,
  clientsStorage,
  fattureIngressoStorage,
  costiViviStorage,
  prestazioniStorage,
  usersStorage,
  scadenzeStorage,
  comunicazioniStorage,
  tagsStorage,
  projectTagsStorage,
  fileRoutingsStorage,
  projectResourcesStorage,
  activityLogsStorage,
  profiliCostoStorage,
  fattureEmesseStorage,
  fattureConsulentiStorage,
  costiGeneraliStorage
} from './storage.js';

import type {
  InsertProject,
  InsertClient,
  InsertFatturaIngresso,
  InsertCostoVivo,
  InsertPrestazione,
  InsertUser,
  InsertScadenza,
  InsertComunicazione,
  InsertTag,
  InsertProjectResource,
  InsertActivityLog,
  InsertProfiloCosto,
  InsertFatturaEmessa,
  InsertFatturaConsulente,
  InsertCostoGenerale
} from '@shared/schema';

import {
  insertProjectSchema,
  insertClientSchema,
  insertFatturaIngressoSchema,
  insertCostoVivoSchema,
  insertPrestazioneSchema,
  insertUserSchema,
  insertScadenzaSchema,
  insertComunicazioneSchema,
  insertTagSchema,
  insertProjectResourceSchema,
  insertActivityLogSchema,
  insertProfiloCostoSchema,
  insertFatturaEmessaSchema,
  insertFatturaConsulentiSchema,
  insertCostoGeneraleSchema
} from '@shared/schema';

export const router = Router();

// ============================================================================
// File Upload Configuration
// ============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'pdf');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo file PDF sono consentiti'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// ============================================================================
// PDF Upload Route
// ============================================================================
router.post('/api/upload/pdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const fileUrl = `/uploads/pdf/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Errore durante l\'upload del file' });
  }
});

// Serve uploaded files
router.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File non trovato' });
  }
});

// ============================================================================
// Code Generation Route
// ============================================================================
router.post('/api/generate-code', async (req, res) => {
  try {
    const { client, city, year } = req.body;

    if (!client || !city || year === undefined) {
      return res.status(400).json({ error: 'Client, city and year are required' });
    }

    // Generate client abbreviation (first 3-4 letters uppercase)
    const clientAbbr = client
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 4);

    // Generate city abbreviation (first 2-3 letters uppercase)
    const cityAbbr = city
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);

    // Format year as 2 digits
    const yearStr = String(year).padStart(2, '0');

    // Find existing projects for this year to generate progressive number
    const allProjects = await projectsStorage.readAll();
    const projectsThisYear = allProjects.filter(p => {
      const projectYear = p.code.match(/\d{2}(\d{2})$/)?.[1];
      return projectYear === yearStr;
    });

    // Generate progressive number
    const progressive = String(projectsThisYear.length + 1).padStart(2, '0');

    // Generate final code: CLIENTE-CITTA-AANNN
    const code = `${clientAbbr}-${cityAbbr}-${yearStr}${progressive}`;

    res.json({ code });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate project code' });
  }
});

// ============================================================================
// Projects Routes
// ============================================================================
router.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectsStorage.readAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await projectsStorage.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/api/projects', async (req, res) => {
  try {
    // Validate input data with Zod schema
    const validationResult = insertProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errors.fieldErrors 
      });
    }

    const projectData = validationResult.data;
    const project = {
      id: randomUUID(),
      ...projectData
    };
    await projectsStorage.create(project);
    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/api/projects/:id', async (req, res) => {
  try {
    const updates: Partial<InsertProject> = req.body;
    const updated = await projectsStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await projectsStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ============================================================================
// Clients Routes
// ============================================================================
router.get('/api/clients', async (req, res) => {
  try {
    const clients = await clientsStorage.readAll();
    const projects = await projectsStorage.readAll();

    // Calculate projectsCount for each client
    const clientsWithCount = clients.map(client => ({
      ...client,
      projectsCount: projects.filter(p => p.client === client.sigla).length
    }));

    res.json(clientsWithCount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/api/clients', async (req, res) => {
  try {
    // Validate input data with Zod schema
    const validationResult = insertClientSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return res.status(400).json({
        error: 'Validation error',
        details: errors.fieldErrors
      });
    }

    const clientData = validationResult.data;
    const client = {
      id: randomUUID(),
      ...clientData,
      projectsCount: 0
    };
    await clientsStorage.create(client);
    res.status(201).json(client);
  } catch (error) {
    console.error('Client creation error:', error);
    res.status(500).json({
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/api/clients/:id', async (req, res) => {
  try {
    // Validate input data with Zod schema (partial for updates)
    const validationResult = insertClientSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return res.status(400).json({
        error: 'Validation error',
        details: errors.fieldErrors
      });
    }

    const updates = validationResult.data;
    const updated = await clientsStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Client update error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/api/clients/:id', async (req, res) => {
  try {
    // Check if client has associated projects
    const allProjects = await projectsStorage.readAll();
    const client = await clientsStorage.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientProjects = allProjects.filter(p => p.client === client.sigla);
    if (clientProjects.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with associated projects',
        message: `Il cliente ha ${clientProjects.length} commesse associate. Eliminare prima le commesse.`
      });
    }

    const deleted = await clientsStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Client deletion error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// ============================================================================
// Fatture Ingresso Routes
// ============================================================================
router.get('/api/fatture-ingresso', async (req, res) => {
  try {
    const fatture = await fattureIngressoStorage.readAll();
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture ingresso' });
  }
});

router.get('/api/fatture-ingresso/:id', async (req, res) => {
  try {
    const fattura = await fattureIngressoStorage.findById(req.params.id);
    if (!fattura) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fattura' });
  }
});

router.get('/api/fatture-ingresso/project/:projectId', async (req, res) => {
  try {
    const fatture = await fattureIngressoStorage.findByField('projectId', req.params.projectId);
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture for project' });
  }
});

router.post('/api/fatture-ingresso', async (req, res) => {
  try {
    const fatturaData: InsertFatturaIngresso = req.body;
    const fattura = {
      id: randomUUID(),
      ...fatturaData
    };
    await fattureIngressoStorage.create(fattura);
    res.status(201).json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fattura' });
  }
});

router.put('/api/fatture-ingresso/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaIngresso> = req.body;
    const updated = await fattureIngressoStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.patch('/api/fatture-ingresso/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaIngresso> = req.body;
    const updated = await fattureIngressoStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.delete('/api/fatture-ingresso/:id', async (req, res) => {
  try {
    const deleted = await fattureIngressoStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete fattura' });
  }
});

// ============================================================================
// Costi Vivi Routes
// ============================================================================
router.get('/api/costi-vivi', async (req, res) => {
  try {
    const costi = await costiViviStorage.readAll();
    res.json(costi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costi vivi' });
  }
});

router.get('/api/costi-vivi/:id', async (req, res) => {
  try {
    const costo = await costiViviStorage.findById(req.params.id);
    if (!costo) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.json(costo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costo' });
  }
});

router.get('/api/costi-vivi/project/:projectId', async (req, res) => {
  try {
    const costi = await costiViviStorage.findByField('projectId', req.params.projectId);
    res.json(costi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costi for project' });
  }
});

router.post('/api/costi-vivi', async (req, res) => {
  try {
    const costoData: InsertCostoVivo = req.body;
    const costo = {
      id: randomUUID(),
      ...costoData
    };
    await costiViviStorage.create(costo);
    res.status(201).json(costo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create costo' });
  }
});

router.put('/api/costi-vivi/:id', async (req, res) => {
  try {
    const updates: Partial<InsertCostoVivo> = req.body;
    const updated = await costiViviStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update costo' });
  }
});

router.delete('/api/costi-vivi/:id', async (req, res) => {
  try {
    const deleted = await costiViviStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete costo' });
  }
});

// ============================================================================
// Prestazioni Routes
// ============================================================================
router.get('/api/prestazioni', async (req, res) => {
  try {
    const prestazioni = await prestazioniStorage.readAll();
    res.json(prestazioni);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prestazioni' });
  }
});

router.get('/api/prestazioni/:id', async (req, res) => {
  try {
    const prestazione = await prestazioniStorage.findById(req.params.id);
    if (!prestazione) {
      return res.status(404).json({ error: 'Prestazione not found' });
    }
    res.json(prestazione);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prestazione' });
  }
});

router.get('/api/prestazioni/project/:projectId', async (req, res) => {
  try {
    const prestazioni = await prestazioniStorage.findByField('projectId', req.params.projectId);
    res.json(prestazioni);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prestazioni for project' });
  }
});

router.post('/api/prestazioni', async (req, res) => {
  try {
    const prestazioneData: InsertPrestazione = req.body;
    const prestazione = {
      id: randomUUID(),
      ...prestazioneData
    };
    await prestazioniStorage.create(prestazione);
    res.status(201).json(prestazione);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prestazione' });
  }
});

router.put('/api/prestazioni/:id', async (req, res) => {
  try {
    const updates: Partial<InsertPrestazione> = req.body;
    const updated = await prestazioniStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Prestazione not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prestazione' });
  }
});

router.delete('/api/prestazioni/:id', async (req, res) => {
  try {
    const deleted = await prestazioniStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Prestazione not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prestazione' });
  }
});

// ============================================================================
// Scadenze Routes
// ============================================================================
router.get('/api/scadenze', async (req, res) => {
  try {
    const scadenze = await scadenzeStorage.readAll();
    res.json(scadenze);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scadenze' });
  }
});

router.post('/api/scadenze', async (req, res) => {
  try {
    const scadenzaData: InsertScadenza = req.body;
    const scadenza = {
      id: randomUUID(),
      ...scadenzaData
    };
    await scadenzeStorage.create(scadenza);
    res.status(201).json(scadenza);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create scadenza' });
  }
});

router.put('/api/scadenze/:id', async (req, res) => {
  try {
    const updates: Partial<InsertScadenza> = req.body;
    const updated = await scadenzeStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Scadenza not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update scadenza' });
  }
});

router.delete('/api/scadenze/:id', async (req, res) => {
  try {
    const deleted = await scadenzeStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Scadenza not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scadenza' });
  }
});

// ============================================================================
// Comunicazioni Routes
// ============================================================================
router.get('/api/comunicazioni', async (req, res) => {
  try {
    const comunicazioni = await comunicazioniStorage.readAll();
    res.json(comunicazioni);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comunicazioni' });
  }
});

router.post('/api/comunicazioni', async (req, res) => {
  try {
    const comunicazioneData: InsertComunicazione = req.body;
    const comunicazione = {
      id: randomUUID(),
      ...comunicazioneData
    };
    await comunicazioniStorage.create(comunicazione);
    res.status(201).json(comunicazione);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comunicazione' });
  }
});

router.put('/api/comunicazioni/:id', async (req, res) => {
  try {
    const updates: Partial<InsertComunicazione> = req.body;
    const updated = await comunicazioniStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Comunicazione not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comunicazione' });
  }
});

router.delete('/api/comunicazioni/:id', async (req, res) => {
  try {
    const deleted = await comunicazioniStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Comunicazione not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comunicazione' });
  }
});

// ============================================================================
// Users Routes
// ============================================================================
router.get('/api/users', async (req, res) => {
  try {
    const users = await usersStorage.readAll();
    // Don't return passwords
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/api/users', async (req, res) => {
  try {
    const userData: InsertUser = req.body;
    const user = {
      id: randomUUID(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    await usersStorage.create(user);
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/api/users/:id', async (req, res) => {
  try {
    const updates: Partial<InsertUser> = req.body;
    const updated = await usersStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = await usersStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================================================
// Auth Routes
// ============================================================================
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await usersStorage.readAll();
    const user = users.find(u => u.username.trim() === username.trim() && u.password === password);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }

    if (!user.active) {
      return res.status(401).json({ success: false, error: 'Utente disattivato' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore durante il login' });
  }
});

router.get('/api/auth/status', (req, res) => {
  // For now, always return not authenticated
  // In a real app, this would check session/token
  res.json({
    authenticated: false,
    user: null
  });
});

router.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// Tags Routes
// ============================================================================
router.get('/api/tags', async (req, res) => {
  try {
    const tags = await tagsStorage.readAll();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.post('/api/tags', async (req, res) => {
  try {
    const tagData: InsertTag = req.body;
    const tag = {
      id: randomUUID(),
      ...tagData
    };
    await tagsStorage.create(tag);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.delete('/api/tags/:id', async (req, res) => {
  try {
    const deleted = await tagsStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============================================================================
// Project Tags Routes
// ============================================================================
router.get('/api/project-tags/:projectId', async (req, res) => {
  try {
    const projectTags = await projectTagsStorage.findByField('projectId', req.params.projectId);
    res.json(projectTags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project tags' });
  }
});

router.post('/api/project-tags', async (req, res) => {
  try {
    const { projectId, tagId } = req.body;
    const projectTag = {
      id: randomUUID(),
      projectId,
      tagId
    };
    await projectTagsStorage.create(projectTag);
    res.status(201).json(projectTag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project tag' });
  }
});

router.delete('/api/project-tags/:projectId/:tagId', async (req, res) => {
  try {
    const all = await projectTagsStorage.readAll();
    const toDelete = all.find(pt => pt.projectId === req.params.projectId && pt.tagId === req.params.tagId);
    if (!toDelete) {
      return res.status(404).json({ error: 'Project tag not found' });
    }
    await projectTagsStorage.delete(toDelete.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project tag' });
  }
});

// ============================================================================
// Project Resources Routes
// ============================================================================
router.get('/api/project-resources', async (req, res) => {
  try {
    const resources = await projectResourcesStorage.readAll();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project resources' });
  }
});

router.get('/api/project-resources/:id', async (req, res) => {
  try {
    const resource = await projectResourcesStorage.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

router.post('/api/project-resources', async (req, res) => {
  try {
    const resourceData: InsertProjectResource = req.body;
    const newResource = {
      id: randomUUID(),
      ...resourceData
    };
    await projectResourcesStorage.create(newResource);
    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

router.put('/api/project-resources/:id', async (req, res) => {
  try {
    const updated = await projectResourcesStorage.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

router.delete('/api/project-resources/:id', async (req, res) => {
  try {
    const deleted = await projectResourcesStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ============================================================================
// OneDrive Routes (Stub for now)
// ============================================================================
router.get('/api/onedrive/mappings', async (req, res) => {
  try {
    // Return empty array for now - OneDrive integration will be implemented later
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch OneDrive mappings' });
  }
});

// ============================================================================
// Activity Logs Routes (Log personale utente)
// ============================================================================
router.get('/api/activity-logs', async (req, res) => {
  try {
    const logs = await activityLogsStorage.readAll();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

router.get('/api/activity-logs/user/:userId', async (req, res) => {
  try {
    const logs = await activityLogsStorage.findByField('userId', req.params.userId);
    // Ordina per timestamp decrescente
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity logs' });
  }
});

router.post('/api/activity-logs', async (req, res) => {
  try {
    const logData: InsertActivityLog = req.body;
    const log = {
      id: randomUUID(),
      ...logData,
      timestamp: logData.timestamp || new Date().toISOString()
    };
    await activityLogsStorage.create(log);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity log' });
  }
});

// ============================================================================
// Profili Costo Orario Routes (solo ADMIN)
// ============================================================================
router.get('/api/profili-costo', async (req, res) => {
  try {
    const profili = await profiliCostoStorage.readAll();
    res.json(profili);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profili costo' });
  }
});

router.get('/api/profili-costo/:id', async (req, res) => {
  try {
    const profilo = await profiliCostoStorage.findById(req.params.id);
    if (!profilo) {
      return res.status(404).json({ error: 'Profilo not found' });
    }
    res.json(profilo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profilo' });
  }
});

router.post('/api/profili-costo', async (req, res) => {
  try {
    const profiloData: InsertProfiloCosto = req.body;
    const profilo = {
      id: randomUUID(),
      ...profiloData
    };
    await profiliCostoStorage.create(profilo);
    res.status(201).json(profilo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create profilo' });
  }
});

router.put('/api/profili-costo/:id', async (req, res) => {
  try {
    const updates: Partial<InsertProfiloCosto> = req.body;
    const updated = await profiliCostoStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Profilo not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profilo' });
  }
});

router.delete('/api/profili-costo/:id', async (req, res) => {
  try {
    const deleted = await profiliCostoStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Profilo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profilo' });
  }
});

// ============================================================================
// Fatture Emesse Routes (solo ADMIN)
// ============================================================================
router.get('/api/fatture-emesse', async (req, res) => {
  try {
    const fatture = await fattureEmesseStorage.readAll();
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture emesse' });
  }
});

router.get('/api/fatture-emesse/:id', async (req, res) => {
  try {
    const fattura = await fattureEmesseStorage.findById(req.params.id);
    if (!fattura) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fattura' });
  }
});

router.get('/api/fatture-emesse/project/:projectId', async (req, res) => {
  try {
    const fatture = await fattureEmesseStorage.findByField('projectId', req.params.projectId);
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture for project' });
  }
});

router.post('/api/fatture-emesse', async (req, res) => {
  try {
    const fatturaData: InsertFatturaEmessa = req.body;
    const fattura = {
      id: randomUUID(),
      ...fatturaData
    };
    await fattureEmesseStorage.create(fattura);
    res.status(201).json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fattura' });
  }
});

router.put('/api/fatture-emesse/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaEmessa> = req.body;
    const updated = await fattureEmesseStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.patch('/api/fatture-emesse/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaEmessa> = req.body;
    const updated = await fattureEmesseStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.delete('/api/fatture-emesse/:id', async (req, res) => {
  try {
    const deleted = await fattureEmesseStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete fattura' });
  }
});

// ============================================================================
// Fatture Consulenti Routes (solo ADMIN visibilità e inserimento)
// ============================================================================
router.get('/api/fatture-consulenti', async (req, res) => {
  try {
    const fatture = await fattureConsulentiStorage.readAll();
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture consulenti' });
  }
});

router.get('/api/fatture-consulenti/:id', async (req, res) => {
  try {
    const fattura = await fattureConsulentiStorage.findById(req.params.id);
    if (!fattura) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fattura' });
  }
});

router.get('/api/fatture-consulenti/project/:projectId', async (req, res) => {
  try {
    const fatture = await fattureConsulentiStorage.findByField('projectId', req.params.projectId);
    res.json(fatture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture for project' });
  }
});

router.post('/api/fatture-consulenti', async (req, res) => {
  try {
    const fatturaData: InsertFatturaConsulente = req.body;
    const fattura = {
      id: randomUUID(),
      ...fatturaData
    };
    await fattureConsulentiStorage.create(fattura);
    res.status(201).json(fattura);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fattura' });
  }
});

router.put('/api/fatture-consulenti/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaConsulente> = req.body;
    const updated = await fattureConsulentiStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.patch('/api/fatture-consulenti/:id', async (req, res) => {
  try {
    const updates: Partial<InsertFatturaConsulente> = req.body;
    const updated = await fattureConsulentiStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fattura' });
  }
});

router.delete('/api/fatture-consulenti/:id', async (req, res) => {
  try {
    const deleted = await fattureConsulentiStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Fattura not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete fattura' });
  }
});

// ============================================================================
// Costi Generali Routes
// ============================================================================
router.get('/api/costi-generali', async (req, res) => {
  try {
    const costi = await costiGeneraliStorage.readAll();
    res.json(costi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costi generali' });
  }
});

router.get('/api/costi-generali/:id', async (req, res) => {
  try {
    const costo = await costiGeneraliStorage.findById(req.params.id);
    if (!costo) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.json(costo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costo' });
  }
});

router.post('/api/costi-generali', async (req, res) => {
  try {
    const costoData: InsertCostoGenerale = req.body;
    const costo = {
      id: randomUUID(),
      ...costoData
    };
    await costiGeneraliStorage.create(costo);
    res.status(201).json(costo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create costo' });
  }
});

router.put('/api/costi-generali/:id', async (req, res) => {
  try {
    const updates: Partial<InsertCostoGenerale> = req.body;
    const updated = await costiGeneraliStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update costo' });
  }
});

router.patch('/api/costi-generali/:id', async (req, res) => {
  try {
    const updates: Partial<InsertCostoGenerale> = req.body;
    const updated = await costiGeneraliStorage.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update costo' });
  }
});

router.delete('/api/costi-generali/:id', async (req, res) => {
  try {
    const deleted = await costiGeneraliStorage.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Costo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete costo' });
  }
});

// ============================================================================
// Cambio Password Route
// ============================================================================
router.post('/api/users/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await usersStorage.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Password attuale non corretta' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nuova password deve avere almeno 6 caratteri' });
    }

    await usersStorage.update(req.params.id, { password: newPassword });
    res.json({ success: true, message: 'Password modificata con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================================================
// Fatture in Scadenza Route (per promemoria dashboard)
// ============================================================================
router.get('/api/fatture-in-scadenza', async (req, res) => {
  try {
    const oggi = new Date();
    const tra30giorni = new Date();
    tra30giorni.setDate(oggi.getDate() + 30);

    // Fatture ingresso non pagate in scadenza
    const fattureIngresso = await fattureIngressoStorage.readAll();
    const fattureIngressoInScadenza = fattureIngresso
      .filter(f => !f.pagata && new Date(f.dataScadenzaPagamento) <= tra30giorni)
      .map(f => ({ ...f, tipo: 'ingresso' as const }));

    // Fatture consulenti non pagate in scadenza
    const fattureConsulenti = await fattureConsulentiStorage.readAll();
    const fattureConsulentiInScadenza = fattureConsulenti
      .filter(f => !f.pagata && new Date(f.dataScadenzaPagamento) <= tra30giorni)
      .map(f => ({ ...f, tipo: 'consulente' as const }));

    // Fatture emesse non incassate in scadenza
    const fattureEmesse = await fattureEmesseStorage.readAll();
    const fattureEmesseInScadenza = fattureEmesse
      .filter(f => !f.incassata && new Date(f.dataScadenzaPagamento) <= tra30giorni)
      .map(f => ({ ...f, tipo: 'emessa' as const }));

    // Costi generali non pagati in scadenza
    const costiGenerali = await costiGeneraliStorage.readAll();
    const costiGeneraliInScadenza = costiGenerali
      .filter(c => !c.pagato && c.dataScadenza && new Date(c.dataScadenza) <= tra30giorni)
      .map(c => ({ ...c, tipo: 'costo_generale' as const }));

    const tutteLeScadenze = [
      ...fattureIngressoInScadenza,
      ...fattureConsulentiInScadenza,
      ...fattureEmesseInScadenza,
      ...costiGeneraliInScadenza
    ].sort((a, b) => {
      const dataA = 'dataScadenzaPagamento' in a ? a.dataScadenzaPagamento : a.dataScadenza;
      const dataB = 'dataScadenzaPagamento' in b ? b.dataScadenzaPagamento : b.dataScadenza;
      return new Date(dataA!).getTime() - new Date(dataB!).getTime();
    });

    res.json(tutteLeScadenze);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatture in scadenza' });
  }
});

// ============================================================================
// Cash Flow Summary Route
// ============================================================================
router.get('/api/cash-flow', async (req, res) => {
  try {
    // Fatture emesse (entrate)
    const fattureEmesse = await fattureEmesseStorage.readAll();
    const totaleEmesso = fattureEmesse.reduce((acc, f) => acc + f.importoTotale, 0);
    const totaleIncassato = fattureEmesse.filter(f => f.incassata).reduce((acc, f) => acc + f.importoTotale, 0);
    const totaleDaIncassare = totaleEmesso - totaleIncassato;

    // Fatture ingresso (uscite)
    const fattureIngresso = await fattureIngressoStorage.readAll();
    const totaleFattureIngresso = fattureIngresso.reduce((acc, f) => acc + f.importo, 0);
    const totaleFattureIngressoPagate = fattureIngresso.filter(f => f.pagata).reduce((acc, f) => acc + f.importo, 0);
    const totaleFattureIngressoDaPagare = totaleFattureIngresso - totaleFattureIngressoPagate;

    // Fatture consulenti (uscite)
    const fattureConsulenti = await fattureConsulentiStorage.readAll();
    const totaleFattureConsulenti = fattureConsulenti.reduce((acc, f) => acc + f.importo, 0);
    const totaleFattureConsulentiPagate = fattureConsulenti.filter(f => f.pagata).reduce((acc, f) => acc + f.importo, 0);
    const totaleFattureConsulentiDaPagare = totaleFattureConsulenti - totaleFattureConsulentiPagate;

    // Costi vivi (uscite)
    const costiVivi = await costiViviStorage.readAll();
    const totaleCostiVivi = costiVivi.reduce((acc, c) => acc + c.importo, 0);

    // Costi generali (uscite)
    const costiGenerali = await costiGeneraliStorage.readAll();
    const totaleCostiGenerali = costiGenerali.reduce((acc, c) => acc + c.importo, 0);
    const totaleCostiGeneraliPagati = costiGenerali.filter(c => c.pagato).reduce((acc, c) => acc + c.importo, 0);
    const totaleCostiGeneraliDaPagare = totaleCostiGenerali - totaleCostiGeneraliPagati;

    // Totali
    const totaleUscite = totaleFattureIngresso + totaleFattureConsulenti + totaleCostiVivi + totaleCostiGenerali;
    const totaleUscitePagate = totaleFattureIngressoPagate + totaleFattureConsulentiPagate + totaleCostiVivi + totaleCostiGeneraliPagati;
    const totaleUsciteDaPagare = totaleFattureIngressoDaPagare + totaleFattureConsulentiDaPagare + totaleCostiGeneraliDaPagare;

    res.json({
      entrate: {
        totaleEmesso,
        totaleIncassato,
        totaleDaIncassare,
        fatture: fattureEmesse.length
      },
      uscite: {
        totale: totaleUscite,
        pagate: totaleUscitePagate,
        daPagare: totaleUsciteDaPagare,
        dettaglio: {
          fattureIngresso: { totale: totaleFattureIngresso, pagate: totaleFattureIngressoPagate, daPagare: totaleFattureIngressoDaPagare },
          fattureConsulenti: { totale: totaleFattureConsulenti, pagate: totaleFattureConsulentiPagate, daPagare: totaleFattureConsulentiDaPagare },
          costiVivi: { totale: totaleCostiVivi },
          costiGenerali: { totale: totaleCostiGenerali, pagati: totaleCostiGeneraliPagati, daPagare: totaleCostiGeneraliDaPagare }
        }
      },
      saldo: totaleIncassato - totaleUscitePagate,
      saldoPrevisionale: totaleEmesso - totaleUscite
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate cash flow' });
  }
});

// ============================================================================
// Project Summary Route (contatore fatture e costi per commessa)
// ============================================================================
router.get('/api/projects/:id/summary', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Fatture emesse
    const fattureEmesse = await fattureEmesseStorage.findByField('projectId', projectId);
    const totaleEmesso = fattureEmesse.reduce((acc, f) => acc + f.importoTotale, 0);
    const totaleIncassato = fattureEmesse.filter(f => f.incassata).reduce((acc, f) => acc + f.importoTotale, 0);

    // Fatture ingresso
    const fattureIngresso = await fattureIngressoStorage.findByField('projectId', projectId);
    const totaleFattureIngresso = fattureIngresso.reduce((acc, f) => acc + f.importo, 0);

    // Fatture consulenti
    const fattureConsulenti = await fattureConsulentiStorage.findByField('projectId', projectId);
    const totaleFattureConsulenti = fattureConsulenti.reduce((acc, f) => acc + f.importo, 0);

    // Costi vivi
    const costiVivi = await costiViviStorage.findByField('projectId', projectId);
    const totaleCostiVivi = costiVivi.reduce((acc, c) => acc + c.importo, 0);

    // Prestazioni
    const prestazioni = await prestazioniStorage.findByField('projectId', projectId);
    const totalePrestazioni = prestazioni.reduce((acc, p) => acc + (p.oreLavoro * p.costoOrario), 0);

    const totaleCosti = totaleFattureIngresso + totaleFattureConsulenti + totaleCostiVivi + totalePrestazioni;
    const margine = totaleEmesso - totaleCosti;
    const marginePercentuale = totaleEmesso > 0 ? (margine / totaleEmesso) * 100 : 0;

    res.json({
      fattureEmesse: {
        count: fattureEmesse.length,
        totale: totaleEmesso,
        incassato: totaleIncassato
      },
      costi: {
        fattureIngresso: { count: fattureIngresso.length, totale: totaleFattureIngresso },
        fattureConsulenti: { count: fattureConsulenti.length, totale: totaleFattureConsulenti },
        costiVivi: { count: costiVivi.length, totale: totaleCostiVivi },
        prestazioni: { count: prestazioni.length, totale: totalePrestazioni },
        totale: totaleCosti
      },
      margine,
      marginePercentuale
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project summary' });
  }
});
