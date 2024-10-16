# -*- coding:utf-8 -*-
# @FileName  :setup.py
# @Time      :2023/4/4 11:22
# @Author    :lovemefan
# @Email     :lovemefan@outlook.com
import os
from pathlib import Path

from setuptools import find_namespace_packages, setup

dirname = Path(os.path.dirname(__file__))
version_file = dirname / "version.txt"
with open(version_file, "r") as f:
    version = f.read().strip()

requirements = {
    "install": [
        "setuptools<=65.0",
        "PyYAML",
        "typeguard==2.13.3",
        "onnxruntime>=1.14.1",
    ],
    "setup": [
        "numpy==1.24.2",
    ],
    "all": [],
}
requirements["all"].extend(requirements["install"])

install_requires = requirements["install"]
setup_requires = requirements["setup"]


setup(
    name="cttpunctuator",
    version=version,
    url="https://github.com/lovemefan/CT-Transformer-punctuation",
    author="Lovemefan, Yunnan Key Laboratory of Artificial Intelligence, "
    "Kunming University of Science and Technology, Kunming, Yunnan ",
    author_email="lovemefan@outlook.com",
    description="ctt-punctuator: A enterprise-grade punctuator after chinese asr based "
    "on ct-transformer from funasr opensource",
    long_description=open(os.path.join(dirname, "README.md"), encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    license="The MIT License",
    packages=find_namespace_packages(),
    include_package_data=True,
    install_requires=install_requires,
    python_requires=">=3.7.0",
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Science/Research",
        "Operating System :: POSIX :: Linux",
        "License :: OSI Approved :: Apache Software License",
        "Topic :: Multimedia :: Sound/Audio :: Speech",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
)
