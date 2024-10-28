import React, {useState, useEffect, useCallback, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Language, translations} from './i18n';
import 'animate.css';

interface VoiceRecognitionIconProps {
    isRecording: boolean;
    language: Language;
    currentShortcut: string;
    serverStatus: 'error' | 'starting' | 'running';
    showHint: boolean;
    onHintHide: () => void;
}

const getHeightClass = (volume: number) => {
    const heights = ["h-[6px]", "h-[7px]", "h-[8px]", "h-[9px]", "h-[10px]", "h-[11px]"];
    return heights[Math.min(Math.floor(volume * 6), 5)];
};

const getColorClass = (index: number, totalBars: number, progress: number) => {
    const colors = [
        "bg-gray-200",
        "bg-gray-300",
        "bg-gray-400",
        "bg-gray-500",
        "bg-gray-600",
        "bg-gray-700",
        "bg-gray-800",
        "bg-gray-900",
        "bg-black",
    ];
    const middleIndex = Math.floor(totalBars / 2);
    let colorIndex = index < middleIndex
        ? Math.min(index, colors.length - 1)
        : Math.min(totalBars - index - 1, colors.length - 1);

    colorIndex = Math.max(0, Math.floor(colorIndex * (1 - progress)));

    return colors[colorIndex];
};

