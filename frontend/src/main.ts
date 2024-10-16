// main.ts
import {
    app,
    BrowserWindow,
    screen,
    Tray,
    Menu,
    globalShortcut,
    ipcMain,
    MenuItem,
    nativeTheme,
    nativeImage,
    shell
} from 'electron';
import * as path from 'path';
import {Language, translations} from './i18n';
import Store from 'electron-store';
import axios from 'axios';
import {spawn, ChildProcess, exec} from 'child_process';


if (process.platform === 'win32') {
    app.setAppUserModelId("com.SayKey.SayKey");
}

const store = new Store();
console.log('Store path:', store.path);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isAlwaysOnTop = true;
let lastShortcutTriggerTime = 0;
const DEBOUNCE_TIME = 300;

let currentLanguage: Language = 'English';
let currentShortcut = 'CommandOrControl+Q';

let contextMenuHandler: ((event: Electron.IpcMainEvent) => void) | null = null;

let audioDevices: { index: number; name: string; is_current: boolean }[] = [];

let isServerRunning = false;
let backendProcess: ChildProcess | null = null;
let serverStartTime: number | null = null;
let microphoneCheckInterval: NodeJS.Timeout | null = null;

type ServerStatus = 'error' | 'starting' | 'running';
let serverStatus: ServerStatus = 'starting';
let isWindowMinimized = false;

let isBackendRunning = false;

let backendPort = 58652;

async function isPortAvailable(port: number): Promise<boolean> {
    try {
        await axios.get(`http://localhost:${port}/ping`, {timeout: 1000});
        return false;
    } catch (error) {
        return true;
    }
}

function convertHotkeyForServer(hotkey: string): string {
    if (hotkey === 'CapsLock') {
        return 'capslock';
    } else {
        return hotkey.replace('CommandOrControl', 'ctrl');
    }
}

function killAllSayKeyProcesses(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (isDevelopment()) {
            console.log('Development environment: Skip terminating backend process');
            resolve();
            return;
        }

        exec('taskkill /F /IM SayKey-server.exe', (error, stdout, stderr) => {
            if (error) {
                console.log(`No running SayKey-server.exe process was found or the process could not be terminated: ${error.message}`);
                resolve();
            } else {
                console.log(`Successfully killed all SayKey-server.exe processes: ${stdout}`);
                resolve();
            }
        });
    });
}

function isDevelopment() {
    return !app.isPackaged;
}

async function startBackendService() {
    if (isDevelopment()) {
        console.log('Development environment: Skip starting backend services');
        serverStatus = 'starting';
        updateTrayMenu();
        updateContextMenu();
        serverStartTime = Date.now();
        return;
    }

    await killAllSayKeyProcesses();

    let backendPath: string;
    let sherpaOnnxPath: string;
    let tokensPath: string;

    if (isDevelopment()) {
        backendPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'SayKey-server.exe');
        sherpaOnnxPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'sherpa-onnx', 'model.int8.onnx');
        tokensPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'sherpa-onnx', 'tokens.txt');
    } else {
        // exe
        const exeDir = path.dirname(process.execPath);
        backendPath = path.join(exeDir, 'SayKey-server.exe');
        sherpaOnnxPath = path.join(exeDir, 'sherpa-onnx', 'model.int8.onnx');
        tokensPath = path.join(exeDir, 'sherpa-onnx', 'tokens.txt');
    }

    console.log('App path:', app.getAppPath());
    console.log('Backend path:', backendPath);
    console.log('Sherpa ONNX path:', sherpaOnnxPath);
    console.log('Tokens path:', tokensPath);

    const serverHotkey = convertHotkeyForServer(currentShortcut);

    let port = 58652;
    const maxPort = 58662;

    while (port <= maxPort) {
        if (await isPortAvailable(port)) {
            break;
        }
        port++;
    }

    if (port > maxPort) {
        console.error('Unable to find available port');
        serverStatus = 'error';
        updateTrayMenu();
        updateContextMenu();
        return;
    }

    const args = [
        `--sense-voice=${sherpaOnnxPath}`,
        `--tokens=${tokensPath}`,
        `--hotkey=${serverHotkey}`,
        `--api-port=${port}`
    ];

    backendProcess = spawn(backendPath, args, {
        cwd: path.dirname(backendPath),
        stdio: 'pipe'
    });
    if (backendProcess.stdout) {
        backendProcess.stdout.setEncoding('utf8');
    }
    if (backendProcess.stderr) {
        backendProcess.stderr.setEncoding('utf8');
    }

    backendProcess.stdout?.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr?.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        isBackendRunning = false;
        serverStatus = 'error';
        updateTrayMenu();
        updateContextMenu();
    });

    isBackendRunning = true;
    serverStatus = 'starting';
    serverStartTime = Date.now();
    updateTrayMenu();
    updateContextMenu();

    backendPort = port;
}

