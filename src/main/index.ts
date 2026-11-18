import path from 'path';
import { app, BrowserWindow, powerMonitor } from 'electron';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from './database/connection';
import { runMigrations } from './database/migrator';
import { FoundationService } from './services/FoundationService';
import { registerIpcHandlers } from './ipc/registerIpcHandlers';

let mainWindow: BrowserWindow | null = null;
let database: Database.Database | null = null;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'Purrfect Garden',
    backgroundColor: '#FAF6EE',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
}

function checkpointDatabase(): void {
  if (!database) return;
  try {
    database.pragma('wal_checkpoint(PASSIVE)');
  } catch {
    // Ignore checkpoint errors during shutdown
  }
}

function closeDatabaseSafely(): void {
  if (!database) return;
  try {
    database.pragma('wal_checkpoint(TRUNCATE)');
    database.close();
  } finally {
    database = null;
  }
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'purrfect_garden.db');
  database = createDatabaseConnection(dbPath);
  runMigrations(database);

  const foundationService = new FoundationService(database, dbPath);
  registerIpcHandlers(foundationService);

  mainWindow = createMainWindow();

  powerMonitor.on('suspend', () => {
    // M1.2 TimerSupervisor will synchronously pause active sessions here before checkpointing
    checkpointDatabase();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
    }
  });
});

app.on('before-quit', () => {
  // M1.2 TimerSupervisor will synchronously pause active sessions here before closing SQLite
  closeDatabaseSafely();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
