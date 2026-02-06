@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              MultiChat - Быстрый старт                     ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  Выберите режим запуска:                                   ║
echo ║                                                            ║
echo ║  1. Запустить оба сервера (Backend + Frontend)             ║
echo ║  2. Только Backend (порт 8000)                             ║
echo ║  3. Только Frontend (порт 3000)                            ║
echo ║                                                            ║
echo ║  0. Выход                                                  ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
choice /c 1230 /n /m "Ваш выбор: "

if errorlevel 4 goto :end
if errorlevel 3 goto :frontend
if errorlevel 2 goto :backend
if errorlevel 1 goto :all

:all
echo.
echo Запускаю оба сервера...
call start-all.bat
goto :end

:backend
echo.
echo Запускаю Backend...
call start-backend.bat
goto :end

:frontend
echo.
echo Запускаю Frontend...
call start-frontend.bat
goto :end

:end
exit /b
