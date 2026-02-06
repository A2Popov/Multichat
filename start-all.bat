@echo off
echo ========================================
echo   MultiChat - Starting All Services
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.
echo Backend: http://localhost:8008
echo Frontend: http://localhost:3000
echo.
echo Все API запросы через порт 3000 будут проксироваться на 8008
echo.
echo Для создания туннеля используйте:
echo   cloudflared tunnel --url http://localhost:3000
echo.
echo Close this window to stop all services
echo ========================================
echo.

:: Start backend in new window
start "MultiChat Backend" cmd /c "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8008"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
start "MultiChat Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ✅ Сервисы запущены в отдельных окнах!
echo.
echo 📡 Для шаринга создайте туннель на порт 3000
echo    Команда: cloudflared tunnel --url http://localhost:3000
echo.
pause
