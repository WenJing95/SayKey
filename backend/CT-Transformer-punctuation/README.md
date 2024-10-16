

<br/>
<h2 align="center">Ctt punctuator</h2>
<br/>


![python3.7](https://img.shields.io/badge/python-3.7-green.svg)
![python3.8](https://img.shields.io/badge/python-3.8-green.svg)
![python3.9](https://img.shields.io/badge/python-3.9-green.svg)
![python3.10](https://img.shields.io/badge/python-3.10-green.svg)



  A enterprise-grade Chinese-English code switch punctuator [funasr](https://github.com/alibaba-damo-academy/FunASR/).



<br/>
<h2 align="center">Key Features</h2>
<br/>

- **General**
  
  ctt punctuator was trained on chinese-english code switch corpora.
  - [x] offline punctuator
  - [x] online punctuator
  - [x] punctuator for chinese-english code switch
  
  the onnx model file is 279M, you can download it from [here](https://github.com/lovemefan/CT-Transformer-punctuation/raw/main/cttpunctuator/src/onnx/punc.onnx)

- **Highly Portable**

  ctt-punctuator reaps benefits from the rich ecosystems built around **ONNX** running everywhere where these runtimes are available.



## Installation

```bash


git clone https://github.com/lovemefan/CT-Transformer-punctuation.git
cd CT-Transformer-punctuation
# download onnx model from huggingface
wget "https://huggingface.co/lovemefan/ctt_punctuator/resolve/main/cttpunctuator/src/onnx/punc.onnx" -O cttpunctuator/src/onnx/punc.onnx
# you can also download with huggingface mirror
# wget "https://hf-mirror.com/lovemefan/ctt_punctuator/resolve/main/cttpunctuator/src/onnx/punc.onnx" -O cttpunctuator/src/onnx/punc.onnx
pip install -e .
```

## Usage

```python
from cttPunctuator import CttPunctuator
import logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s %(levelname)s] [%(filename)s:%(lineno)d %(module)s.%(funcName)s] %(message)s",
)
# offline mode
punc = CttPunctuator()
text = "据报道纽约时报使用ChatGPT创建了一个情人节消息生成器用户只需输入几个提示就可以得到一封自动生成的情书"
logging.info(punc.punctuate(text)[0])

# online mode
punc = CttPunctuator(online=True)
text_in = "跨境河流是养育沿岸|人民的生命之源长期以来为帮助下游地区防灾减灾中方技术人员|在上游地区极为恶劣的自然条件下克服巨大困难甚至冒着生命危险|向印方提供汛期水文资料处理紧急事件中方重视印方在跨境河流>问题上的关切|愿意进一步完善双方联合工作机制|凡是|中方能做的我们|都会去做而且会做得更好我请印度朋友们放心中国在上游的|任何开发利用都会经过科学|规划和论证兼顾上下游的利益"

vads = text_in.split("|")
rec_result_all = ""
param_dict = {"cache": []}
for vad in vads:
    result = punc.punctuate(vad, param_dict=param_dict)
    rec_result_all += result[0]
    logging.info(f"Part: {rec_result_all}")

logging.info(f"Final: {rec_result_all}")
```
## Result
```bash
[2023-04-19 01:12:39,308 INFO] [ctt-punctuator.py:50 ctt-punctuator.__init__] Initializing punctuator model with offline mode.
[2023-04-19 01:12:55,854 INFO] [ctt-punctuator.py:52 ctt-punctuator.__init__] Offline model initialized.
[2023-04-19 01:12:55,854 INFO] [ctt-punctuator.py:55 ctt-punctuator.__init__] Model initialized.
[2023-04-19 01:12:55,868 INFO] [ctt-punctuator.py:67 ctt-punctuator.<module>] 据报道，纽约时报使用ChatGPT创建了一个情人节消息生成器，用户只需输入几个提示，就可以得到一封自动生成的情书。
[2023-04-19 01:12:55,868 INFO] [ctt-punctuator.py:40 ctt-punctuator.__init__] Initializing punctuator model with online mode.
[2023-04-19 01:13:12,499 INFO] [ctt-punctuator.py:43 ctt-punctuator.__init__] Online model initialized.
[2023-04-19 01:13:12,499 INFO] [ctt-punctuator.py:55 ctt-punctuator.__init__] Model initialized.
[2023-04-19 01:13:12,502 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸
[2023-04-19 01:13:12,508 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员
[2023-04-19 01:13:12,521 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险
[2023-04-19 01:13:12,547 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切
[2023-04-19 01:13:12,553 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制
[2023-04-19 01:13:12,559 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是
[2023-04-19 01:13:12,560 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是中方能做的，我们
[2023-04-19 01:13:12,567 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是中方能做的，我们都会去做，而且会做得更好。我请印度朋友们放心，中国在上游的
[2023-04-19 01:13:12,572 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是中方能做的，我们都会去做，而且会做得更好。我请印度朋友们放心，中国在上游的任何开发利用，都会经过科学
[2023-04-19 01:13:12,578 INFO] [ctt-punctuator.py:77 ctt-punctuator.<module>] Partial: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是中方能做的，我们都会去做，而且会做得更好。我请印度朋友们放心，中国在上游的任何开发利用，都会经过科学规划和论证，兼顾上下游的利益
[2023-04-19 01:13:12,578 INFO] [ctt-punctuator.py:79 ctt-punctuator.<module>] Final: 跨境河流是养育沿岸人民的生命之源。长期以来，为帮助下游地区防灾减灾中方技术人员在上游地区极为恶劣的自然条件下克服巨大困难，甚至冒着生命危险，向印方提供汛期水文资料处理紧急事件。中方重视印方在跨境河流>问题上的关切，愿意进一步完善双方联合工作机制。凡是中方能做的，我们都会去做，而且会做得更好。我请印度朋友们放心，中国在上游的任何开发利用，都会经过科学规划和论证，兼顾上下游的利益
```

## Citation
```
@inproceedings{chen2020controllable,
  title={Controllable Time-Delay Transformer for Real-Time Punctuation Prediction and Disfluency Detection},
  author={Chen, Qian and Chen, Mengzhe and Li, Bo and Wang, Wen},
  booktitle={ICASSP 2020-2020 IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP)},
  pages={8069--8073},
  year={2020},
  organization={IEEE}
}
```
```
@misc{FunASR,
  author = {Speech Lab, Alibaba Group, China},
  title = {FunASR: A Fundamental End-to-End Speech Recognition Toolkit},
  year = {2023},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/alibaba-damo-academy/FunASR/}},
}

```
