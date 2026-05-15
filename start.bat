@echo off
:: 🚀 [시스템 통합 실행기] 
:: 이 파일을 더블 클릭하면 노드 서버가 가동되고 대시보드 브라우저가 자동으로 열립니다.
:: Use pushd for absolute path reliability
pushd "%~dp0"
title SOS_Server

echo Starting Smart Operations Suite...
start http://localhost:3000

:: Piping the core engine ensures environment compatibility
type core\server_engine.js | node

pause
