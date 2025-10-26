#!/bin/bash

# Deployment Readiness Verification Script
# Run this before pushing to git

set -e

echo "🔍 Verifying deployment readiness..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking critical files..."

# Check vercel.json
if [ -f "vercel.json" ]; then
    if grep -q '"outputDirectory": "build"' vercel.json; then
        success "vercel.json configured correctly"
    else
        error "vercel.json outputDirectory should be 'build'"
    fi
else
    error "vercel.json not found"
fi

# Check package.json
if [ -f "package.json" ]; then
    if grep -q '"build": "vite build"' package.json; then
        success "package.json build script correct"
    else
        warning "package.json build script may not be correct"
    fi
else
    error "package.json not found"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env.local" .gitignore; then
        success ".gitignore includes .env.local"
    else
        error ".gitignore missing .env.local - SECRETS WILL BE COMMITTED!"
    fi
else
    error ".gitignore not found"
fi

echo ""
echo "2. Checking API endpoints..."

# Check LiveKit token endpoint
if [ -f "api/livekit-token.js" ]; then
    if grep -q "sessionId" api/livekit-token.js; then
        success "LiveKit token endpoint includes sessionId"
    else
        error "LiveKit token endpoint missing sessionId support"
    fi
else
    error "api/livekit-token.js not found"
fi

echo ""
echo "3. Testing build process..."

# Test build
if npm run build > /dev/null 2>&1; then
    success "Build successful"
else
    error "Build failed - run 'npm run build' to see errors"
fi

echo ""
echo "4. Checking for sensitive files..."

# Check if .env.local will be committed
if git ls-files --error-unmatch .env.local > /dev/null 2>&1; then
    error ".env.local is tracked by git! Remove it with: git rm --cached .env.local"
else
    success ".env.local not in git (good!)"
fi

# Check if mcp-server/.env will be committed
if git ls-files --error-unmatch mcp-server/.env > /dev/null 2>&1; then
    error "mcp-server/.env is tracked by git! Remove it with: git rm --cached mcp-server/.env"
else
    success "mcp-server/.env not in git (good!)"
fi

echo ""
echo "5. Checking environment variable template..."

if [ -f ".env.example" ]; then
    if grep -q "VITE_MCP_SERVER_URL" .env.example; then
        success ".env.example includes MCP server URL"
    else
        warning ".env.example missing VITE_MCP_SERVER_URL"
    fi
else
    warning ".env.example not found - create one for team reference"
fi

echo ""
echo "6. Verifying MCP server accessibility..."

# Test MCP server (with timeout)
if timeout 5 curl -s https://calhacks25-vhcq.onrender.com/mcp > /dev/null 2>&1; then
    success "MCP server is accessible"
else
    warning "MCP server may not be running or accessible"
    echo "  → Check: https://calhacks25-vhcq.onrender.com/mcp"
fi

echo ""
echo "7. Checking AI integration files..."

# Check productivity section
if [ -f "src/components/ProductivitySection.tsx" ]; then
    if grep -q "getAIProductivityTasks" src/components/ProductivitySection.tsx; then
        success "Productivity section has AI integration"
    else
        warning "Productivity section missing AI integration"
    fi
else
    error "ProductivitySection.tsx not found"
fi

# Check self-improve section
if [ -f "src/components/SelfImproveSection.tsx" ]; then
    if grep -q "getAISelfImprovementTasks" src/components/SelfImproveSection.tsx; then
        success "Self-Improve section has AI integration"
    else
        warning "Self-Improve section missing AI integration"
    fi
else
    error "SelfImproveSection.tsx not found"
fi

# Check MCP service
if [ -f "src/services/mcpService.ts" ]; then
    success "MCP service exists"
else
    error "MCP service not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Run: git add ."
    echo "3. Run: git commit -m 'Add AI integration'"
    echo "4. Run: git push origin main"
    echo ""
    echo "Vercel will automatically deploy! 🚀"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found.${NC}"
    echo "Review warnings above. You can still deploy."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found.${NC}"
    echo "Fix errors above before deploying."
    exit 1
fi