const VoiceRecognitionIcon: React.FC<VoiceRecognitionIconProps> = ({
                                                                       isRecording,
                                                                       language,
                                                                       currentShortcut,
                                                                       serverStatus,
                                                                       showHint,
                                                                       onHintHide
                                                                   }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [bars, setBars] = useState<number[]>([]);
    const [animationProgress, setAnimationProgress] = useState(0);
    const [startingProgress, setStartingProgress] = useState(0);
    const totalBars = 20;
    const animationRef = useRef<number | null>(null);
    const [hintText, setHintText] = useState('');

    const getShortcutText = useCallback(() => {
        const kbdClass = "inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[9px] font-medium rounded border border-gray-200/60 bg-gray-50/90 text-gray-600 shadow-[0_1px_1px_rgba(0,0,0,0.1)] backdrop-blur-sm";
        const plusClass = "mx-0.5 text-[8px] text-gray-400 font-medium";

        if (currentShortcut === 'CommandOrControl+Q') {
            return (
                <div className="flex items-center">
                    <kbd className={kbdClass}>Ctrl</kbd>
                    <span className={plusClass}>+</span>
                    <kbd className={kbdClass}>Q</kbd>
                </div>
            );
        } else if (currentShortcut === 'CommandOrControl+CapsLock') {
            return (
                <div className="flex items-center">
                    <kbd className={kbdClass}>Ctrl</kbd>
                    <span className={plusClass}>+</span>
                    <kbd className={`${kbdClass} text-[8px]`}>Caps</kbd>
                </div>
            );
        } else if (currentShortcut === 'CapsLock') {
            return (
                <div className="flex items-center">
                    <kbd className={`${kbdClass} text-[8px]`}>Caps</kbd>
                </div>
            );
        } else {
            const keys = currentShortcut.split('+');
            return (
                <div className="flex items-center">
                    {keys.map((key, index) => (
                        <React.Fragment key={key}>
                            <kbd className={kbdClass}>{key}</kbd>
                            {index < keys.length - 1 && <span className={plusClass}>+</span>}
                        </React.Fragment>
                    ))}
                </div>
            );
        }
    }, [currentShortcut]);

    useEffect(() => {
        if (serverStatus === 'starting') {
            setStartingProgress(0);
            let progress = 0;
            const interval = setInterval(() => {
                progress += 0.01;
                setStartingProgress(Math.min(progress, 1));
                if (progress >= 1) {
                    clearInterval(interval);
                }
            }, 50);
            return () => clearInterval(interval);
        } else if (serverStatus === 'running') {
            setStartingProgress(1);
        }
    }, [serverStatus]);

    useEffect(() => {
        const t = translations[language];
        let shortcutText = '';

        if (currentShortcut === 'CommandOrControl+Q') {
            shortcutText = t['holdCtrlQ'];
        } else if (currentShortcut === 'CommandOrControl+CapsLock') {
            shortcutText = t['holdCtrlCapsLock'];
        } else if (currentShortcut === 'CapsLock') {
            shortcutText = t['holdCapsLock'];
        } else {
            shortcutText = `${t['hold']} ${currentShortcut}`;
        }

        setHintText(shortcutText);
    }, [language, currentShortcut]);

    useEffect(() => {
        if (showHint) {
            console.log('Hint is now visible');
        } else {
            console.log('Hint is now hidden');
        }
    }, [showHint]);

    useEffect(() => {
        if (showHint) {
            const timer = setTimeout(() => {
                onHintHide();
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [showHint, onHintHide]);

    const addBar = useCallback((volume: number) => {
        setBars(prevBars => [volume, ...prevBars.slice(0, totalBars - 1)]);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRecording) {
            setIsAnimating(false);
            interval = setInterval(() => {
                addBar(Math.random());
            }, 100);
        } else if (!isAnimating && bars.length > 0) {
            setIsAnimating(true);
            requestAnimationFrame(animateBars);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, addBar, isAnimating, bars.length]);

    const animateBars = useCallback(() => {
        let startTime: number | null = null;
        const duration = 1000;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setAnimationProgress(progress);
            setBars(prevBars => prevBars.map(volume => volume * (1 - progress)));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                setBars([]);
                setAnimationProgress(0);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, []);

    const renderBars = () => (
        <div className="flex items-center justify-center h-[11px] w-full">
            {bars.map((volume, index) => (
                <div
                    key={index}
                    className={`w-[2px] ${getHeightClass(volume)} ${getColorClass(index, totalBars, animationProgress)} rounded-full transition-all duration-100 ease-out ${
                        index < totalBars - 1 ? "mr-[1px]" : ""
                    }`}
                />
            ))}
            {[...Array(totalBars - bars.length)].map((_, index) => (
                <div
                    key={index + bars.length}
                    className={`w-[2px] h-[6px] bg-gray-200 rounded-full ${
                        index < totalBars - bars.length - 1 ? "mr-[1px]" : ""
                    }`}
                />
            ))}
        </div>
    );

    const renderStartingBars = () => (
        <div className="flex items-center justify-center h-[11px] w-full">
            {[...Array(totalBars)].map((_, index) => (
                <motion.div
                    key={index}
                    initial={{opacity: 0}}
                    animate={{opacity: index / totalBars <= startingProgress ? 1 : 0}}
                    transition={{duration: 0.5, ease: "easeInOut"}}
                    className={`w-[2px] h-[6px] bg-gray-200 rounded-full ${
                        index < totalBars - 1 ? "mr-[1px]" : ""
                    }`}
                />
            ))}
        </div>
    );

    return (
        <div
            className="w-[80px] h-6 bg-glass backdrop-blur rounded-full overflow-hidden shadow-glass cursor-default flex items-center justify-center">
            <AnimatePresence mode="wait">
                {serverStatus === 'starting' ? (
                    <motion.div
                        key="starting"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.5}}
                        className="w-full h-full flex items-center justify-center"
                    >
                        {renderStartingBars()}
                    </motion.div>
                ) : showHint ? (
                    <motion.div
                        key="hint"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.5}}
                        className="text-[10px] text-gray-800 whitespace-nowrap px-2 font-['Special Elite',monospace] font-bold animate__animated animate__pulse animate__infinite"
                    >
                        {getShortcutText()}
                    </motion.div>
                ) : (
                    <motion.div
                        key="bars"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.5}}
                        className="w-full h-full flex items-center justify-center animate__animated animate__fadeIn"
                    >
                        {renderBars()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceRecognitionIcon;
