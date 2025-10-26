#!/bin/bash

# DoGood App - Development Startup Script
# This script starts all necessary services for local development

echo "🚀 Starting DoGood App Development Environment..."
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "⚠️  uv is not installed. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Start the LiveKit voice agent in the background
echo "🎤 Starting LiveKit Voice Agent..."
cd voice-agent
uv run agent.py dev &
AGENT_PID=$!
cd ..

# Wait a moment for the agent to initialize
sleep 3

# Start the API server and Vite dev server
echo "🌐 Starting API server and Vite..."
npm run dev

# Clean up on exit
trap "kill $AGENT_PID 2>/dev/null" EXIT
