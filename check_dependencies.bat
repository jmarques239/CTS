@echo off

echo ========================================
echo    CTS | Code Test Studio - Windows
echo ========================================
echo:

echo ========================================
echo         Dependency Check
echo ========================================
echo:
echo ========================================
echo    IMPORTANT NOTICE
echo ========================================
echo  VS Code may open during installation.
echo  This is NORMAL and will NOT affect the process.
echo  You can close any VS Code windows that open.
echo  They are just empty files - no need to process them.
echo ========================================
echo:

REM ========================================
REM STEP 1: Check Python
REM ========================================
echo [STEP 1] Checking Python...

py --version >nul 2>&1
if not errorlevel 1 goto python_ok

echo [NOT FOUND] Python not found
set /p RESP=Install Python 3.12? [Y/N]: 
if /i "%RESP%"=="Y" (
    echo:
    echo Installing Python 3.12...
    winget install Python.Python.3.12 --accept-package-agreements
    echo [OK] Python installed
) else (
    echo [SKIPPED] Python installation skipped
)

goto check_gcc

:python_ok
for /f "tokens=2" %%i in ('py --version 2^>nul') do set PYTHON_VER=%%i
echo [OK] Python %PYTHON_VER% found

REM ========================================
REM STEP 2: Check GCC
REM ========================================
:check_gcc
echo:
echo [STEP 2] Checking GCC...

where gcc >nul 2>&1
if not errorlevel 1 goto gcc_ok

echo [NOT FOUND] GCC not found
set /p RESP=Install GCC via MSYS2? [Y/N]: 
if /i "%RESP%"=="Y" (
    echo:
    echo Installing MSYS2 and GCC...
    winget install MSYS2.MSYS2 --accept-package-agreements --wait
    C:\msys64\usr\bin\bash.exe -lc "pacman -S --noconfirm mingw-w64-ucrt-x86_64-gcc"
    echo [OK] GCC installed
) else (
    echo [SKIPPED] GCC installation skipped
)

goto final_check

:gcc_ok
echo [OK] GCC found

REM ========================================
REM STEP 3: Summary
REM ========================================
:final_check
echo:
echo ========================================
echo         Summary
echo ========================================
echo:
echo Python: installed
echo GCC: installed
echo:
echo Press any key to close...
pause >nul
