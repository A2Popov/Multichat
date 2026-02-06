@echo off
echo ========================================
echo   MultiChat Backend Server
echo ========================================
echo.
echo Starting FastAPI backend on http://localhost:8008
echo.

cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8008

pause
