#!/bin/bash

# Test sending a message to Poke
echo "Testing Poke message..."
curl -X POST "http://localhost:8001/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"send_poke_message","arguments":{"message":"Hello from DoGood! Testing Poke integration."}}}' \
  -s

echo -e "\n\nTesting activity suggestions..."
curl -X POST "http://localhost:8001/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_activity_suggestions","arguments":{"interests":"environment","time_available":60}}}' \
  -s

echo -e "\n\nTesting user stats..."
curl -X POST "http://localhost:8001/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_user_stats","arguments":{}}}' \
  -s
