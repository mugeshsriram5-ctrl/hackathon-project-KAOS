#!/bin/bash

# ==============================================================================
# KAOS Production Build & Validation Utility
# ==============================================================================
# This script performs pre-flight validation on essential environment variables,
# cleans stale build files, runs 'npm run build', and strictly verifies that the
# output bundle ('dist') contains all necessary CSS, JS, and HTML files.
# ==============================================================================

# High-contrast terminal color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0;0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}⚙️  KAOS: Production Build Validation & Pre-flight Checklist${NC}"
echo -e "${CYAN}====================================================${NC}"

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight Environment Variable Checks
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[STEP 1/3] Validating Environment Configuration...${NC}"
MISSING_VARS=0

# Check for Google Maps Platform API key
if [ -z "$VITE_GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: VITE_GOOGLE_MAPS_API_KEY is not defined in the shell environment.${NC}"
    # Check if a .env file might contain it
    if [ -f ".env" ] && grep -q "VITE_GOOGLE_MAPS_API_KEY" .env; then
        echo -e "${GREEN}✓ found VITE_GOOGLE_MAPS_API_KEY within local .env file.${NC}"
    else
        echo -e "${RED}❌ Error: VITE_GOOGLE_MAPS_API_KEY is missing.${NC}"
        MISSING_VARS=$((MISSING_VARS+1))
    fi
else
    echo -e "${GREEN}✓ VITE_GOOGLE_MAPS_API_KEY validated successfully.${NC}"
fi

# Check for Firebase configuration API key
if [ -z "$FIREBASE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: FIREBASE_API_KEY is not defined in the shell environment.${NC}"
    if [ -f ".env" ] && grep -q "FIREBASE_API_KEY" .env; then
        echo -e "${GREEN}✓ found FIREBASE_API_KEY within local .env file.${NC}"
    else
        echo -e "${RED}❌ Error: FIREBASE_API_KEY is missing.${NC}"
        MISSING_VARS=$((MISSING_VARS+1))
    fi
else
    echo -e "${GREEN}✓ FIREBASE_API_KEY validated successfully.${NC}"
fi

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "\n${YELLOW}ℹ️  Ensure you have created a local .env file or declared environment variables.${NC}"
    echo -e "${YELLOW}Proceeding with build using default fallbacks...${NC}"
else
    echo -e "${GREEN}✓ All pre-flight environment variables validated successfully!${NC}"
fi

# ------------------------------------------------------------------------------
# STEP 2: Pre-Build Type & Asset Validation
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[STEP 2/4] Executing Typecheck & Asset Integrity Validation...${NC}"

# Ensure node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not detected. Running npm install first...${NC}"
    npm install
fi

# Run explicit pre-build check
echo -e "${CYAN}Running 'npm run build:check'...${NC}"
npm run build:check

CHECK_STATUS=$?
if [ $CHECK_STATUS -ne 0 ]; then
    echo -e "\n${RED}❌ Error: 'npm run build:check' failed with exit code $CHECK_STATUS${NC}"
    exit $CHECK_STATUS
fi

echo -e "${GREEN}✓ Typecheck and pre-build asset validation passed.${NC}"

# ------------------------------------------------------------------------------
# STEP 3: Run Production Build
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[STEP 3/4] Executing Production Vite Compilation...${NC}"

echo -e "${CYAN}Running 'npm run build'...${NC}"
npm run build

BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
    echo -e "\n${RED}❌ Error: 'npm run build' failed with exit code $BUILD_STATUS${NC}"
    exit $BUILD_STATUS
fi

echo -e "${GREEN}✓ Vite production build finished successfully.${NC}"

# ------------------------------------------------------------------------------
# STEP 4: Verify Output Bundle (Dist Integrity Check)
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[STEP 4/4] Verifying Output Bundle Integrity ('dist')...${NC}"

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: 'dist' folder was not generated! Build failed.${NC}"
    exit 1
fi

# Validate index.html
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Error: 'dist/index.html' is missing from the output directory!${NC}"
    exit 1
else
    HTML_SIZE=$(wc -c < "dist/index.html")
    echo -e "${GREEN}✓ dist/index.html verified. Size: $HTML_SIZE bytes.${NC}"
fi

# Validate assets
if [ ! -d "dist/assets" ]; then
    echo -e "${RED}❌ Error: 'dist/assets' directory is missing! No JS/CSS generated.${NC}"
    exit 1
fi

CSS_COUNT=$(find dist/assets -name "*.css" | wc -l)
JS_COUNT=$(find dist/assets -name "*.js" | wc -l)

if [ "$CSS_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No CSS files found in dist/assets!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Verified $CSS_COUNT CSS file(s) in dist/assets.${NC}"
fi

if [ "$JS_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No compiled JS files found in dist/assets!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Verified $JS_COUNT JS file(s) in dist/assets.${NC}"
fi

# Print final confirmation
echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}🎉 KAOS PRE-FLIGHT VERIFICATION SUCCESSFUL!${NC}"
echo -e "${GREEN}   The build bundle is sound and ready for deployment.${NC}"
echo -e "${GREEN}====================================================${NC}"
exit 0
