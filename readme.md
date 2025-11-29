# SayKey 

[简体中文](./readme_zh.md)|English

SayKey is a tool that turns your speech into text. It works fast, accurately, and without the internet. It uses [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) to do this.

![python3.10](https://img.shields.io/badge/python-3.10-green.svg)
![Windows](https://img.shields.io/badge/Windows-supported-blue.svg)

---

## Key Features

- ⚡ **Super Fast**: Convert speech to text in real-time.
- 🎯 **Accurate**: Enjoy precise transcriptions.
- 🔒 **100% Offline**: Your data stays on your device.
- ⌨️ **Hotkey Activated**: Start dictation with a simple keyboard shortcut.
- ✨ **Smart Punctuation**: Automatically adds punctuation to your text.
- 🛠️ **Customizable**: Easy-to-use settings for a personalized experience.

---

## Quick Start Guide

1. [Download SayKey](https://github.com/WenJing95/SayKey/releases/download/v1.0.1/SayKey.zip)  
   Or visit the [Releases](https://github.com/WenJing95/SayKey/releases) page and download the latest `SayKey.zip`.
2. Extract the `SayKey.zip` file.
3. Run `SayKey.exe`.
4. If Windows Defender shows "Windows protected your PC":
   - Click **More info** → **Run anyway**.
5. Look for the white capsule-shaped icon above your taskbar.
6. Place the text cursor where you want to type.
7. Hold `Ctrl+Q`, speak, and release `Ctrl+Q` to convert speech to text!

For a detailed setup guide, check out the [Installation Wiki](https://github.com/WenJing95/SayKey/wiki/SayKey-Installation-Guide).

---

## System Requirements

- **OS**: Windows 10 or later
- **Memory**: At least 4 GB RAM (8 GB recommended)
- **Disk**: 1.5 GB free disk space
- **CPU**: x86-64 CPU with AVX support recommended

See the [Installation Guide](https://github.com/WenJing95/SayKey/wiki/SayKey-Installation-Guide) for the most up-to-date information.

---

## Usage

### Start voice typing

1. Make sure `SayKey.exe` is running and you see the capsule icon above the taskbar.
2. Focus any text input (Notepad, Word, browser, chat app, etc.).
3. Press and hold `Ctrl+Q` to start recording.
4. Speak clearly into your microphone.
5. Release `Ctrl+Q`. SayKey will recognize your speech and type the text at the cursor position.

### Select microphone

1. Right-click the capsule icon.
2. Click **Microphone**.
3. Choose the device you want to use.

### Change the hotkey

- Use the settings in the desktop app, or  
- Call the HTTP API [`POST /set_hotkey`](#post-set_hotkey) if you are integrating SayKey programmatically.

---

## For Developers

SayKey is open-source and we welcome contributions.

### Clone the repository

```bash
git clone https://github.com/WenJing95/SayKey.git
cd SayKey
```

### Dependencies

- Python **3.10**
- Node.js (latest LTS)
- Git

### Backend setup

```bash
cd backend
cd CT-Transformer-punctuation
pip install -e .
pip install -r requirements.txt
```

Start the backend server:

```bash
python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
```

You should see output similar to:

```text
SayKey is running. Hold ctrl+q to start recording, release to recognize.
Important: Ensure the cursor is in the desired input location before using voice typing.
INFO:     Uvicorn running on http://localhost:58652 (Press CTRL+C to quit)
```

### Command-line arguments (backend)

Required:

- `--tokens`: Path to the `tokens.txt` file for the speech model.
- `--sense-voice`: Path to the SenseVoice `model.onnx`.

Optional:

- `--num-threads`: Number of threads (default: `4`).
- `--microphone-index`: Index of the microphone to use. If not specified, the system default microphone is used.
- `--hotkey`: Hotkey combination to start recording (default: `ctrl+q`).
- `--api-port`: Port number for the API server (default: `58652`).
- `--punc-model-dir`: Directory path for punctuation model files (default: `./punc-onnx`).
- `--host`: Host address for the API server (default: `localhost`).

---

## HTTP API

The backend exposes a small HTTP API on `--api-port` (default `58652`).

Base URL: `http://localhost:58652`

### `GET /ping`

Health check to verify the backend is alive.

```bash
curl http://localhost:58652/ping
```

Response:

```json
{"status": "alive"}
```

### `GET /list_audio_devices`

List available audio input devices.

```bash
curl http://localhost:58652/list_audio_devices
```

Example response:

```json
{
  "devices": [
    {
      "index": 0,
      "name": "Microphone (Realtek High Definition Audio)",
      "is_current": true
    },
    {
      "index": 1,
      "name": "Stereo Mix (Realtek High Definition Audio)",
      "is_current": false
    }
  ]
}
```

### `POST /set_audio_device`

Set the current microphone by index.

```bash
curl -X POST http://localhost:58652/set_audio_device \
  -H "Content-Type: application/json" \
  -d '{"index": 1}'
```

### `POST /set_hotkey`

Configure the hotkey used to start and stop recording.

```bash
curl -X POST http://localhost:58652/set_hotkey \
  -H "Content-Type: application/json" \
  -d '{"hotkey": "ctrl+q"}'
```

### `GET /get_hotkey`

Retrieve the current hotkey configuration.

```bash
curl http://localhost:58652/get_hotkey
```

Example response:

```json
{"hotkey": "ctrl+q"}
```

---

## Building & Packaging

### Package backend (Windows)

```bash
cd backend
./build_onefile.bat
```

### Frontend dev & build

```bash
cd frontend
npm install

# Run in development
npm run build
npm start

# Package for distribution
npm run build
npm run electron:build
```

### Create a full release folder

1. Copy everything from `backend\dist`.
2. Copy everything from `frontend\release\win-unpacked`.
3. Place them in the same directory.
4. Run `SayKey.exe`.

---

## FAQ

**Nothing happens when I hold `Ctrl+Q`.**

- Check that SayKey is running (capsule icon is visible).
- Make sure your cursor is in a text field.
- Try switching to another microphone in the tray menu.

**Windows says "protected your PC" and blocks the app.**

- Click **More info** → **Run anyway** if you trust the binary from this repository.

---

## Contributing

We welcome issues and pull requests.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Commit your changes and push the branch.
4. Open a Pull Request.

---

## License

SayKey is MIT licensed. See [`LICENSE.txt`](./LICENSE.txt) for details.

---

## Acknowledgements

- [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) for the speech-to-text engine.
- [CT-Transformer-punctuation](https://github.com/lovemefan/CT-Transformer-punctuation) by [lovemefan](https://github.com/lovemefan/) for punctuation capabilities.
