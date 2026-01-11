#!/bin/bash
echo "Testing login API..."
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"counselor@cams.com","password":"password123"}' \
  -c cookies.txt 2>&1 | grep -i "set-cookie\|location\|http"
