@echo off
chcp 65001 > nul
echo ========================================================
echo 🚀 TRAFFIC INSIGHT 대시보드를 시작합니다...
echo ========================================================
echo.

:: 기본 설치 경로 PATH 자동 보정
if exist "C:\Program Files\nodejs\npm.cmd" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

:: Node.js / npm 설치 여부 검사
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [안내] 시스템에 Node.js (npm)가 감지되지 않았습니다.
    echo 이 컴퓨터에서 처음 구동하시는 경우, https://nodejs.org 에서
    echo Node.js LTS 버전을 설치하신 후 다시 실행해 주세요!
    echo.
    pause
    exit /b
)

:: node_modules 미존재 시 자동 설치 (다른 PC에서 파일만 복사해 온 경우 대응)
if not exist "node_modules\" (
    echo [안내] 최초 실행 또는 패키지 폴더가 감지되지 않아 의존성을 설치합니다...
    echo 잠시만 기다려주세요 (1~2분 소요)
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [오류] 패키지 설치에 실패했습니다. 인터넷 연결을 확인해 주세요.
        pause
        exit /b
    )
    echo [완료] 패키지 설치가 완료되었습니다!
    echo.
)

echo 로컬 서버를 구동 중입니다. 잠시만 기다려주세요!
echo (서버가 준비되면 기본 웹 브라우저가 자동으로 열립니다.)
echo.
echo 종료하시려면 이 창을 닫거나 Ctrl+C를 누르세요.
echo.

call npm run dev -- --open

pause
