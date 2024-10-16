# -*- coding:utf-8 -*-
# @FileName  :text_post_process.py
# @Time      :2023/4/13 15:09
# @Author    :lovemefan
# @Email     :lovemefan@outlook.com
from pathlib import Path
from typing import Dict, Iterable, List, Union

import numpy as np
import yaml
from typeguard import check_argument_types


class TokenIDConverterError(Exception):
    pass


class TokenIDConverter:
    def __init__(
        self,
        token_list: Union[List, str],
    ):
        check_argument_types()

        self.token_list = token_list
        self.unk_symbol = token_list[-1]
        self.token2id = {v: i for i, v in enumerate(self.token_list)}
        self.unk_id = self.token2id[self.unk_symbol]

    def get_num_vocabulary_size(self) -> int:
        return len(self.token_list)

    def ids2tokens(self, integers: Union[np.ndarray, Iterable[int]]) -> List[str]:
        if isinstance(integers, np.ndarray) and integers.ndim != 1:
            raise TokenIDConverterError(
                f"Must be 1 dim ndarray, but got {integers.ndim}"
            )
        return [self.token_list[i] for i in integers]

    def tokens2ids(self, tokens: Iterable[str]) -> List[int]:
        return [self.token2id.get(i, self.unk_id) for i in tokens]


def split_to_mini_sentence(words: list, word_limit: int = 20):
    assert word_limit > 1
    if len(words) <= word_limit:
        return [words]
    sentences = []
    length = len(words)
    sentence_len = length // word_limit
    for i in range(sentence_len):
        sentences.append(words[i * word_limit : (i + 1) * word_limit])
    if length % word_limit > 0:
        sentences.append(words[sentence_len * word_limit :])
    return sentences


def code_mix_split_words(text: str):
    words = []
    segs = text.split()
    for seg in segs:
        # There is no space in seg.
        current_word = ""
        for c in seg:
            if len(c.encode()) == 1:
                # This is an ASCII char.
                current_word += c
            else:
                # This is a Chinese char.
                if len(current_word) > 0:
                    words.append(current_word)
                    current_word = ""
                words.append(c)
        if len(current_word) > 0:
            words.append(current_word)
    return words


def read_yaml(yaml_path: Union[str, Path]) -> Dict:
    if not Path(yaml_path).exists():
        raise FileExistsError(f"The {yaml_path} does not exist.")

    with open(str(yaml_path), "rb") as f:
        data = yaml.load(f, Loader=yaml.Loader)
    return data
