#!/bin/bash

# Script to set up environment variables in Cloudflare Pages
# This needs to be run ONCE before the first deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Cloudflare Pages Environment Variables Setup${NC}"
echo ""

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN is not set${NC}"
  echo "Please set it with: export CLOUDFLARE_API_TOKEN=your_token"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo -e "${RED}❌ Error: CLOUDFLARE_ACCOUNT_ID is not set${NC}"
  echo "Please set it with: export CLOUDFLARE_ACCOUNT_ID=your_account_id"
  exit 1
fi

if [ -z "$CLOUDFLARE_PROJECT_NAME" ]; then
  echo -e "${RED}❌ Error: CLOUDFLARE_PROJECT_NAME is not set${NC}"
  echo "Please set it with: export CLOUDFLARE_PROJECT_NAME=your_project_name"
  exit 1
fi

# Check if required secrets are set
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL is not set${NC}"
  exit 1
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_KEY is not set${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All required environment variables are set${NC}"
echo ""

# Set environment variables using Wrangler
echo -e "${YELLOW}Setting environment variables in Cloudflare Pages...${NC}"
echo ""

# Function to set a secret
set_secret() {
  local name=$1
  local value=$2
  echo -e "Setting ${GREEN}${name}${NC}..."
  echo "$value" | npx wrangler pages secret put "$name" --project-name="$CLOUDFLARE_PROJECT_NAME"
}

# Set all required secrets
set_secret "SUPABASE_URL" "$SUPABASE_URL"
set_secret "SUPABASE_KEY" "$SUPABASE_KEY"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# Optional: Set OpenRouter variables if they exist
if [ -n "$OPENROUTER_API_KEY" ]; then
  set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY"
fi

if [ -n "$OPENROUTER_MODEL" ]; then
  set_secret "OPENROUTER_MODEL" "$OPENROUTER_MODEL"
fi

echo ""
echo -e "${GREEN}✅ All environment variables have been set successfully!${NC}"
echo ""
echo -e "${YELLOW}Note: You can also set these variables manually in Cloudflare Dashboard:${NC}"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Navigate to Workers & Pages"
echo "3. Select your project: $CLOUDFLARE_PROJECT_NAME"
echo "4. Go to Settings → Environment variables"
echo "5. Add variables for Production environment"