function loadSettings() {
    const systemLanguage = app.getLocale();
    let defaultLanguage: Language = 'English';
    if (systemLanguage.startsWith('ja')) {
        defaultLanguage = '日本語';
    } else if (systemLanguage.startsWith('zh')) {
        defaultLanguage = '简体中文';
    }

    currentLanguage = store.get('language', defaultLanguage) as Language;
    currentShortcut = store.get('shortcut', 'CommandOrControl+Q') as string;
    console.log('Settings loaded:', {currentLanguage, currentShortcut});
}

function saveSettings() {
    store.set('language', currentLanguage);
    store.set('shortcut', currentShortcut);
    console.log('Settings saved:', {currentLanguage, currentShortcut});
}

async function fetchAudioDevices() {
    try {
        const response = await axios.get(`http://localhost:${backendPort}/list_audio_devices`);
        const newAudioDevices = response.data.devices;
        if (JSON.stringify(newAudioDevices) !== JSON.stringify(audioDevices)) {
            audioDevices = newAudioDevices;
            console.log('Audio devices updated:', audioDevices);
            if (mainWindow) {
                mainWindow.webContents.send('audio-devices-updated', audioDevices);
            }
        }
    } catch (error) {
        console.error('Failed to fetch audio devices:', error);
    }
}

function changeLanguage(lang: Language) {
    currentLanguage = lang;
    saveSettings();
    if (mainWindow) {
        mainWindow.webContents.send('language-changed', lang);
    }
    setupContextMenu();
    console.log('Language changed:', lang);
}

type HotkeyResponse = {
    status: 'success' | 'error';
    message: string;
    hotkey: string;
};

async function changeShortcut(newShortcut: string) {
    const serverHotkey = convertHotkeyForServer(newShortcut);
    try {
        const response = await axios.post<HotkeyResponse>(`http://localhost:${backendPort}/set_hotkey`, {hotkey: serverHotkey});
        const data = response.data;

        if (data.status === 'success') {
            globalShortcut.unregisterAll();
            currentShortcut = newShortcut;
            saveSettings();
            registerGlobalShortcut();
            if (mainWindow) {
                mainWindow.webContents.send('settings-updated', {currentShortcut: newShortcut});
            }
            console.log('Shortcut changed:', newShortcut);
        } else {
            console.log('Failed to change shortcut:', data.message);
            currentShortcut = convertServerHotkeyToElectron(data.hotkey);
        }
    } catch (error) {
        console.error('Failed to change shortcut:', error);
    }
    setupContextMenu();
    updateTrayMenu();
}

function convertServerHotkeyToElectron(serverHotkey: string): string {
    if (serverHotkey === 'capslock') {
        return 'CapsLock';
    } else if (serverHotkey.includes('ctrl')) {
        return serverHotkey.replace('ctrl', 'CommandOrControl');
    }
    return serverHotkey;
}

function getMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    const t = translations[currentLanguage];

    let statusIcon: string;
    let statusText: string;

    switch (serverStatus) {
        case 'running':
            statusIcon = '🟢';
            statusText = t['serverRunning'] || 'Server Running';
            break;
        case 'starting':
            statusIcon = '🟡';
            statusText = t['serverStarting'] || 'Server Starting';
            break;
        case 'error':
        default:
            statusIcon = '⚪';
            statusText = t['serverOffline'] || 'Server Offline';
    }

    const currentMicrophone = audioDevices.find(device => device.is_current);
    const currentMicrophoneName = currentMicrophone ? currentMicrophone.name : t['noDevicesFound'];

    const currentShortcutDisplay = (() => {
        switch (currentShortcut) {
            case 'CommandOrControl+Q':
                return t['holdCtrlQ'];
            case 'CommandOrControl+CapsLock':
                return t['holdCtrlCapsLock'];
            case 'CapsLock':
                return t['holdCapsLock'];
            default:
                return `${t['hold']} ${convertHotkeyForServer(currentShortcut)}`;
        }
    })();

    return [
        // Application Header
        {label: `SayKey v1.0.0`, enabled: false},
        {type: 'separator'},

        // Server Status
        {label: `${statusIcon} ${statusText}`, enabled: false},
        {type: 'separator'},

        // Settings
        {
            label: `${t['microphoneSelection']}: ${currentMicrophoneName}`,
            submenu: audioDevices.map(device => ({
                label: device.name,
                type: 'radio',
                checked: device.is_current,
                click: () => changeMicrophone(device.index),
            })),
        },
        {
            label: `${t['launchShortcut']}: ${currentShortcutDisplay}`,
            submenu: [
                {
                    label: t['holdCtrlQ'],
                    type: 'radio',
                    checked: currentShortcut === 'CommandOrControl+Q',
                    click: () => changeShortcut('CommandOrControl+Q'),
                },
                {
                    label: t['holdCtrlCapsLock'],
                    type: 'radio',
                    checked: currentShortcut === 'CommandOrControl+CapsLock',
                    click: () => changeShortcut('CommandOrControl+CapsLock'),
                },
                {
                    label: t['holdCapsLock'],
                    type: 'radio',
                    checked: currentShortcut === 'CapsLock',
                    click: () => changeShortcut('CapsLock'),
                },
            ],
        },
        {
            label: t['interfaceLanguage'],
            submenu: [
                {
                    label: 'English',
                    type: 'radio',
                    checked: currentLanguage === 'English',
                    click: () => changeLanguage('English'),
                },
                {
                    label: '日本語',
                    type: 'radio',
                    checked: currentLanguage === '日本語',
                    click: () => changeLanguage('日本語'),
                },
                {
                    label: '简体中文',
                    type: 'radio',
                    checked: currentLanguage === '简体中文',
                    click: () => changeLanguage('简体中文'),
                },
            ],
        },
        {type: 'separator'},

        // Tools / Support
        {
            label: t['viewLogs'],
            click: () => {
                if (logWindow) {
                    logWindow.focus();
                } else {
                    createLogWindow();
                }
            },
        },
        {
            label: t['restartBackend'],
            click: () => {
                restartBackendService();
            },
        },
        {
            label: 'Github ⭐',
            click: () => {
                shell.openExternal('https://github.com/WenJing95/SayKey');
            },
        },
        {type: 'separator'},

        // Window Management
        {
            label: isWindowMinimized ? t['show'] : t['minimize'],
            click: () => {
                if (isWindowMinimized) {
                    mainWindow?.restore();
                    isWindowMinimized = false;
                } else {
                    mainWindow?.minimize();
                    isWindowMinimized = true;
                }
                updateTrayMenu();
                updateContextMenu();
            },
        },
        {
            label: t['exit'],
            click: () => app.quit(),
        },
    ];
}

async function changeMicrophone(index: number) {
    try {
        await axios.post(`http://localhost:${backendPort}/set_audio_device`, {index});
        store.set('currentMicrophoneIndex', index);
        await fetchAudioDevices();
        updateTrayMenu();
        setupContextMenu();
        if (mainWindow) {
            mainWindow.webContents.send('settings-updated', {currentMicrophoneIndex: index});
        }
        console.log('Microphone changed:', index);
    } catch (error) {
        console.error('Failed to change microphone:', error);
    }
}

function setupContextMenu() {
    if (contextMenuHandler) {
        ipcMain.removeListener('show-context-menu', contextMenuHandler);
    }

    contextMenuHandler = (event) => {
        const menu = Menu.buildFromTemplate(getMenuTemplate());

        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            menu.popup({window: win});
        }

        event.sender.send('current-shortcut', currentShortcut);
    };

    ipcMain.on('show-context-menu', contextMenuHandler);
}

