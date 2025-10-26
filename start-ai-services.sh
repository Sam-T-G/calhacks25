#!/bin/bash

# DoGood AI Services Startup Script
# This script starts the MCP server with AI integration enabled

set -e

echo "🚀 Starting DoGood AI Services..."
echo ""

# Check if we're in the right directory
if [ ! -d "mcp-server" ]; then
    echo "❌ Error: Please run this script from the calhacks25 directory"
    exit 1
fi

# Start MCP Server
echo "📡 Starting MCP Server with AI integration..."
cd mcp-server

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
source venv/bin/activate
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one with ANTHROPIC_API_KEY"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "Starting MCP Server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
python3 server.py
