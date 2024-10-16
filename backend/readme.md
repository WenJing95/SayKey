### Init

```bash
   cd ./backend
   cd CT-Transformer-punctuation
   pip install -e .
   pip install -r requirements.txt
   # Start it
   python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
   ```

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

