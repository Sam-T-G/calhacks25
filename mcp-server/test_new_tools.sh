#!/bin/bash

echo "Testing Productivity Tasks..."
curl -X POST "http://localhost:8002/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_productivity_tasks","arguments":{}}}' \
  -s

echo -e "\n\nTesting Self Improvement Tasks..."
curl -X POST "http://localhost:8002/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_self_improvement_tasks","arguments":{}}}' \
  -s

echo -e "\n\nTesting Add Productivity Task..."
curl -X POST "http://localhost:8002/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add_productivity_task","arguments":{"title":"Finish CalHacks Project","category":"Work","xp":150}}}' \
  -s

echo -e "\n\nTesting Add Self Improvement Task..."
curl -X POST "http://localhost:8002/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"add_self_improvement_task","arguments":{"title":"Take a walk","description":"Fresh air helps creativity!","xp":50}}}' \
  -s
