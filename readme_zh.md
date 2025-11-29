# SayKey 

简体中文|[English](./readme.md)

SayKey 是一个语音输入法，为你提供快速、准确、完全离线的语音转文字体验。由 [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) 驱动。

![python3.10](https://img.shields.io/badge/python-3.10-green.svg)
![Windows](https://img.shields.io/badge/Windows-supported-blue.svg)

---

## 主要特性

- ⚡ **快速识别**：实时将语音转换为文字
- 🎯 **高度准确**：享受精确的转录体验
- 🔒 **完全离线**：你的数据始终保存在本地设备
- ⌨️ **热键激活**：通过简单快捷键即可开始听写
- ✨ **智能标点**：自动为文本添加标点符号
- 🛠️ **灵活配置**：易于使用的设置，满足个性化需求

---

## 快速开始指南

1. [下载 SayKey](https://github.com/WenJing95/SayKey/releases/download/v1.0.1/SayKey.zip)  
   或前往 [Releases 页面](https://github.com/WenJing95/SayKey/releases) 下载最新的 `SayKey.zip`。
2. 解压 `SayKey.zip` 文件。
3. 双击运行 `SayKey.exe`。
4. 如果 Windows Defender 提示“已保护你的电脑”：
   - 点击 **更多信息** → **仍要运行**。
5. 在任务栏上方找到白色胶囊形状的图标，确认程序已启动。
6. 将光标移动到你想输入文字的位置。
7. 按住 `Ctrl+Q` 开始说话，松开 `Ctrl+Q` 即可完成识别并输出文字。

更详细的安装说明请参考 [手把手安装指南](https://github.com/WenJing95/SayKey/wiki/SayKey-%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)。

---

## 系统要求

- **操作系统**：Windows 10 或更高版本
- **内存**：至少 4 GB（推荐 8 GB 及以上）
- **磁盘空间**：1.5 GB 可用空间
- **CPU**：推荐支持 AVX 指令集的 x86-64 处理器

完整信息以 [安装指南](https://github.com/WenJing95/SayKey/wiki/SayKey-%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97) 为准。

---

## 使用说明

### 开始语音输入

1. 确认 `SayKey.exe` 正在运行（任务栏上方能看到胶囊图标）。
2. 打开任何可以输入文字的应用（记事本、Word、浏览器输入框、聊天软件等）。
3. 将输入光标放在目标位置。
4. 按住 `Ctrl+Q` 开始录音，对着麦克风说话。
5. 松开 `Ctrl+Q`，SayKey 会进行识别并将文字插入光标处。

### 选择麦克风设备

1. 在任务栏上方找到白色胶囊图标。
2. 右键点击图标。
3. 选择「麦克风」菜单。
4. 在列表中选择你希望使用的音频输入设备。

### 修改快捷键

- 可以通过桌面应用中的设置界面修改，或者  
- 通过 HTTP API [`POST /set_hotkey`](#post-set_hotkey) 在脚本或工具中进行配置。

---

## 开发者指南

SayKey 是一个开源项目，欢迎二次开发和贡献代码。

### 克隆仓库

```bash
git clone https://github.com/WenJing95/SayKey.git
cd SayKey
```

### 开发依赖

- Python **3.10**
- Node.js（最新 LTS 版本）
- Git

### 配置后端开发环境

```bash
cd backend
cd CT-Transformer-punctuation
pip install -e .
pip install -r requirements.txt
```

启动后端服务器：

```bash
python main.py --sense-voice=./sherpa-onnx/model.int8.onnx --tokens=./sherpa-onnx/tokens.txt
```

启动成功后，你会看到类似输出：

```text
SayKey is running. Hold ctrl+q to start recording, release to recognize.
Important: Ensure the cursor is in the desired input location before using voice typing.
INFO:     Uvicorn running on http://localhost:58652 (Press CTRL+C to quit)
```

### 命令行参数（后端）

必需参数：

- `--tokens`：语音识别模型所需的 `tokens.txt` 文件路径。
- `--sense-voice`：SenseVoice 的 `model.onnx` 文件路径。

可选参数：

- `--num-threads`：推理线程数（默认：`4`）。
- `--microphone-index`：使用的麦克风索引（未指定则使用系统默认设备）。
- `--hotkey`：开始录音的快捷键组合（默认：`ctrl+q`）。
- `--api-port`：API 服务端口（默认：`58652`）。
- `--punc-model-dir`：标点模型文件目录（默认：`./punc-onnx`）。
- `--host`：API 服务监听地址（默认：`localhost`）。

---

## HTTP API

后端在 `--api-port`（默认 `58652`）端口提供一组 HTTP 接口，方便其他前端或 Agent 集成。

基础地址：`http://localhost:58652`

### `GET /ping`

健康检查，确认后端服务是否存活。

```bash
curl http://localhost:58652/ping
```

响应示例：

```json
{"status": "alive"}
```

### `GET /list_audio_devices`

列出可用音频输入设备。

```bash
curl http://localhost:58652/list_audio_devices
```

响应示例：

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

根据索引设置当前麦克风设备。

```bash
curl -X POST http://localhost:58652/set_audio_device \
  -H "Content-Type: application/json" \
  -d '{"index": 1}'
```

### `POST /set_hotkey`

配置用于开始/停止录音的快捷键组合。

```bash
curl -X POST http://localhost:58652/set_hotkey \
  -H "Content-Type: application/json" \
  -d '{"hotkey": "ctrl+q"}'
```

### `GET /get_hotkey`

获取当前配置的快捷键。

```bash
curl http://localhost:58652/get_hotkey
```

响应示例：

```json
{"hotkey": "ctrl+q"}
```

---

## 构建与发布

### 打包后端（Windows 环境）

```bash
cd backend
./build_onefile.bat
```

### 配置前端开发环境

```bash
cd frontend
npm install

# 开发模式
npm run build
npm start

# 打包发布
npm run build
npm run electron:build
```

### 组合为最终发布目录

1. 将 `backend\dist` 目录中的所有文件拷贝到目标目录。
2. 将 `frontend\release\win-unpacked` 目录中的所有文件拷贝到同一目录。
3. 在该目录下运行 `SayKey.exe` 即可启动应用。

---

## 常见问题（FAQ）

**按住 `Ctrl+Q` 没有任何反应？**

- 确认程序已启动（任务栏上有胶囊图标）。
- 光标是否在一个可输入文字的文本框中。
- 尝试在托盘菜单中切换到其他麦克风设备。

**Windows 提示“已保护你的电脑”？**

- 如果你是从本仓库的 Releases 页面下载的原始压缩包，可以点击 **更多信息** → **仍要运行**。

---

## 贡献

欢迎任何形式的贡献，包括：

- 提交 Issue 报告 Bug 或提出新需求
- 提交 Pull Request 修复问题或增加功能
- 改进文档或编写教程分享使用经验

推荐开发流程：

1. Fork 本仓库；
2. 创建功能分支：

   ```bash
   git checkout -b feature/your-feature
   ```

3. 提交修改并推送分支；
4. 在 GitHub 上发起 Pull Request。

---

## 许可证

SayKey 使用 [MIT 许可证](./LICENSE.txt) 发布，你可以在遵守协议的前提下自由使用、修改和分发本项目。

---

## 致谢

- 感谢 [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) 提供的语音转文字引擎；
- 感谢 [lovemefan](https://github.com/lovemefan/) 开发的 [CT-Transformer-punctuation](https://github.com/lovemefan/CT-Transformer-punctuation) 项目，为本项目提供智能标点能力。
