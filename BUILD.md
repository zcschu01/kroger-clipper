# Production Build Guide

## Overview

This extension has no build process or dependencies. The source files are production-ready as-is.

## Pre-Release Checklist

### 1. Version Update

Update `manifest.json`:
```json
"version": "1.0.0"
```

Use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### 2. Testing

Run all manual tests to ensure everything works:

**Content Script Tests:**
```bash
# See run-tests.md for detailed instructions
# Navigate to https://www.kroger.com/savings/cl/coupons/
# Paste clipper.js, then clipper.test.js
# Run: runAllClipperTests()
```

**Popup Tests:**
```bash
# Open extension popup
# Right-click → Inspect
# Paste popup.test.js
# Run: runAllPopupTests()
```

**Manual Verification:**
1. Load extension in Chrome (`chrome://extensions/`)
2. Navigate to Kroger coupons page
3. Test category filtering
4. Verify clipping workflow completes
5. Check that popup closes properly
6. Verify 250 coupon limit handling

### 3. Create Production Build

```bash
# Create distribution directory
mkdir -p dist dist/icons

# Copy production files (no tests, no docs)
cp manifest.json dist/
cp clipper.js dist/
cp popup.html dist/
cp popup.js dist/
cp icons/*.png dist/icons/
cp LICENSE dist/
cp README.md dist/
```

### 4. Package for Distribution

**For Chrome Web Store:**
```bash
cd dist
zip -r ../kroger-clipper-v1.0.0.zip .
cd ..
```

**For Firefox Add-ons:**
```bash
cd dist
zip -r ../kroger-clipper-v1.0.0-firefox.zip .
cd ..
```

## Files Included in Production Build

### Required Files
- `manifest.json` - Extension manifest
- `clipper.js` - Content script
- `popup.html` - Popup UI
- `popup.js` - Popup logic
- `icons/icon-48.png` - 48x48 icon
- `icons/icon-96.png` - 96x96 icon

### Optional Files
- `LICENSE` - License information
- `README.md` - Basic description

### Excluded from Build
- `clipper.test.js` - Test file
- `popup.test.js` - Test file
- `TESTING.md` - Testing documentation
- `run-tests.md` - Test instructions
- `CLAUDE.md` - Development instructions
- `BUILD.md` - This file
- `.git/` - Git repository
- `.gitignore` - Git ignore rules

## Deployment

### Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `kroger-clipper-v1.0.0.zip`
4. Fill in store listing:
   - **Title**: Kroger Clipper
   - **Summary**: Automatically clips all available Kroger coupons with customizable category filters
   - **Description**: See STORE_LISTING.md (if created)
   - **Category**: Shopping
   - **Language**: English
5. Upload screenshots (recommended: 1280x800 or 640x400)
6. Set privacy practices
7. Submit for review

### Firefox Add-ons

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a New Add-on"
3. Upload `kroger-clipper-v1.0.0-firefox.zip`
4. Fill in listing information
5. Submit for review

## Version History

### v1.0.0 (Initial Release)
- Dynamic category discovery from Kroger's filter UI
- Category-based coupon filtering
- "Any enabled category allows" filter logic
- Accurate eligible coupon counting
- Progress tracking with final count display
- 250 coupon limit handling
- Stop-on-close functionality
- Filter preferences persistence

## Post-Release

### Monitor for Issues

1. Check extension reviews
2. Monitor user feedback
3. Test on new Kroger site updates
4. Watch for DOM structure changes

### Updating

For any code changes:
1. Increment version in `manifest.json`
2. Run full test suite
3. Create new build
4. Upload to stores
5. Wait for review approval

## Notes

- No minification required (code is already small and readable)
- No transpilation needed (modern JavaScript)
- No dependencies to bundle
- Source maps not necessary for debugging (source is readable)
- The extension works offline once loaded on the Kroger page
