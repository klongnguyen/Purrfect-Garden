import path from 'path';
import { app, BrowserWindow, powerMonitor } from 'electron';
import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import { createDatabaseConnection } from './database/connection';
import { runMigrations } from './database/migrator';
import { AchievementService } from './services/AchievementService';
import { FoundationService } from './services/FoundationService';
import { FocusHistoryService } from './services/FocusHistoryService';
import { GardenService } from './services/GardenService';
import { GoalStreakService } from './services/GoalStreakService';
import { MusicService } from './services/MusicService';
import { PetService } from './services/PetService';
import { ProgressionService } from './services/ProgressionService';
import { TaskService } from './services/TaskService';
import { TimerSupervisor } from './services/TimerSupervisor';
import { registerIpcHandlers } from './ipc/registerIpcHandlers';

let mainWindow: BrowserWindow | null = null;
let database: Database.Database | null = null;
let timerSupervisor: TimerSupervisor | null = null;

function broadcastToRenderer(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

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

  window.on('close', () => {
    timerSupervisor?.pause('app_exit');
    checkpointDatabase();
  });

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
  const focusHistoryService = new FocusHistoryService(database);
  const taskService = new TaskService(database);
  const goalStreakService = new GoalStreakService(database);
  const musicService = new MusicService(database);
  const gardenService = new GardenService(database);
  const progressionService = new ProgressionService(database);
  const achievementService = new AchievementService(database);
  const petService = new PetService(database);
  timerSupervisor = new TimerSupervisor(database, {
    onTick: (snapshot) => broadcastToRenderer(IPC_CHANNELS.TIMER_TICK_EVENT, snapshot),
    onCompleted: (result) =>
      broadcastToRenderer(IPC_CHANNELS.TIMER_COMPLETED_EVENT, result)
  });

  registerIpcHandlers(
    foundationService,
    timerSupervisor,
    focusHistoryService,
    taskService,
    goalStreakService,
    musicService,
    gardenService,
    progressionService,
    achievementService,
    petService
  );

  mainWindow = createMainWindow();

  powerMonitor.on('suspend', () => {
    timerSupervisor?.pause('system_suspend');
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
  timerSupervisor?.pause('app_exit');
  timerSupervisor?.dispose();
  timerSupervisor = null;
  closeDatabaseSafely();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
