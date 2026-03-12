@echo off
REM 🚀 Smart Approval Dashboard - Quick Deployment Script for Windows
REM Usage: deploy.bat [local|network|vercel|railway|production|health]

setlocal enabledelayedexpansion

REM Colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %GREEN%[INFO]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:print_header
echo %BLUE%================================%NC%
echo %BLUE%%~1%NC%
echo %BLUE%================================%NC%
goto :eof

REM Check if Node.js is installed
:check_node
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i

if %NODE_MAJOR% LSS 18 (
    call :print_error "Node.js version 18 or higher is required. Current version: %NODE_VERSION%"
    exit /b 1
)

call :print_status "Node.js version: %NODE_VERSION% ✓"
goto :eof

REM Check if npm is installed
:check_npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :print_error "npm is not installed."
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
call :print_status "npm version: %NPM_VERSION% ✓"
goto :eof

REM Install dependencies
:install_dependencies
call :print_status "Installing dependencies..."
npm install
if errorlevel 1 (
    call :print_error "Failed to install dependencies."
    exit /b 1
)
call :print_status "Dependencies installed successfully ✓"
goto :eof

REM Setup environment
:setup_environment
call :print_status "Setting up environment..."

if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        call :print_warning "Created .env from .env.example. Please update with your values."
    ) else (
        echo NODE_ENV=production > .env
        echo PORT=5000 >> .env
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
        echo GEMINI_API_KEY=your-gemini-api-key-here >> .env
        call :print_warning "Created .env file. Please update with your values."
    )
)

call :print_status "Environment setup completed ✓"
goto :eof

REM Local deployment
:deploy_local
call :print_header "Local Deployment"

call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1
call :install_dependencies
if errorlevel 1 exit /b 1
call :setup_environment

call :print_status "Starting local deployment..."

REM Kill existing processes on ports 3000 and 5000
for /f "tokens=5" %%i in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%i >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %%i >nul 2>&1

REM Start backend
call :print_status "Starting backend server..."
start /B npm run server

timeout /t 3 /nobreak >nul

REM Start frontend
call :print_status "Starting frontend server..."
start /B npm run dev

timeout /t 3 /nobreak >nul

call :print_header "Deployment Complete!"
echo %GREEN%Frontend:%NC% http://localhost:3000
echo %GREEN%Backend:%NC% http://localhost:5000
echo %GREEN%API Health:%NC% http://localhost:5000/api/health
echo.
echo %YELLOW%Press Ctrl+C to stop servers%NC%

pause
goto :eof

REM Network deployment
:deploy_network
call :print_header "Network Deployment"

call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1
call :install_dependencies
if errorlevel 1 exit /b 1
call :setup_environment

REM Get local IP (Windows method)
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do set LOCAL_IP=%%i
set LOCAL_IP=%LOCAL_IP: =%

call :print_status "Your local IP: %LOCAL_IP%"

REM Update environment for network access
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'localhost', '%LOCAL_IP%' | Set-Content .env"
)

REM Update frontend API URL
echo VITE_API_URL=http://%LOCAL_IP%:5000 > .env.local

call :print_status "Updated environment for network access"

REM Kill existing processes
for /f "tokens=5" %%i in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%i >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %%i >nul 2>&1

REM Start servers
call :print_status "Starting backend server..."
start /B npm run server

timeout /t 3 /nobreak >nul

call :print_status "Starting frontend server..."
start /B npm run dev

timeout /t 3 /nobreak >nul

call :print_header "Network Deployment Complete!"
echo %GREEN%Frontend:%NC% http://%LOCAL_IP%:3000
echo %GREEN%Backend:%NC% http://%LOCAL_IP%:5000
echo %GREEN%API Health:%NC% http://%LOCAL_IP%:5000/api/health
echo.
echo %YELLOW%Other devices on your network can access using the above URLs%NC%
echo %YELLOW%Press Ctrl+C to stop servers%NC%

pause
goto :eof

REM Vercel deployment
:deploy_vercel
call :print_header "Vercel Deployment"

call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    call :print_status "Installing Vercel CLI..."
    npm install -g vercel
)

call :print_status "Building frontend for production..."
npm run build
if errorlevel 1 (
    call :print_error "Build failed."
    exit /b 1
)

call :print_status "Deploying to Vercel..."
vercel --prod

call :print_header "Vercel Deployment Complete!"
echo %GREEN%Your app is now live on Vercel!%NC%
echo %YELLOW%Don't forget to update your backend API URL in Vercel dashboard%NC%
goto :eof

REM Railway deployment
:deploy_railway
call :print_header "Railway Deployment"

call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    call :print_status "Installing Railway CLI..."
    npm install -g @railway/cli
)

call :print_status "Logging into Railway..."
railway login

call :print_status "Initializing Railway project..."
railway init

call :print_status "Deploying to Railway..."
railway up

call :print_header "Railway Deployment Complete!"
echo %GREEN%Your app is now live on Railway!%NC%
echo %YELLOW%Check your Railway dashboard for the live URL%NC%
goto :eof

REM Production deployment
:deploy_production
call :print_header "Production Deployment"

call :check_node
if errorlevel 1 exit /b 1
call :check_npm
if errorlevel 1 exit /b 1
call :install_dependencies
if errorlevel 1 exit /b 1
call :setup_environment

call :print_status "Building for production..."
npm run build
if errorlevel 1 (
    call :print_error "Build failed."
    exit /b 1
)

call :print_status "Starting production server..."
set NODE_ENV=production
npm start

call :print_header "Production Deployment Complete!"
echo %GREEN%Server running in production mode%NC%
goto :eof

REM Health check
:health_check
call :print_header "Health Check"

REM Check backend
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend health: ✗ FAILED"
) else (
    call :print_status "Backend health: ✓ OK"
)

REM Check frontend
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend health: ✗ FAILED"
) else (
    call :print_status "Frontend health: ✓ OK"
)

REM Check processes
tasklist | findstr "node.exe" >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend process: ✗ Not running"
) else (
    call :print_status "Backend process: ✓ Running"
)

tasklist | findstr "vite" >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend process: ✗ Not running"
) else (
    call :print_status "Frontend process: ✓ Running"
)
goto :eof

REM Show help
:show_help
echo %BLUE%Smart Approval Dashboard - Deployment Script for Windows%NC%
echo.
echo Usage: deploy.bat [COMMAND]
echo.
echo Commands:
echo   local       Deploy locally (localhost)
echo   network     Deploy on local network
echo   vercel      Deploy to Vercel (frontend only)
echo   railway     Deploy to Railway (full stack)
echo   production  Deploy in production mode
echo   health      Check health of running services
echo   help        Show this help message
echo.
echo Examples:
echo   deploy.bat local      # Deploy on localhost
echo   deploy.bat network    # Deploy on local network
echo   deploy.bat vercel     # Deploy to Vercel
echo   deploy.bat railway    # Deploy to Railway
echo.
goto :eof

REM Main script logic
if "%1"=="" goto show_help
if "%1"=="local" goto deploy_local
if "%1"=="network" goto deploy_network
if "%1"=="vercel" goto deploy_vercel
if "%1"=="railway" goto deploy_railway
if "%1"=="production" goto deploy_production
if "%1"=="health" goto health_check
if "%1"=="help" goto show_help
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

call :print_error "Unknown command: %1"
goto show_help
