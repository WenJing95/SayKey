# SayKey

([简体中文](./readme_zh.md)|English)

SayKey is a tool that turns your speech into text. It works fast, accurately, and without the internet. It
uses [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) to do this.

![python3.10](https://img.shields.io/badge/python-3.10-green.svg)
![Windows](https://img.shields.io/badge/Windows-supported-blue.svg)

## Main Features

- 🚀 Quick and correct speech to text
- 🔒 Works without internet, keeps your information private
- ⌨️ Easy to start with a keyboard shortcut
- 🎯 Adds punctuation smartly
- 🔧 Easy to change settings

### How to Download and Use SayKey

1. [Click Me To Download](https://github.com/WenJing95/SayKey/releases/download/v1.0.0/SayKey.zip)
2. Find the downloaded "SayKey.zip" file on your computer (usually in the "Downloads" folder).
3. Right-click on "SayKey.zip" and choose "Extract All" or "Unzip".
4. Open the folder that appears after unzipping.
5. Double-click on "SayKey.exe" to start the program.
6. You'll see a small capsule shape appear above your taskbar. This is SayKey's main interface.
7. When you want to use voice input, hold down the `Ctrl` key and the `Q` key together.
8. While holding `Ctrl+Q`, speak what you want to type. The capsule will change to show it's listening.
9. When you finish speaking, let go of the `Ctrl+Q` keys. Your voice will be converted into text and output to the
   cursor location.

### Additional Information

- Right-click the capsule to see a menu. Here you can:
    - Check SayKey's status (it takes about 5 seconds to load on a normal PC)
    - Choose your microphone
    - Change the shortcut key for voice input
    - Select your preferred language
    - Minimize SayKey (you'll see a small icon in the Windows system tray)
- If you experience "double recognition" (one phrase recognized multiple times), exit and restart SayKey. It will fix
  itself automatically.

## For Developers

- Python 3.10
- Other needed software listed in `requirements.txt` (or as shown below)

## How to Set Up for Development

1. **Get the code**

   ```bash
   git clone https://github.com/WenJing95/SayKey.git
   cd SayKey
   ```

2. **Set up the server part (needs Python 3.10)**

   ```bash
   cd ./backend
   cd CT-Transformer-punctuation
   pip install -e .
   pip install -r requirements.txt
   # Start it
   python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
   ```

3. **Set up the user part (needs Node.js)**

   ```bash
   # Install
   cd ./frontend
   npm install
   # Start
   npm run build
   npm start
   ```

## How to Use

### Command Line Options

Start the server part with these options:

```bash
python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
```

You must include:

- `--tokens`: Where the tokens.txt file is
- `--sense-voice`: Where the model.onnx file for SenseVoice is

You can also add:

- `--num-threads`: How many threads to use (usually 4)
- `--microphone-index`: Which microphone to use
- `--hotkey`: Which key to press to start (usually ctrl+q)
- `--api-port`: Which port number to use (usually 58652)
- `--punc-model-dir`: Where the punctuation files are (usually ./punc-onnx)
- `--host`: Which address to use (usually localhost)

### Starting the Server

When you start the server, you'll see:

```
SayKey is running. Hold ctrl+q to start recording, release to recognize.
Important: Make sure your cursor is where you want to type before using voice typing.
INFO:     Uvicorn running on http://localhost:58652 (Press CTRL+C to quit)
```

To use it, hold `ctrl+q`, speak, then let go of `ctrl+q`.

## API Endpoints

SayKey has several ways to interact with it and change settings. You can use these through HTTP requests. The server
usually runs on port 58652.

### 1. Check if It's Working

- URL: `GET /ping`
- What it does: Checks if the server is running
- What it sends back:

  ```json
  {
    "status": "alive"
  }
  ```

- Example:

  ```bash
  curl http://localhost:58652/ping
  ```

### 2. See Available Microphones

- URL: `GET /list_audio_devices`
- What it does: Shows you which microphones you can use
- Example of what it sends back:

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

- Example:

  ```bash
  curl http://localhost:58652/list_audio_devices
  ```

### 3. Choose a Microphone

- URL: `POST /set_audio_device`
- What it does: Lets you pick which microphone to use
- What to send:

  ```json
  {
    "index": 1
  }
  ```

- Example of what it sends back if it works:

  ```json
  {
    "status": "success",
    "message": "success",
    "device": {
      "index": 1,
      "name": "Microphone (Realtek High Definition Audio)"
    }
  }
  ```

- Example of what it sends back if it doesn't work:

  ```json
  {
    "status": "error",
    "message": "Invalid device index",
    "device": {
      "index": 0,
      "name": "Default System Device"
    }
  }
  ```

- Example:

  ```bash
  curl -X POST http://localhost:58652/set_audio_device \
       -H "Content-Type: application/json" \
       -d '{"index": 1}'
  ```

### 4. Set the Key to Start Recording

- URL: `POST /set_hotkey`
- What it does: Lets you choose which key to press to start and stop recording
- What to send:

  ```json
  {
    "hotkey": "ctrl+q"
  }
  ```

- Example of what it sends back if it works:

  ```json
  {
    "status": "success",
    "message": "success",
    "hotkey": "ctrl+q"
  }
  ```

- Example of what it sends back if it doesn't work:

  ```json
  {
    "status": "error",
    "message": "Invalid hotkey combination",
    "hotkey": "ctrl+shift+a"
  }
  ```

- Example:

  ```bash
  curl -X POST http://localhost:58652/set_hotkey \
       -H "Content-Type: application/json" \
       -d '{"hotkey": "ctrl+q"}'
  ```

### 5. See Which Key Starts Recording

- URL: `GET /get_hotkey`
- What it does: Shows you which key is set to start recording
- Example of what it sends back:

  ```json
  {
    "hotkey": "ctrl+q"
  }
  ```

- Example:

  ```bash
  curl http://localhost:58652/get_hotkey
  ```

## Important Things to Know

- **Permissions**: You might need to run as an admin for the keyboard part to work right.
- **What It Works On**: It works on Windows, but we haven't tried it on other systems.
- **Key Problems**: Be careful when picking which key to use. It might not work with other shortcuts.
- **Other Issues**: Some programs might think SayKey is cheating because of how it types.

## Thank You

1. The speech-to-text part comes from [SenseVoice](https://github.com/FunAudioLLM/SenseVoice)
2. We use code from [CT-Transformer-punctuation](https://github.com/lovemefan/CT-Transformer-punctuation) made
   by [lovemefan](https://github.com/lovemefan/)
