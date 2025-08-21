const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendProcess;
let configPath;

// Config 파일 관리
function getConfigPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.json');
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Config load error:', error);
  }
  return {};
}

function saveConfig(config) {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Config save error:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  mainWindow.loadFile('renderer/index.html');

  // 창이 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 개발 도구 (프로덕션에서는 제거)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  try {
    let backendPath;
    let backendDir;
    
    if (app.isPackaged) {
      // 패키징된 환경
      backendDir = path.join(process.resourcesPath, 'backend');
      backendPath = path.join(backendDir, 'app.exe');
    } else {
      // 개발 환경
      backendDir = path.join(__dirname, 'assets', 'backend');
      backendPath = path.join(backendDir, 'app.exe');
      
      // exe가 없으면 Python으로 fallback
      if (!fs.existsSync(backendPath)) {
        console.log('Backend exe not found, using Python...');
        const devBackendDir = path.join(__dirname, '..', 'rain_back_cpu');
        const pythonPath = path.join(devBackendDir, '.venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(devBackendDir, 'app.py');
        
        backendProcess = spawn(pythonPath, [scriptPath], {
          cwd: devBackendDir,
          stdio: 'pipe'
        });
        
        setupBackendListeners();
        return;
      }
    }
    
    console.log(`Starting backend from: ${backendPath}`);
    
    // exe 파일 실행
    backendProcess = spawn(backendPath, [], {
      cwd: backendDir,
      stdio: 'pipe'
    });
    
    setupBackendListeners();
  } catch (error) {
    console.error('Error starting backend:', error);
  }
}

function setupBackendListeners() {
  if (!backendProcess) return;
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
  });

  console.log('Backend process started');
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    console.log('Backend process stopped');
  }
}

// IPC 핸들러
ipcMain.handle('get-backend-status', async () => {
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  return saveConfig(config);
});

ipcMain.handle('get-config-value', (event, key) => {
  const config = loadConfig();
  return config[key];
});

ipcMain.handle('set-config-value', (event, key, value) => {
  const config = loadConfig();
  config[key] = value;
  return saveConfig(config);
});

// 앱 이벤트
app.whenReady().then(() => {
  configPath = getConfigPath();
  startBackend();
  
  // 백엔드 시작 후 잠시 대기 후 창 생성
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// 예외 처리
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});