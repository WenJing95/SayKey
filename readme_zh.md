# SayKey

(简体中文|[English](./readme.md))

SayKey
是一个语音输入法，为你提供快速、准确、完全离线的语音转文字体验。由 [SenceVoice](https://github.com/FunAudioLLM/SenseVoice)
驱动。

![python3.10](https://img.shields.io/badge/python-3.10-green.svg)
![Windows](https://img.shields.io/badge/Windows-supported-blue.svg)

## 主要特性

- 🚀 语音识别快速准确
- 🔒 完全离线运行，保护隐私
- ⌨️ 便捷的热键激活
- 🎯 智能添加标点
- 🔧 可以灵活配置

## 开发环境

- Python 3.10
- `requirements.txt` 中列出的依赖项（或如下所述）

## 如何下载和使用 SayKey

1. [点我下载](https://github.com/WenJing95/SayKey/releases/download/v1.0.0/SayKey.zip)
2. 在您的电脑上找到下载的"SayKey.zip"文件（通常在"下载"文件夹中）。
3. 右键点击"SayKey.zip"，选择"全部解压缩"或"解压到\SayKey"。
4. 打开解压后出现的文件夹。
5. 双击"SayKey.exe"来启动程序。
6. 您会在任务栏上方看到一个”白色小胶囊“，这就是SayKey的主界面。
7. 当您想要使用语音输入时，同时按住 `Ctrl` 键和 `Q` 键。
8. 按住 `Ctrl+Q` 的同时，说出您想要输入的内容。小胶囊会改变形状，表示正在听您说话。
9. 说完后，松开 `Ctrl+Q` 键。您的语音将会被转换为文字，输出到光标所在位置。

### 附加信息

- 右键点击小胶囊可以看到菜单。在菜单中，您可以：
    - 查看SayKey的启动状态（在家用PC上，大概需要5秒钟来加载语音识别模型）
    - 选择麦克风
    - 更改触发语音识别的快捷键
    - 选择您常用的语言
    - 将SayKey最小化（最小化后，您可以在Windows系统任务栏中看到SayKey的小图标）
- 如果您遇到了"连击"（一句话被识别了多次）的现象，您可以退出程序并重新启动。程序将会自动修复这个问题。

## 开发

1. **克隆仓库**

   ```bash
   git clone https://github.com/WenJing95/SayKey.git
   cd SayKey
   ```

2. **安装服务器端环境(需要python3.10)**

   ```bash
   cd ./backend
   cd CT-Transformer-punctuation
   pip install -e .
   pip install requirements.txt
   # 启动
    python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
   ```

2. **安装客户端环境(需要nodejs)**

   ```bash
   # 安装
    cd ./frontend
    npm install
   # 启动
    npm run build
    npm start
   ```

## 使用方法

### 命令行参数

使用以下命令行参数运行后端服务器：

```bash
python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
```

必需参数：

- `--tokens`：语音识别模型所需的 tokens.txt 文件路径。
- `--sense-voice`：SenseVoice 的 model.onnx 文件路径。

可选参数：

- `--num-threads`：线程数（默认：4）。
- `--microphone-index`：要使用的麦克风索引。如果未指定，则使用默认系统麦克风。
- `--hotkey`：开始录音的热键组合（默认：ctrl+q）。
- `--api-port`：API 服务器的端口号（默认：58652）。
- `--punc-model-dir`：标点模型文件的目录路径（默认：./punc-onnx）。
- `--host`：API 服务器绑定的主机地址（默认：localhost）。

### 运行服务器

启动服务器后，你将看这样的输出：

```
SayKey is running. Hold ctrl+q to start recording, release to recognize.
Important: Ensure the cursor is in the desired input location before using voice typing.
INFO:     Uvicorn running on http://localhost:58652 (Press CTRL+C to quit)
```

根据提示，你可以按住 `ctrl+q` 开始录音，松开 `ctrl+q` 进行识别

## API 端点

提供了几个用于交互和配置的 API 。所有端点都可以通过 HTTP 请求访问，服务器运行在指定的 `--api-port`（默认为 58652）上。

### 1. 保活端点

- URL: `GET /ping`
- 描述：检查后端服务器是否正在运行。
- 响应：

  ```json
  {
    "status": "alive"
  }
  ```

- 示例：

  ```bash
  curl http://localhost:58652/ping
  ```

### 2. 列出音频设备

- URL: `GET /list_audio_devices`
- 描述：检索可用音频输入设备的列表。
- 响应示例：

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

- 示例：

  ```bash
  curl http://localhost:58652/list_audio_devices
  ```

### 3. 设置音频设备

- URL: `POST /set_audio_device`
- 描述：通过指定索引设置麦克风设备。
- 请求体：

  ```json
  {
    "index": 1
  }
  ```

- 成功响应示例：

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

- 失败响应示例：

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

- 示例：

  ```bash
  curl -X POST http://localhost:58652/set_audio_device \
       -H "Content-Type: application/json" \
       -d '{"index": 1}'
  ```

### 4. 设置热键

- URL: `POST /set_hotkey`
- 描述：配置用于开始和停止音频录制的热键组合。
- 请求体：

  ```json
  {
    "hotkey": "ctrl+q"
  }
  ```

- 成功响应示例：

  ```json
  {
    "status": "success",
    "message": "success",
    "hotkey": "ctrl+q"
  }
  ```

- 失败响应示例：

  ```json
  {
    "status": "error",
    "message": "Invalid hotkey combination",
    "hotkey": "ctrl+shift+a"
  }
  ```

- 示例：

  ```bash
  curl -X POST http://localhost:58652/set_hotkey \
       -H "Content-Type: application/json" \
       -d '{"hotkey": "ctrl+q"}'
  ```

### 5. 获取热键

- URL: `GET /get_hotkey`
- 描述：检索当前配置的热键组合。
- 响应示例：

  ```json
  {
    "hotkey": "ctrl+q"
  }
  ```

- 示例：

  ```bash
  curl http://localhost:58652/get_hotkey
  ```

## 注意事项

- **权限**：keyboard 库可能需要管理员权限才能正常运行。如果遇到热键检测或文本输入模拟问题，请以适当的权限运行后端服务器。
- **系统兼容性**：支持Windows，其他系统未测试。
- **热键冲突**：选择热键时要谨慎。按键可能会干扰系统快捷键或其他程序。
- **其他问题**：由于调用了系统的keyboard接口进行输入，程序可能会被一些软件识别为外挂。

## 感谢以下项目

1. 本项目的语音识别能力来自 [SenseVoice](https://github.com/FunAudioLLM/SenseVoice)
2. 本项目使用了 [lovemefan](https://github.com/lovemefan/)
   开发的 [CT-Transformer-punctuation](https://github.com/lovemefan/CT-Transformer-punctuation) 项目代码
