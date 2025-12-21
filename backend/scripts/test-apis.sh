#!/bin/bash

# API Testing Script
# Usage: ./test-apis.sh

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing Kavach APIs..."
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "connected"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi
echo ""

# Test 2: Register User
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "test123",
    "name": "API Test User",
    "role": "student"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Registration passed${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 3: Login
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "test123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Login passed${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Profile (Protected Route)
echo "4. Testing Protected Route (Profile)..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Protected route passed${NC}"
else
    echo -e "${RED}❌ Protected route failed${NC}"
    echo "$PROFILE_RESPONSE"
fi
echo ""

# Test 5: List Schools
echo "5. Testing List Schools..."
SCHOOLS_RESPONSE=$(curl -s "$BASE_URL/api/schools")
if echo "$SCHOOLS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ List schools passed${NC}"
else
    echo -e "${RED}❌ List schools failed${NC}"
fi
echo ""

# Test 6: Geospatial Nearest (Add-on 1)
echo "6. Testing Geospatial Nearest Schools..."
NEAREST_RESPONSE=$(curl -s "$BASE_URL/api/schools/nearest?lat=28.6139&lng=77.2090&radius=5000")
if echo "$NEAREST_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Geospatial query passed${NC}"
else
    echo -e "${RED}❌ Geospatial query failed${NC}"
    echo "$NEAREST_RESPONSE"
fi
echo ""

# Test 7: List Modules
echo "7. Testing List Modules..."
MODULES_RESPONSE=$(curl -s "$BASE_URL/api/modules")
if echo "$MODULES_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ List modules passed${NC}"
else
    echo -e "${RED}❌ List modules failed${NC}"
fi
echo ""

echo "🎉 API Testing Complete!"
echo ""
echo "📝 Note: For full testing, see docs/PHASE_1.4.1_TESTING_GUIDE.md"

