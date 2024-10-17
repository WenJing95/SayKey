#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Author: WenJing Wu

import argparse
import asyncio
import os
import wave
from datetime import datetime
from typing import Optional, List, Dict, Any
import pyautogui
import pyperclip

import keyboard
import numpy as np
import sounddevice as sd
from loguru import logger
import sherpa_onnx
from cttPunctuator import CttPunctuator

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

# Constants
SAMPLE_RATE = 16000  # Fixed sample rate


def type_text(text: str) -> None:
    """Type the given text"""
    logger.info(f"recognized text: {text}")
    # if is_text_input_focused():
    pyperclip.copy(text)
    pyautogui.hotkey('ctrl', 'v', interval=0.05)
    # else:
    #     logger.warning("No active text input field detected.")
    #     logger.warning("Please ensure the cursor is in the desired input location.")


async def save_audio_async(samples: np.ndarray, sample_rate: int, file_path: str) -> None:
    """Asynchronously save audio samples to a WAV file."""
    await asyncio.to_thread(save_audio, samples, sample_rate, file_path)


def save_audio(samples: np.ndarray, sample_rate: int, file_path: str) -> None:
    """Save audio samples to a WAV file."""
    try:
        with wave.open(file_path, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit audio
            wf.setframerate(sample_rate)
            wf.writeframes((samples * 32767).astype(np.int16).tobytes())
    except Exception as e:
        logger.error(f"Error saving audio file: {e}")


async def process_audio_async(
        recognizer: sherpa_onnx.OfflineRecognizer,
        audio: np.ndarray,
        sample_rate: int,
        punctuator: CttPunctuator,
) -> None:
    """Asynchronously process audio and perform speech recognition."""
    text = await asyncio.to_thread(process_audio, recognizer, audio, sample_rate)
    if text:
        text = await asyncio.to_thread(add_punctuation, punctuator, text)
        await asyncio.to_thread(type_text, text)
    else:
        logger.warning("No speech recognized.")


def process_audio(
        recognizer: sherpa_onnx.OfflineRecognizer, audio: np.ndarray, sample_rate: int
) -> Optional[str]:
    """Process audio and perform speech recognition."""
    asr_stream = recognizer.create_stream()
    asr_stream.accept_waveform(sample_rate, audio)
    recognizer.decode_stream(asr_stream)
    return asr_stream.result.text.strip()


def add_punctuation(punctuator: CttPunctuator, text: str) -> str:
    """Add punctuation to the given text."""
    return punctuator.punctuate(text)[0]


def ensure_data_directory() -> None:
    """Ensure the data directory exists."""
    data_dir = "./data"
    os.makedirs(data_dir, exist_ok=True)
    print(f"Data directory ensured at: {data_dir}")


def is_device_usable(device_index):
    try:
        sd.check_input_settings(device=device_index)
        return True
    except Exception:
        return False


def create_recognizer(args: argparse.Namespace) -> sherpa_onnx.OfflineRecognizer:
    """Create the speech recognizer."""
    return sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=args.sense_voice,
        tokens=args.tokens,
        num_threads=args.num_threads,
        use_itn=False,
        debug=False,
    )


def get_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--tokens", type=str, required=True, help="Path to tokens.txt")
    parser.add_argument(
        "--sense-voice", type=str, required=True, help="Path to the model.onnx from SenseVoice"
    )
    parser.add_argument(
        "--num-threads",
        type=int,
        default=4,
        help="Number of threads for neural network computation",
    )
    parser.add_argument(
        "--microphone-index", type=int, help="Index of the microphone to use (optional)"
    )
    parser.add_argument(
        "--hotkey",
        type=str,
        default="ctrl+q",
        help="""\
Hotkey combination to start recording. Examples:
- For Ctrl+Q: use 'ctrl+q'
- For Alt+S: use 'alt+s'
- For Ctrl+CapsLock: use 'ctrl+caps lock'
""",
    )
    parser.add_argument(
        "--api-port",
        type=int,
        default=58652,
        help="Port number for the API server",
    )
    parser.add_argument(
        "--punc-model-dir",
        type=str,
        default="./punc-onnx",
        help="dir of the punctuation model files (default: current directory ./punc-onnx)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Host to bind the API server (default: localhost)",
    )
    return parser.parse_args()


class Configurations:
    """Class to hold configuration settings."""

    def __init__(self, hotkey: str, microphone_index: Optional[int]):
        self.hotkey = hotkey
        self.microphone_index = microphone_index


class DeviceIndex(BaseModel):
    index: int


class Hotkey(BaseModel):
    hotkey: str


app = FastAPI()
configurations = Configurations(hotkey="ctrl+q", microphone_index=None)


@app.get("/ping")
async def ping():
    """Keep-alive endpoint."""
    return {"status": "alive"}


@app.get("/list_audio_devices")
async def list_audio_devices_api() -> Dict[str, List[Dict[str, Any]]]:
    """List available audio devices."""
    devices = sd.query_devices()
    hostapis = sd.query_hostapis()
    current_device = sd.default.device[0]
    device_list = []
    for i, d in enumerate(devices):
        # Get the host API name for the device
        hostapi_name = hostapis[d['hostapi']]['name']
        # Only consider devices using Windows WASAPI
        if hostapi_name == 'Windows WASAPI' and d['max_input_channels'] > 0 and is_device_usable(i):
            device_list.append({
                "index": i,
                "name": d["name"],
                "is_current": i == current_device
            })
    return {"devices": device_list}


