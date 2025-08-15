// File System Access API utilities for G2 Commesse

export interface FolderStructure {
  [folderName: string]: FolderStructure | {};
}

export interface ProjectTemplate {
  name: string;
  structure: FolderStructure;
}

// Template definitions
const TEMPLATE_LUNGO: FolderStructure = {
  "01_DOCUMENTI_GENERALI": {
    "01_CONTRATTO": {},
    "02_CORRISPONDENZA": {},
    "03_AUTORIZZAZIONI": {},
  },
  "02_PROGETTAZIONE": {
    "ARC": {
      "01_PIANTE": {},
      "02_PROSPETTI": {},
      "03_SEZIONI": {},
      "04_DETTAGLI": {},
    },
    "STR": {
      "01_CALCOLI": {},
      "02_ELABORATI": {},
      "03_RELAZIONI": {},
    },
    "IM": {
      "01_IDRAULICO": {},
      "02_MECCANICO": {},
      "03_ANTINCENDIO": {},
    },
    "IE": {
      "01_ELETTRICO": {},
      "02_ILLUMINAZIONE": {},
      "03_DOMOTICA": {},
    },
    "IS": {
      "01_SICUREZZA": {},
      "02_VIDEOSORVEGLIANZA": {},
    },
    "REL": {
      "01_TECNICHE": {},
      "02_SPECIALISTICHE": {},
    },
    "CME": {
      "01_COMPUTI": {},
      "02_CAPITOLATI": {},
    },
    "SIC": {
      "01_PSC": {},
      "02_POS": {},
    },
  },
  "03_CALCOLI": {
    "01_STRUTTURALI": {},
    "02_IMPIANTI": {},
    "03_ENERGETICI": {},
  },
  "04_ELABORATI_GRAFICI": {
    "01_TAVOLE_PROGETTO": {},
    "02_PARTICOLARI": {},
    "03_SCHEMI": {},
  },
  "05_CORRISPONDENZA": {
    "01_ENTRATA": {},
    "02_USCITA": {},
    "03_INTERNA": {},
  },
  "06_VERBALI": {
    "01_RIUNIONI": {},
    "02_SOPRALLUOGHI": {},
    "03_COMMISSIONI": {},
  },
  "07_SOPRALLUOGHI": {
    "01_FOTOGRAFICI": {},
    "02_RILIEVI": {},
    "03_REPORTS": {},
  },
  "08_VARIANTI": {
    "01_RICHIESTE": {},
    "02_APPROVATE": {},
    "03_RIFIUTATE": {},
  },
  "09_PARCELLA": {
    "01_PREVENTIVI": {},
    "02_FATTURE": {},
    "03_PAGAMENTI": {},
  },
  "10_INCARICO": {
    "01_NOMINA": {},
    "02_CONTRATTO": {},
    "03_POLIZZE": {},
  },
};

const TEMPLATE_BREVE: FolderStructure = {
  "CONSEGNA": {
    "01_RICHIESTA": {},
    "02_DOCUMENTI": {},
  },
  "ELABORAZIONI": {
    "01_CALCOLI": {},
    "02_DISEGNI": {},
    "03_RELAZIONI": {},
  },
  "MATERIALE_RICEVUTO": {
    "01_DOCUMENTI": {},
    "02_PLANIMETRIE": {},
    "03_FOTO": {},
  },
  "SOPRALLUOGHI": {
    "01_VERBALI": {},
    "02_FOTO": {},
    "03_RILIEVI": {},
  },
};

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  LUNGO: {
    name: "LUNGO - Progetti complessi",
    structure: TEMPLATE_LUNGO,
  },
  BREVE: {
    name: "BREVE - Progetti semplici", 
    structure: TEMPLATE_BREVE,
  },
};

// File System Access API support check
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

// Create folder structure recursively
export const createFolderStructure = async (
  rootHandle: FileSystemDirectoryHandle,
  structure: FolderStructure,
  basePath: string = ""
): Promise<void> => {
  const createdFolders: string[] = [];
  
  try {
    for (const [folderName, subStructure] of Object.entries(structure)) {
      const sanitizedName = sanitizeFileName(folderName);
      const fullPath = basePath ? `${basePath}/${sanitizedName}` : sanitizedName;
      
      try {
        const folderHandle = await rootHandle.getDirectoryHandle(sanitizedName, { 
          create: true 
        });
        createdFolders.push(fullPath);
        
        // Recursively create subfolders
        if (subStructure && Object.keys(subStructure).length > 0) {
          await createFolderStructure(folderHandle, subStructure, fullPath);
        }
      } catch (error) {
        console.error(`Errore creazione cartella ${fullPath}:`, error);
        throw new Error(`Impossibile creare la cartella: ${fullPath}`);
      }
    }
  } catch (error) {
    console.error("Errore durante la creazione della struttura:", error);
    throw error;
  }
};

