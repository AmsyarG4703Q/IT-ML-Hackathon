@echo off
echo ====================================
echo  PlacementAI - Starting Backend
echo ====================================

cd /d "%~dp0"

echo [1/3] Checking Python...
python --version

echo [2/3] Starting Flask API on http://localhost:5000
echo        (Make sure MongoDB is running!)
echo.
echo  Tip: Start MongoDB with: mongod --dbpath C:\data\db
echo  Tip: Seed sample data first: python seed_data.py
echo.
python app.py

pause
