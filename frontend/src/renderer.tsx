// renderer.tsx
import React, {useEffect, useState, useRef, useCallback} from 'react';
import ReactDOM from 'react-dom';
import VoiceRecognitionIcon from './VoiceRecognitionIcon';
import './globals.css';
import 'animate.css';
import {Language, translations} from './i18n';

declare global {
    interface Window {
        electron: {
            onTriggerVoiceRecognition: (callback: () => void) => void;
            toggleAlwaysOnTop: () => void;
            showContextMenu: () => void;
            onLanguageChanged: (callback: (lang: Language) => void) => void;
            getInitialSettings: () => Promise<{
                language: Language;
                currentShortcut: string;
            }>;
            onSettingsUpdated: (callback: (settings: Partial<{
                language: Language;
                currentShortcut: string;
            }>) => void) => void;
            getCurrentMicrophone: () => Promise<number>;
            onAudioDevicesUpdated: (callback: (devices: MediaDeviceInfo[]) => void) => void;
            onStopVoiceRecognition: (callback: () => void) => void;
            checkBackendStatus: () => Promise<'starting' | 'running' | 'error'>;
            onServerStatusChanged: (callback: (status: 'error' | 'starting' | 'running') => void) => void;
            onCurrentShortcutChanged: (callback: (shortcut: string) => void) => void;
            onInitSettings: (callback: (settings: { language: Language; currentShortcut: string }) => void) => void;
            onShowShortcutHint: (callback: () => void) => void;
        };
    }
}

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [language, setLanguage] = useState<Language>('English');
    const [currentShortcut, setCurrentShortcut] = useState('CommandOrControl+Q');
    const [currentMicrophoneIndex, setCurrentMicrophoneIndex] = useState<number>(0);
    const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [backendStatus, setBackendStatus] = useState<'starting' | 'running' | 'error'>('starting');
    const [serverStatus, setServerStatus] = useState<'error' | 'starting' | 'running'>('starting');
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const handleTriggerVoiceRecognition = () => {
            console.log('Voice recognition triggered');
            setIsRecording(true);

            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
            }

            recordingTimeoutRef.current = setTimeout(() => {
                setIsRecording(false);
            }, 1000);
        };

        const handleLanguageChange = (newLang: Language) => {
            setLanguage(newLang);
        };

        window.electron.onTriggerVoiceRecognition(handleTriggerVoiceRecognition);
        window.electron.onLanguageChanged(handleLanguageChange);

        window.electron.getInitialSettings().then((settings) => {
            setLanguage(settings.language);
            setCurrentShortcut(settings.currentShortcut);
        });

        window.electron.getCurrentMicrophone().then((index: number) => {
            setCurrentMicrophoneIndex(index);
        });

        const handleAudioDevicesUpdate = (devices: MediaDeviceInfo[]) => {
            console.log('Audio devices updated:', devices);
        };

        window.electron.onAudioDevicesUpdated(handleAudioDevicesUpdate);

        const handleStopVoiceRecognition = () => {
            console.log('Voice recognition stopped');
            setIsRecording(false);
        };

        window.electron.onStopVoiceRecognition(handleStopVoiceRecognition);

        window.electron.onServerStatusChanged((status) => {
            setServerStatus(status);
            if (status === 'starting') {
                setShowHint(false);
            } else if (status === 'running') {
                setTimeout(() => setShowHint(true), 500);
            }
        });

        window.electron.onCurrentShortcutChanged((shortcut) => {
            setCurrentShortcut(shortcut);
        });

        window.electron.onInitSettings((settings) => {
            setLanguage(settings.language);
            setCurrentShortcut(settings.currentShortcut);
        });

        const handleShowShortcutHint = () => {
            setShowHint(true);
            console.log('Showing shortcut hint');
            setTimeout(() => {
                setShowHint(false);
                console.log('Hiding shortcut hint');
            }, 7000);
        };

        window.electron.onShowShortcutHint(handleShowShortcutHint);
        window.electron.onLanguageChanged((newLang) => {
            setLanguage(newLang);
            handleShowShortcutHint();
        });

        window.electron.onSettingsUpdated((settings) => {
            if (settings.currentShortcut) {
                setCurrentShortcut(settings.currentShortcut);
                handleShowShortcutHint();
            }
        });

        return () => {
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
            }
            window.electron.onAudioDevicesUpdated(() => {
            });
            window.electron.onStopVoiceRecognition(() => {
            });
            window.electron.onShowShortcutHint(() => {
            });
            window.electron.onLanguageChanged(() => {
            });
            window.electron.onSettingsUpdated(() => {
            });
        };
    }, []);

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            window.electron.showContextMenu();
        };

        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    const t = translations[language];

    useEffect(() => {
        const handleSettingsUpdate = (updatedSettings: Partial<{
            language: Language;
            currentShortcut: string;
            currentMicrophoneIndex: number;
        }>) => {
            if (updatedSettings.language) setLanguage(updatedSettings.language);
            if (updatedSettings.currentShortcut) setCurrentShortcut(updatedSettings.currentShortcut);
            if (updatedSettings.currentMicrophoneIndex !== undefined) setCurrentMicrophoneIndex(updatedSettings.currentMicrophoneIndex);
        };

        window.electron.onSettingsUpdated(handleSettingsUpdate);

        return () => {
            window.electron.onSettingsUpdated(() => {
            });
        };
    }, []);

    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                const status = await window.electron.checkBackendStatus();
                setBackendStatus(status);
            } catch (error) {
                console.error('Failed to check backend status:', error);
                setBackendStatus('error');
            }
        };

        checkBackendStatus();

        const intervalId = setInterval(checkBackendStatus, 6000);

        return () => clearInterval(intervalId);
    }, []);

    const handleHintHide = useCallback(() => {
        setShowHint(false);
    }, []);

    return (
        <div
            className="h-screen flex items-center justify-center bg-transparent cursor-default"
        >
            <div className="no-drag">
                <VoiceRecognitionIcon
                    isRecording={isRecording}
                    language={language}
                    currentShortcut={currentShortcut}
                    serverStatus={serverStatus}
                    showHint={showHint}
                    onHintHide={handleHintHide}
                />
            </div>
        </div>
    );
}

ReactDOM.render(<App/>, document.getElementById('root'));