// Create complete project structure
export const createProjectStructure = async (
  rootHandle: FileSystemDirectoryHandle,
  projectCode: string,
  projectObject: string,
  template: string
): Promise<{ projectHandle: FileSystemDirectoryHandle; createdFolders: string[] }> => {
  const templateData = PROJECT_TEMPLATES[template];
  if (!templateData) {
    throw new Error(`Template non trovato: ${template}`);
  }

  // Create main project folder
  const projectFolderName = `${projectCode}_${sanitizeFileName(projectObject)}`;
  const projectHandle = await rootHandle.getDirectoryHandle(projectFolderName, { 
    create: true 
  });

  // Create structure inside project folder
  await createFolderStructure(projectHandle, templateData.structure);

  // Get list of created folders for reporting
  const createdFolders = getFolderList(templateData.structure, projectFolderName);

  return { projectHandle, createdFolders };
};

// Generate script commands for fallback
export const generateScriptCommands = (
  structure: FolderStructure,
  basePath: string = ""
): { batch: string[]; shell: string[] } => {
  const batchCommands: string[] = [];
  const shellCommands: string[] = [];

  const generateCommands = (struct: FolderStructure, currentPath: string = "") => {
    for (const [folderName, subStructure] of Object.entries(struct)) {
      const sanitizedName = sanitizeFileName(folderName);
      const fullPath = currentPath ? `${currentPath}/${sanitizedName}` : sanitizedName;
      const winPath = fullPath.replace(/\//g, "\\");
      
      batchCommands.push(`mkdir "${basePath ? `${basePath}\\${winPath}` : winPath}"`);
      shellCommands.push(`mkdir -p "${basePath ? `${basePath}/${fullPath}` : fullPath}"`);
      
      if (subStructure && Object.keys(subStructure).length > 0) {
        generateCommands(subStructure, fullPath);
      }
    }
  };

  generateCommands(structure);
  
  return { batch: batchCommands, shell: shellCommands };
};

// Create and download script files
export const downloadScriptFiles = (
  projectCode: string,
  projectObject: string,
  template: string
): void => {
  const templateData = PROJECT_TEMPLATES[template];
  if (!templateData) {
    throw new Error(`Template non trovato: ${template}`);
  }

  const projectFolderName = `${projectCode}_${sanitizeFileName(projectObject)}`;
  const { batch, shell } = generateScriptCommands(templateData.structure, projectFolderName);

  // Create batch file content
  const batchContent = [
    `@echo off`,
    `echo Creazione struttura cartelle per progetto ${projectCode}`,
    `echo.`,
    ...batch,
    `echo.`,
    `echo Struttura cartelle creata con successo!`,
    `pause`
  ].join('\r\n');

  // Create shell script content
  const shellContent = [
    `#!/bin/bash`,
    `echo "Creazione struttura cartelle per progetto ${projectCode}"`,
    `echo`,
    ...shell,
    `echo`,
    `echo "Struttura cartelle creata con successo!"`
  ].join('\n');

  // Download batch file
  downloadFile(`${projectCode}_create_structure.bat`, batchContent);
  
  // Download shell script
  downloadFile(`${projectCode}_create_structure.sh`, shellContent);
};

// Utility functions
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
};

const getFolderList = (structure: FolderStructure, basePath: string = ""): string[] => {
  const folders: string[] = [];
  
  const addFolders = (struct: FolderStructure, currentPath: string = "") => {
    for (const [folderName, subStructure] of Object.entries(struct)) {
      const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      folders.push(fullPath);
      
      if (subStructure && Object.keys(subStructure).length > 0) {
        addFolders(subStructure, fullPath);
      }
    }
  };

  addFolders(structure, basePath);
  return folders;
};

const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Check if we can write to a directory
export const checkDirectoryWritePermission = async (
  dirHandle: FileSystemDirectoryHandle
): Promise<boolean> => {
  try {
    // Try to create a temporary file to test write permission
    const testFileName = `.g2_write_test_${Date.now()}`;
    const testFileHandle = await dirHandle.getFileHandle(testFileName, { 
      create: true 
    });
    
    // Clean up test file
    await dirHandle.removeEntry(testFileName);
    return true;
  } catch (error) {
    console.error('Write permission check failed:', error);
    return false;
  }
};

// Get directory info
export const getDirectoryInfo = async (
  dirHandle: FileSystemDirectoryHandle
): Promise<{
  name: string;
  path?: string;
  canWrite: boolean;
}> => {
  const canWrite = await checkDirectoryWritePermission(dirHandle);
  
  return {
    name: dirHandle.name,
    canWrite,
  };
};
