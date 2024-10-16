@echo off
REM Optimized Build Script for SayKey using PyInstaller on Windows 11

REM Set the path to your virtual environment
set VENV_PATH=.\venv

REM Activate the virtual environment
call %VENV_PATH%\Scripts\activate.bat

REM Check if activation was successful
if %errorlevel% neq 0 (
    echo Failed to activate the virtual environment. Please check the path and try again.
    exit /b 1
)

REM Ensure Python and pip are available
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not available in the activated environment. Please check your virtual environment setup.
    exit /b 1
)

REM Install special dependencies
echo Installing special dependencies...
cd CT-Transformer-punctuation
pip install -e .
cd ..
pip install -r requirements.txt

REM Install PyInstaller
pip install pyinstaller

REM Ensure UPX is available
where upx >nul 2>nul
if %errorlevel% neq 0 (
    echo UPX is not available. Please install UPX and ensure it is in your PATH.
    exit /b 1
)

REM Create the .spec file for PyInstaller
echo Creating .spec file...
pyi-makespec --onefile --name SayKey-server ^
    --hidden-import=sherpa_onnx ^
    --hidden-import=cttpunctuator ^
    main.py

REM Build the executable using UPX
echo Building executable...
pyinstaller --clean SayKey-server.spec

REM Check if build was successful
if exist "dist\SayKey-server.exe" (
    echo Build successful! Executable is located at dist\SayKey-server.exe

    REM Copy specific folders to the executable directory
    echo Copying necessary folders to the executable directory...
    mkdir "dist\sherpa-onnx"
    copy "sherpa-onnx\model.int8.onnx" "dist\sherpa-onnx\"
    copy "sherpa-onnx\tokens.txt" "dist\sherpa-onnx\"
    
    mkdir "dist\punc-onnx"
    copy "punc-onnx\configuration.json" "dist\punc-onnx\"
    copy "punc-onnx\punc.bin" "dist\punc-onnx\"
    copy "punc-onnx\punc.onnx" "dist\punc-onnx\"

    echo Build process completed. Necessary files have been copied to the executable directory.
) else (
    echo Build failed. Please check the error messages above.
)

REM Deactivate the virtual environment
deactivate

pause
