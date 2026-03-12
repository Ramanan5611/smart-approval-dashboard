#!/bin/bash

# 🚀 Smart Approval Dashboard - Quick Deployment Script
# Usage: ./deploy.sh [local|network|vercel|railway]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version: $(node -v) ✓"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_status "npm version: $(npm -v) ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully ✓"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Created .env from .env.example. Please update with your values."
        else
            cat > .env << EOF
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GEMINI_API_KEY=your-gemini-api-key-here
EOF
            print_warning "Created .env file. Please update with your values."
        fi
    fi
    
    print_status "Environment setup completed ✓"
}

# Local deployment
deploy_local() {
    print_header "Local Deployment"
    
    check_node
    check_npm
    install_dependencies
    setup_environment
    
    print_status "Starting local deployment..."
    
    # Kill any existing processes on ports 3000 and 5000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    
    # Start backend
    print_status "Starting backend server..."
    npm run server &
    BACKEND_PID=$!
    
    sleep 3
    
    # Start frontend
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    sleep 3
    
    print_header "Deployment Complete!"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend:${NC} http://localhost:5000"
    echo -e "${GREEN}API Health:${NC} http://localhost:5000/api/health"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop servers${NC}"
    
    # Wait for user to stop
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
    wait
}

# Network deployment
deploy_network() {
    print_header "Network Deployment"
    
    check_node
    check_npm
    install_dependencies
    setup_environment
    
    # Get local IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    print_status "Your local IP: $LOCAL_IP"
    
    # Update environment for network access
    sed -i "s|localhost|$LOCAL_IP|g" .env
    
    # Update frontend API URL
    echo "VITE_API_URL=http://$LOCAL_IP:5000" > .env.local
    
    print_status "Updated environment for network access"
    
    # Kill existing processes
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    
    # Start servers
    print_status "Starting backend server..."
    npm run server &
    BACKEND_PID=$!
    
    sleep 3
    
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    sleep 3
    
    print_header "Network Deployment Complete!"
    echo -e "${GREEN}Frontend:${NC} http://$LOCAL_IP:3000"
    echo -e "${GREEN}Backend:${NC} http://$LOCAL_IP:5000"
    echo -e "${GREEN}API Health:${NC} http://$LOCAL_IP:5000/api/health"
    echo ""
    echo -e "${YELLOW}Other devices on your network can access using the above URLs${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop servers${NC}"
    
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
    wait
}

# Vercel deployment
deploy_vercel() {
    print_header "Vercel Deployment"
    
    check_node
    check_npm
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_status "Building frontend for production..."
    npm run build
    
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_header "Vercel Deployment Complete!"
    echo -e "${GREEN}Your app is now live on Vercel!${NC}"
    echo -e "${YELLOW}Don't forget to update your backend API URL in Vercel dashboard${NC}"
}

# Railway deployment
deploy_railway() {
    print_header "Railway Deployment"
    
    check_node
    check_npm
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_status "Logging into Railway..."
    railway login
    
    print_status "Initializing Railway project..."
    railway init
    
    print_status "Deploying to Railway..."
    railway up
    
    print_header "Railway Deployment Complete!"
    echo -e "${GREEN}Your app is now live on Railway!${NC}"
    echo -e "${YELLOW}Check your Railway dashboard for the live URL${NC}"
}

# Production deployment
deploy_production() {
    print_header "Production Deployment"
    
    check_node
    check_npm
    install_dependencies
    setup_environment
    
    print_status "Building for production..."
    npm run build
    
    print_status "Starting production server..."
    NODE_ENV=production npm start
    
    print_header "Production Deployment Complete!"
    echo -e "${GREEN}Server running in production mode${NC}"
}

# Health check
health_check() {
    print_header "Health Check"
    
    # Check backend
    if curl -s http://localhost:5000/api/health > /dev/null; then
        print_status "Backend health: ✓ OK"
    else
        print_error "Backend health: ✗ FAILED"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_status "Frontend health: ✓ OK"
    else
        print_error "Frontend health: ✗ FAILED"
    fi
    
    # Check processes
    if pgrep -f "node.*server-simple.js" > /dev/null; then
        print_status "Backend process: ✓ Running"
    else
        print_error "Backend process: ✗ Not running"
    fi
    
    if pgrep -f "vite" > /dev/null; then
        print_status "Frontend process: ✓ Running"
    else
        print_error "Frontend process: ✗ Not running"
    fi
}

# Show help
show_help() {
    echo -e "${BLUE}Smart Approval Dashboard - Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  local      Deploy locally (localhost)"
    echo "  network    Deploy on local network"
    echo "  vercel     Deploy to Vercel (frontend only)"
    echo "  railway    Deploy to Railway (full stack)"
    echo "  production Deploy in production mode"
    echo "  health     Check health of running services"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local       # Deploy on localhost"
    echo "  $0 network     # Deploy on local network"
    echo "  $0 vercel      # Deploy to Vercel"
    echo "  $0 railway     # Deploy to Railway"
    echo ""
}

# Main script logic
case "${1:-help}" in
    local)
        deploy_local
        ;;
    network)
        deploy_network
        ;;
    vercel)
        deploy_vercel
        ;;
    railway)
        deploy_railway
        ;;
    production)
        deploy_production
        ;;
    health)
        health_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