async function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const {width, height} = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: 90,
        height: 40,
        x: Math.round((width - 90) / 2), // Center horizontally
        y: Math.round(height - 60), // 20 pixels from the bottom
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        // icon: path.join(__dirname, './icon-light.ico'),
        icon: __dirname + '/icon-light.ico',
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
        },
    });

    try {
        await mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
        mainWindow.setMovable(true);
        updateAlwaysOnTop();

        // Make the window draggable
        mainWindow.setIgnoreMouseEvents(false);

        // Handle context menu
        setupContextMenu();

        mainWindow.on('minimize', () => {
            isWindowMinimized = true;
            updateTrayMenu();
            updateContextMenu();
        });

        mainWindow.on('restore', () => {
            isWindowMinimized = false;
            updateTrayMenu();
            updateContextMenu();
        });

        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow?.webContents.send('init-animation', {
                language: currentLanguage,
                currentShortcut: currentShortcut
            });
        });
    } catch (error) {
        console.error('Failed to load the HTML file:', error);
    }
}

function updateAlwaysOnTop() {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'floating');
    }
}

function createTray() {
    try {
        const isDarkMode = nativeTheme.shouldUseDarkColors;
        const iconPath = isDarkMode ? 'icon-light.png' : 'icon-dark.png';
        const trayIcon = nativeImage.createFromPath(path.join(__dirname, iconPath));
        tray = new Tray(trayIcon);
        // tray = new Tray(nativeImage.createFromPath(iconPath));
        updateTrayMenu();
        nativeTheme.on('updated', () => {
            const newIconPath = nativeTheme.shouldUseDarkColors ? 'icon-light.png' : 'icon-dark.png';
            const newTrayIcon = nativeImage.createFromPath(path.join(__dirname, newIconPath));
            tray?.setImage(newTrayIcon);
        });

        setInterval(checkServerStatus, 6000);
    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

function updateTrayMenu() {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate(getMenuTemplate());
    tray.setToolTip(`SayKey`);
    tray.setContextMenu(contextMenu);
}

function registerGlobalShortcut() {
    try {
        globalShortcut.unregisterAll();

        if (currentShortcut === 'CapsLock') {
            let isCapsLockPressed = false;

            globalShortcut.register('CapsLock', () => {
                isCapsLockPressed = true;
                // console.log('CapsLock pressed');
                if (mainWindow) {
                    mainWindow.webContents.send('trigger-voice-recognition');
                }
            });

            globalShortcut.register('CapsLock', () => {
                if (isCapsLockPressed) {
                    isCapsLockPressed = false;
                    // console.log('CapsLock released');
                    if (mainWindow) {
                        mainWindow.webContents.send('stop-voice-recognition');
                    }
                }
            });
        } else {
            const ret = globalShortcut.register(currentShortcut, () => {
                const now = Date.now();
                if (now - lastShortcutTriggerTime > DEBOUNCE_TIME) {
                    // console.log(`${currentShortcut} is pressed`);
                    if (mainWindow) {
                        mainWindow.webContents.send('trigger-voice-recognition');
                    }
                    lastShortcutTriggerTime = now;
                }
            });

            if (!ret) {
                console.log('Shortcut registration failed');
            }
        }

        console.log(`${currentShortcut} registration:`, globalShortcut.isRegistered(currentShortcut));
    } catch (error) {
        console.error('Failed to register global shortcut:', error);
    }
}

async function checkServerStatus() {
    if (serverStatus === 'starting' && serverStartTime && Date.now() - serverStartTime < 5000) {
        return; // If the server has just started, do not check and give the backend server some time to start
    }

    // if (!isBackendRunning) {
    //   serverStatus = 'error';
    //   updateTrayMenu();
    //   updateContextMenu();
    //   return;
    // }

    try {
        const response = await axios.get(`http://localhost:${backendPort}/ping`, {timeout: 2000});
        const status = response.data.status === 'alive' ? 'running' : 'error';
        if (serverStatus !== status) {
            serverStatus = status;
            if (serverStatus === 'running') {
                await fetchAudioDevices();
                startMicrophoneCheck();
            } else {
                stopMicrophoneCheck();
            }
            if (mainWindow) {
                mainWindow.webContents.send('server-status-changed', serverStatus);
            }
        }
    } catch (error) {
        serverStatus = 'error';
        stopMicrophoneCheck();
    }
    updateTrayMenu();
    updateContextMenu();
}

function updateContextMenu() {
    if (mainWindow) {
        const menu = Menu.buildFromTemplate(getMenuTemplate());
        mainWindow.setMenu(menu);
    }
}

function startMicrophoneCheck() {
    if (!microphoneCheckInterval) {
        microphoneCheckInterval = setInterval(async () => {
            await fetchAudioDevices();
            updateTrayMenu();
            updateContextMenu();
        }, 5000);
    }
}

function stopMicrophoneCheck() {
    if (microphoneCheckInterval) {
        clearInterval(microphoneCheckInterval);
        microphoneCheckInterval = null;
    }
}

let logWindow: BrowserWindow | null = null;
const logMessages: string[] = [];

function createLogWindow() {
    logWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        icon: __dirname + '/icon-light.ico',
        // icon: path.join(__dirname, '/icon-light.ico'),
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    logWindow.loadFile(path.join(__dirname, '..', 'src', 'log.html'));

    logWindow.webContents.on('did-finish-load', () => {
        logWindow?.webContents.send('logs', logMessages);
    });

    logWindow.on('closed', () => {
        logWindow = null;
    });
}

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    const message = args.join(' ');
    logMessages.push(message);
    if (logWindow) {
        logWindow.webContents.send('log', message);
    }
    originalLog.apply(console, args);
};

console.error = (...args) => {
    const message = args.join(' ');
    logMessages.push(`ERROR: ${message}`);
    if (logWindow) {
        logWindow.webContents.send('log', `ERROR: ${message}`);
    }
    originalError.apply(console, args);
};

app.whenReady().then(async () => {
    loadSettings();
    await startBackendService(); // Make sure the backend service is started
    await fetchAudioDevices();
    await createWindow();
    createTray();
    registerGlobalShortcut();
    setupContextMenu();
    startMicrophoneCheck();

    if (mainWindow) {
        mainWindow.webContents.send('init-settings', {language: currentLanguage, currentShortcut: currentShortcut});
    }

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });

    ipcMain.on('get-initial-language', (event) => {
        event.reply('initial-language', currentLanguage);
    });

    ipcMain.on('get-initial-settings', (event) => {
        const settings = {
            language: currentLanguage,
            currentShortcut: currentShortcut
        };
        console.log('Sending initial settings to renderer:', settings);
        event.reply('initial-settings', settings);
    });

    ipcMain.on('request-logs', (event) => {
        event.reply('logs', logMessages);
    });

    setInterval(checkServerStatus, 5000);

    ipcMain.handle('get-current-language', () => {
        return currentLanguage;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', async () => {
    if (backendProcess) {
        backendProcess.kill();
        isBackendRunning = false;
    }
    // Make sure all SayKey-server.exe processes are killed
    await killAllSayKeyProcesses();
    globalShortcut.unregisterAll();
    saveSettings();
    stopMicrophoneCheck();
});

ipcMain.on('toggle-always-on-top', () => {
    isAlwaysOnTop = !isAlwaysOnTop;
    updateAlwaysOnTop();
    updateTrayMenu();
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function getCurrentHotkey() {
    try {
        const response = await axios.get<{ hotkey: string }>(`http://localhost:${backendPort}/get_hotkey`);
        const serverHotkey = response.data.hotkey;
        currentShortcut = serverHotkey.includes('ctrl') ? serverHotkey.replace('ctrl', 'CommandOrControl') :
            serverHotkey.includes('command') ? serverHotkey.replace('command', 'CommandOrControl') :
                serverHotkey;
        console.log('Current hotkey:', currentShortcut);
    } catch (error) {
        console.error('Failed to get current hotkey:', error);
    }
    setupContextMenu();
    updateTrayMenu();
}

function restartBackendService() {
    if (backendProcess) {
        backendProcess.kill();
    }
    serverStatus = 'starting';
    if (mainWindow) {
        mainWindow.webContents.send('server-status-changed', serverStatus);
    }
    startBackendService();
}
