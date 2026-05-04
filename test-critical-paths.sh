#!/bin/bash

echo "🔍 CEI Platform Critical Path Testing"
echo "======================================"
echo ""

BASE_URL="https://3000-4d10c8ab-49d0-4c17-b0f4-b001729ee35e.sandbox-service.public.prod.myninja.ai"

# Test 1: Homepage
echo "✓ Testing Homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Homepage: OK ($STATUS)"
else
  echo "  ❌ Homepage: FAILED ($STATUS)"
fi

# Test 2: Dashboard
echo "✓ Testing Dashboard..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Dashboard: OK ($STATUS)"
else
  echo "  ❌ Dashboard: FAILED ($STATUS)"
fi

# Test 3: Intelligence Channels
echo "✓ Testing Intelligence Channels..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/channels")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Intelligence Channels: OK ($STATUS)"
else
  echo "  ❌ Intelligence Channels: FAILED ($STATUS)"
fi

# Test 4: Backstage Community
echo "✓ Testing Backstage Community..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/backstage")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Backstage Community: OK ($STATUS)"
else
  echo "  ❌ Backstage Community: FAILED ($STATUS)"
fi

# Test 5: Credits & Reputation
echo "✓ Testing Credits & Reputation..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/credits")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Credits & Reputation: OK ($STATUS)"
else
  echo "  ❌ Credits & Reputation: FAILED ($STATUS)"
fi

# Test 6: My Contributions
echo "✓ Testing My Contributions..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/contributions")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ My Contributions: OK ($STATUS)"
else
  echo "  ❌ My Contributions: FAILED ($STATUS)"
fi

# Test 7: Admin Dashboard
echo "✓ Testing Admin Dashboard..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Admin Dashboard: OK ($STATUS)"
else
  echo "  ❌ Admin Dashboard: FAILED ($STATUS)"
fi

# Test 8: Channel Detail Page
echo "✓ Testing Channel Detail (Enrollment Reality)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/channels/enrollment-reality")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ Channel Detail: OK ($STATUS)"
else
  echo "  ❌ Channel Detail: FAILED ($STATUS)"
fi

echo ""
echo "======================================"
echo "✅ Critical Path Testing Complete"