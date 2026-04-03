@echo off
setlocal EnableDelayedExpansion

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

set STATUS_PYTHON=Unknown
set STATUS_GCC=Unknown

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
    winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    echo [OK] Python installed
) else (
    echo [SKIPPED] Python installation skipped
    set STATUS_PYTHON=Skipped
)

goto check_gcc

:python_ok
for /f "tokens=2" %%i in ('py --version 2^>nul') do set PYTHON_VER=%%i
echo [OK] Python %PYTHON_VER% found
set STATUS_PYTHON= Already installed (%PYTHON_VER%)

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
    
    winget install MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements --wait
    C:\msys64\usr\bin\bash.exe -lc "pacman -S --noconfirm mingw-w64-ucrt-x86_64-gcc"
    
    echo Configuring Environment Variables ^(PATH^)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); if ($userPath -notmatch 'C:\\msys64\\ucrt64\\bin') { [Environment]::SetEnvironmentVariable('Path', $userPath + ';C:\msys64\ucrt64\bin', 'User') }"

    set "GCC_VER=Latest"
    for /f "delims=" %%i in ('C:\msys64\ucrt64\bin\gcc.exe -dumpfullversion 2^>nul') do set "GCC_VER=%%i"
   
    echo [OK] GCC !GCC_VER! installed and added to PATH!
    set "STATUS_GCC=Installed (!GCC_VER!)"
) else (
    echo [SKIPPED] GCC installation skipped
    set STATUS_GCC=Skipped
)

goto final_check

:gcc_ok
REM Get already installed GCC version
set "GCC_VER=Unknown"
for /f "delims=" %%i in ('gcc -dumpfullversion 2^>nul') do set "GCC_VER=%%i"
if "%GCC_VER%"=="Unknown" (
    for /f "delims=" %%i in ('gcc -dumpversion 2^>nul') do set "GCC_VER=%%i"
)
echo [OK] GCC %GCC_VER% found
set "STATUS_GCC=Already installed (%GCC_VER%)"

REM ========================================
REM STEP 3: Summary
REM ========================================
:final_check
echo:
echo ========================================
echo         Summary
echo ========================================
echo:
echo Python: %STATUS_PYTHON%
echo GCC: %STATUS_GCC%
echo:
if "%STATUS_GCC%"=="Installed" (
    echo IMPORTANT: You must RESTART your Command Prompt or VS Code
    echo so they can recognize the new 'gcc' command.
    echo:
)
echo Press any key to close...
pause >nul
exit
