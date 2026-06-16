@echo off
title MeuPhone AI Buddy Server
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERRO] Node.js nao esta instalado.
  echo.
  echo 1. Descarrega e instala em: https://nodejs.org/  ^(versao LTS^)
  echo 2. Fecha e reabre o terminal / Cursor
  echo 3. Corre este ficheiro outra vez
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo A instalar dependencias...
  call npm install
  if errorlevel 1 (
    echo Falha no npm install.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  echo.
  echo [AVISO] Ficheiro .env em falta.
  echo Cria .env com: GEMINI_API_KEY=a_tua_chave
  echo.
)

echo.
echo Servidor a iniciar em http://localhost:3001
echo Abre o browser nesse endereco ^(NAO abras o HTML com duplo-clique^)
echo Para parar: Ctrl+C
echo.

node server.js
pause