@app.post("/set_audio_device")
async def set_audio_device(device: DeviceIndex):
    """Set microphone device."""
    try:
        # Optionally, ensure the device uses Windows WASAPI
        devices = sd.query_devices()
        hostapis = sd.query_hostapis()
        d = devices[device.index]
        hostapi_name = hostapis[d['hostapi']]['name']
        if hostapi_name != 'Windows WASAPI':
            raise ValueError("Selected device is not using Windows WASAPI.")
        # Set the default input device
        sd.default.device[0] = device.index
        device_name = d['name']
        configurations.microphone_index = device.index
        logger.info(f"Microphone set to: {device_name}")
        return {
            "status": "success",
            "message": "success",
            "device": {
                "index": device.index,
                "name": device_name
            }
        }
    except Exception as e:
        logger.error(f"Error setting microphone: {e}")
        return {
            "status": "error",
            "message": str(e),
            "device": {
                "index": configurations.microphone_index,
                "name": sd.query_devices()[configurations.microphone_index]['name']
                if configurations.microphone_index is not None else "Not set"
            }
        }


@app.post("/set_hotkey")
async def set_hotkey_api(hotkey: Hotkey):
    """Set hotkey."""
    try:
        # Validate hotkey
        if not hotkey.hotkey or not keyboard.parse_hotkey(hotkey.hotkey):
            raise ValueError("Invalid hotkey combination")

        old_hotkey = configurations.hotkey
        configurations.hotkey = hotkey.hotkey
        logger.info(f"Hotkey set to: {configurations.hotkey}")
        return {
            "status": "success",
            "message": "success",
            "hotkey": configurations.hotkey
        }
    except Exception as e:
        logger.error(f"Error setting hotkey: {e}")
        return {
            "status": "error",
            "message": str(e),
            "hotkey": configurations.hotkey  # Return current hotkey
        }


@app.get("/get_hotkey")
async def get_hotkey_api():
    """Get the current hotkey."""
    return {"hotkey": configurations.hotkey}


async def main() -> None:
    """Main function to run the SayKey program."""
    args = get_args()

    # 初始化配置
    configurations.hotkey = args.hotkey
    configurations.microphone_index = args.microphone_index

    ensure_data_directory()
    # list_audio_devices()
    # set_microphone(configurations.microphone_index)

    punctuator = CttPunctuator(model_dir=args.punc_model_dir)

    print(
        f"\033[32mSayKey is running. Hold {configurations.hotkey} to start recording, release to recognize.\033[0m"
    )
    print("Important: Ensure the cursor is in the desired input location before using voice typing.")

    recognizer = create_recognizer(args)

    # This queue will hold the audio data to be processed
    audio_queue = asyncio.Queue()

    async def audio_processing_worker():
        while True:
            item = await audio_queue.get()
            if item is None:
                break  # Exit signal
            audio_data, timestamp = item
            logger.info(f"Processing audio recorded at {timestamp}")

            # Save audio asynchronously
            original_audio_file = f"./data/{timestamp}.wav"
            await save_audio_async(audio_data, SAMPLE_RATE, original_audio_file)

            # Process audio
            await process_audio_async(recognizer, audio_data, SAMPLE_RATE, punctuator)

            audio_queue.task_done()

    # Start the audio processing worker task
    processing_task = asyncio.create_task(audio_processing_worker())

    recording_event = asyncio.Event()
    audio_buffer = []

    def callback(indata, frames, time_info, status):
        """Callback function for audio input stream."""
        if recording_event.is_set():
            audio_buffer.extend(indata.copy())

    async def monitor_hotkey():
        """Monitor the hotkey and manage recording."""
        nonlocal audio_buffer
        while True:
            await asyncio.sleep(0.01)
            if keyboard.is_pressed(configurations.hotkey):
                if not recording_event.is_set():
                    logger.info("Recording started.")
                    recording_event.set()
                    audio_buffer = []
            else:
                if recording_event.is_set():
                    logger.info("Recording ended, adding to processing queue.")
                    recording_event.clear()
                    buffer = np.concatenate(audio_buffer)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    await audio_queue.put((buffer, timestamp))

    async def run_input_stream():
        """Run the audio input stream."""
        try:
            with sd.InputStream(
                    channels=1,
                    dtype="float32",
                    samplerate=SAMPLE_RATE,
                    callback=callback,
                    device=configurations.microphone_index,
            ):
                while True:
                    await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Error in input stream: {e}")
            raise e

    async def start_server():
        """Start the FastAPI server."""
        config = uvicorn.Config(app, host=args.host, port=args.api_port, log_level="info", loop="asyncio")
        server = uvicorn.Server(config)
        await server.serve()

    tasks = [
        asyncio.create_task(monitor_hotkey()),
        asyncio.create_task(run_input_stream()),
        asyncio.create_task(start_server()),
    ]

    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("Program interrupted by user.")
    except Exception as e:
        logger.error(f"Error running the program: {e}")
    finally:
        await audio_queue.put(None)
        await processing_task
        await audio_queue.join()


if __name__ == "__main__":
    asyncio.run(main())
