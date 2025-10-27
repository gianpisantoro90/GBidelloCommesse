import { Router } from 'express';
import { randomUUID } from 'crypto';
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
  projectResourcesStorage
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
  InsertProjectResource
} from '@shared/schema';

export const router = Router();

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
    const projectData: InsertProject = req.body;
    const project = {
      id: randomUUID(),
      ...projectData
    };
    await projectsStorage.create(project);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
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
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/api/clients', async (req, res) => {
  try {
    const clientData: InsertClient = req.body;
    const client = {
      id: randomUUID(),
      ...clientData
    };
    await clientsStorage.create(client);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
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
