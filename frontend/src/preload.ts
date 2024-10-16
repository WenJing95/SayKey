// preload.ts
import {contextBridge, ipcRenderer} from 'electron';
import {Language} from './i18n';

interface MediaDeviceInfo {
    deviceId: string;
    kind: string;
    label: string;
    groupId: string;
}

contextBridge.exposeInMainWorld('electron', {
    onTriggerVoiceRecognition: (callback: () => void) => {
        ipcRenderer.on('trigger-voice-recognition', () => callback());
    },
    toggleAlwaysOnTop: () => {
        ipcRenderer.send('toggle-always-on-top');
    },
    showContextMenu: () => {
        ipcRenderer.send('show-context-menu');
    },
    onLanguageChanged: (callback: (lang: Language) => void) => {
        ipcRenderer.on('language-changed', (_, lang) => callback(lang));
    },
    getInitialSettings: () => {
        return new Promise((resolve) => {
            ipcRenderer.send('get-initial-settings');
            ipcRenderer.once('initial-settings', (_, settings) => {
                resolve(settings);
            });
        });
    },
    onSettingsUpdated: (callback: (settings: Partial<{
        language: Language;
        currentShortcut: string;
        selectedMicrophoneId: string;
    }>) => void) => {
        ipcRenderer.on('settings-updated', (_, settings) => callback(settings));
    },
    sendMicrophoneList: (devices: MediaDeviceInfo[]) => {
        ipcRenderer.send('microphone-list', devices);
    },
    getCurrentMicrophone: () => {
        return new Promise((resolve) => {
            ipcRenderer.send('get-current-microphone');
            ipcRenderer.once('current-microphone', (_, index) => {
                resolve(index);
            });
        });
    },
    onAudioDevicesUpdated: (callback: (devices: MediaDeviceInfo[]) => void) => {
        ipcRenderer.on('audio-devices-updated', (_, devices) => callback(devices));
    },
    onStopVoiceRecognition: (callback: () => void) => {
        ipcRenderer.on('stop-voice-recognition', () => callback());
    },
    checkBackendStatus: () => {
        return new Promise((resolve) => {
            ipcRenderer.send('check-backend-status');
            ipcRenderer.once('backend-status', (_, status) => {
                resolve(status);
            });
        });
    },
    getCurrentLanguage: () => ipcRenderer.invoke('get-current-language'),
    onServerStatusChanged: (callback: (status: 'error' | 'starting' | 'running') => void) => {
        ipcRenderer.on('server-status-changed', (_, status) => callback(status));
    },
    onCurrentShortcutChanged: (callback: (shortcut: string) => void) => {
        ipcRenderer.on('current-shortcut', (_, shortcut) => callback(shortcut));
    },
    onInitSettings: (callback: (settings: { language: Language; currentShortcut: string }) => void) => {
        ipcRenderer.on('init-settings', (_, settings) => callback(settings));
    },
    onShowShortcutHint: (callback: () => void) => {
        ipcRenderer.on('show-shortcut-hint', () => callback());
    },
});

contextBridge.exposeInMainWorld('logger', {
    requestLogs: () => ipcRenderer.send('request-logs'),
    onLog: (callback: (message: string) => void) => {
        ipcRenderer.on('log', (_, message) => callback(message));
    },
    onLogsReceived: (callback: (logs: string[]) => void) => {
        ipcRenderer.on('logs', (_, logs) => callback(logs));
    },
});
