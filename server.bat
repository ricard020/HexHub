@echo off
cd /d %~dp0
title HexHub Server
echo ========================================
echo   Iniciando HexHub - Gestor de Colores
echo   URL: http://localhost:3000
echo ========================================
echo.
start http://localhost:3000
node server.js
pause
